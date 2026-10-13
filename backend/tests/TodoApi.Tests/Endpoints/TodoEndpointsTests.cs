using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Entities;

namespace TodoApi.Tests.Endpoints;

// Each test gets its own host and its own empty database.
public class TodoEndpointsTests : IAsyncDisposable
{
    static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    readonly TodoApiFactory factory = new();
    readonly HttpClient client;

    public TodoEndpointsTests() => client = factory.CreateClient();

    public ValueTask DisposeAsync() => factory.DisposeAsync();

    [Fact]
    public async Task GetTodos_NoTodos_ReturnsEmptyList()
    {
        Assert.Empty(await GetTodos());
    }

    [Fact]
    public async Task CreateTodo_ValidTitle_Returns201WithLocation()
    {
        var response = await client.PostAsJsonAsync(
            "/api/todos", new CreateTodoRequest("Buy milk", null, []), JsonOptions, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<TodoResponse>(JsonOptions, TestContext.Current.CancellationToken);
        Assert.Equal("Buy milk", created!.Title);
        Assert.Equal(Status.Active, created.Status);
        Assert.Equal($"/api/todos/{created.Id}", response.Headers.Location?.ToString());
    }

    [Fact]
    public async Task GetTodos_AfterSeveralCreates_ListsEachNewTodoLast()
    {
        await CreateTodo("First");
        await CreateTodo("Second");
        await CreateTodo("Third");

        var todos = await GetTodos();

        Assert.Equal(["First", "Second", "Third"], todos.Select(t => t.Title));
    }

    [Fact]
    public async Task GetTodos_OneTodo_SerializesCamelCaseWithStringStatusAndNoPositionAndEmbedsTags()
    {
        var work = await CreateTag("Work");
        await CreateTodo("Buy milk", work.Id);

        var json = await client.GetStringAsync("/api/todos", TestContext.Current.CancellationToken);

        var todo = JsonDocument.Parse(json).RootElement.EnumerateArray().Single();
        Assert.Equal(["id", "title", "description", "status", "tags"], todo.EnumerateObject().Select(p => p.Name));
        Assert.Equal("Active", todo.GetProperty("status").GetString());
        var tag = todo.GetProperty("tags").EnumerateArray().Single();
        Assert.Equal(["id", "name"], tag.EnumerateObject().Select(p => p.Name));
        Assert.Equal("Work", tag.GetProperty("name").GetString());
    }

    [Fact]
    public async Task UpdateTodo_ExistingTodo_ReplacesTitleAndDescription()
    {
        var created = await CreateTodo("Buy milk");

        var response = await client.PutAsJsonAsync(
            $"/api/todos/{created.Id}", new UpdateTodoRequest("  Buy oat milk  ", "  From the corner shop  ", []),
            JsonOptions, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var expected = new TodoResponse(created.Id, "Buy oat milk", "From the corner shop", Status.Active, []);
        Assert.Equivalent(expected, await response.Content.ReadFromJsonAsync<TodoResponse>(JsonOptions, TestContext.Current.CancellationToken), strict: true);
        Assert.Equivalent(expected, await client.GetFromJsonAsync<TodoResponse>(
            $"/api/todos/{created.Id}", JsonOptions, TestContext.Current.CancellationToken), strict: true);
    }

    [Fact]
    public async Task CreateTodo_WithTagIds_ReturnsItsTagsSortedByNameWithDuplicatesIgnored()
    {
        var work = await CreateTag("Work");
        var errands = await CreateTag("errands");

        var created = await CreateTodo("Buy milk", work.Id, errands.Id, work.Id);

        // A case-sensitive sort would put "Work" first.
        Assert.Equal([errands, work], created.Tags);
        Assert.Equal([errands, work], (await GetTodos()).Single().Tags);
    }

    [Fact]
    public async Task UpdateTodo_NewTagIds_ReplacesTheTagsRatherThanAddingToThem()
    {
        var work = await CreateTag("Work");
        var home = await CreateTag("Home");
        var errands = await CreateTag("Errands");
        var created = await CreateTodo("Buy milk", work.Id, home.Id);

        var response = await client.PutAsJsonAsync(
            $"/api/todos/{created.Id}", new UpdateTodoRequest("Buy milk", null, [home.Id, errands.Id]),
            JsonOptions, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<TodoResponse>(JsonOptions, TestContext.Current.CancellationToken);
        Assert.Equal([errands, home], updated!.Tags);
        var fetched = await client.GetFromJsonAsync<TodoResponse>(
            $"/api/todos/{created.Id}", JsonOptions, TestContext.Current.CancellationToken);
        Assert.Equal([errands, home], fetched!.Tags);
    }

    [Fact]
    public async Task DeleteTodo_ExistingTodo_Returns204AndGetReturns404()
    {
        var created = await CreateTodo("Buy milk");

        var deleteResponse = await client.DeleteAsync($"/api/todos/{created.Id}", TestContext.Current.CancellationToken);
        var getResponse = await client.GetAsync($"/api/todos/{created.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
        Assert.Empty(await GetTodos());
    }

    [Fact]
    public async Task DeleteTag_OnTwoTodos_KeepsBothTodosWithoutIt()
    {
        var work = await CreateTag("Work");
        var home = await CreateTag("Home");
        await CreateTodo("Buy milk", work.Id, home.Id);
        await CreateTodo("Call the bank", work.Id);

        (await client.DeleteAsync($"/api/tags/{work.Id}", TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();

        var todos = await GetTodos();
        Assert.Equal(["Buy milk", "Call the bank"], todos.Select(t => t.Title));
        Assert.Equal([home], todos[0].Tags);
        Assert.Empty(todos[1].Tags);
    }

    [Fact]
    public async Task SetStatus_CompletedTwice_StaysCompletedAndKeepsItsTags()
    {
        var work = await CreateTag("Work");
        var created = await CreateTodo("Buy milk", work.Id);

        await SetStatus(created.Id, "Completed");
        var response = await SetStatus(created.Id, "Completed");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var expected = created with { Status = Status.Completed };
        Assert.Equivalent(expected, await response.Content.ReadFromJsonAsync<TodoResponse>(JsonOptions, TestContext.Current.CancellationToken), strict: true);
        Assert.Equivalent(expected, (await GetTodos()).Single(), strict: true);
    }

    [Fact]
    public async Task SetStatus_CompletedThenActive_KeepsPosition()
    {
        await CreateTodo("First");
        var second = await CreateTodo("Second");
        await CreateTodo("Third");

        (await SetStatus(second.Id, "Completed")).EnsureSuccessStatusCode();
        Assert.Equal(["First", "Second", "Third"], (await GetTodos()).Select(t => t.Title));

        (await SetStatus(second.Id, "Active")).EnsureSuccessStatusCode();
        var todos = await GetTodos();
        Assert.Equal(["First", "Second", "Third"], todos.Select(t => t.Title));
        Assert.All(todos, t => Assert.Equal(Status.Active, t.Status));
    }

    [Theory]
    [InlineData("""{"status":"Done"}""")]
    [InlineData("""{"status":"completed"}""")]
    [InlineData("""{"status":"Active, Completed"}""")]
    [InlineData("{}")]
    public async Task SetStatus_NotExactlyActiveOrCompleted_Returns400WithStatusError(string body)
    {
        var created = await CreateTodo("Buy milk");

        var response = await client.PutAsync(
            $"/api/todos/{created.Id}/status", new StringContent(body, Encoding.UTF8, "application/json"),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await ReadProblem(response)).GetProperty("errors");
        Assert.Equal(["status"], errors.EnumerateObject().Select(p => p.Name));
        Assert.Equal(Status.Active, (await GetTodos()).Single().Status);
    }

    [Fact]
    public async Task GetTodo_UnknownId_Returns404ProblemDetails()
    {
        var response = await client.GetAsync($"/api/todos/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(404, (await ReadProblem(response)).GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task UpdateTodo_UnknownId_Returns404()
    {
        var response = await client.PutAsJsonAsync(
            $"/api/todos/{Guid.NewGuid()}", new UpdateTodoRequest("Buy milk", null, []),
            JsonOptions, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTodo_BlankTitle_Returns400WithTitleError()
    {
        var response = await client.PostAsJsonAsync(
            "/api/todos", new CreateTodoRequest("   ", null, []), JsonOptions, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await ReadProblem(response)).GetProperty("errors");
        Assert.Equal(["title"], errors.EnumerateObject().Select(p => p.Name));
    }

    [Fact]
    public async Task CreateTodo_NoTagIds_Returns400WithTagIdsError()
    {
        var response = await client.PostAsync(
            "/api/todos", new StringContent("""{"title":"Buy milk"}""", Encoding.UTF8, "application/json"),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await ReadProblem(response)).GetProperty("errors");
        Assert.Equal(["tagIds"], errors.EnumerateObject().Select(p => p.Name));
    }

    [Fact]
    public async Task CreateTodo_UnknownTagId_Returns400NamingItAndCreatesNothing()
    {
        var work = await CreateTag("Work");
        var unknownId = Guid.NewGuid();

        var response = await client.PostAsJsonAsync(
            "/api/todos", new CreateTodoRequest("Buy milk", null, [work.Id, unknownId]),
            JsonOptions, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await ReadProblem(response)).GetProperty("errors");
        Assert.Equal(["tagIds"], errors.EnumerateObject().Select(p => p.Name));
        Assert.Equal([$"No Tag has the id {unknownId}."], errors.GetProperty("tagIds").EnumerateArray().Select(e => e.GetString()));
        Assert.Empty(await GetTodos());
    }

    [Fact]
    public async Task UpdateTodo_DescriptionOver2000Characters_Returns400WithDescriptionError()
    {
        var created = await CreateTodo("Buy milk");

        var response = await client.PutAsJsonAsync(
            $"/api/todos/{created.Id}", new UpdateTodoRequest("Buy milk", new string('a', Todo.DescriptionMaxLength + 1), []),
            JsonOptions, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await ReadProblem(response)).GetProperty("errors");
        Assert.Equal(["description"], errors.EnumerateObject().Select(p => p.Name));
        Assert.Null((await GetTodos()).Single().Description);
    }

    [Fact]
    public async Task CreateTodo_UnreadableBodyWhenBindingThrows_Returns400ProblemDetails()
    {
        // Development makes binding throw on a body it can't read, rather than answer 400 itself.
        var throwingClient = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            services.Configure<RouteHandlerOptions>(options => options.ThrowOnBadRequest = true))).CreateClient();

        var response = await throwingClient.PostAsync(
            "/api/todos", new StringContent("""{"title":123}""", Encoding.UTF8, "application/json"),
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(400, (await ReadProblem(response)).GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task GetTodos_DatabaseFails_Returns500ProblemDetails()
    {
        using (var scope = factory.Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<TodoDbContext>().Database
                .ExecuteSqlRawAsync("DROP TABLE \"Todos\"", TestContext.Current.CancellationToken);
        }

        var response = await client.GetAsync("/api/todos", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var problem = await ReadProblem(response);
        Assert.Equal(500, problem.GetProperty("status").GetInt32());
        Assert.DoesNotContain("Todos", problem.GetRawText());
    }

    async Task<TodoResponse> CreateTodo(string title, params Guid[] tagIds)
    {
        var response = await client.PostAsJsonAsync(
            "/api/todos", new CreateTodoRequest(title, null, tagIds), JsonOptions, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<TodoResponse>(JsonOptions, TestContext.Current.CancellationToken))!;
    }

    async Task<TagResponse> CreateTag(string name)
    {
        var response = await client.PostAsJsonAsync(
            "/api/tags", new TagNameRequest(name), TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<TagResponse>(TestContext.Current.CancellationToken))!;
    }

    Task<HttpResponseMessage> SetStatus(Guid id, string status) =>
        client.PutAsJsonAsync(
            $"/api/todos/{id}/status", new SetStatusRequest(status), JsonOptions, TestContext.Current.CancellationToken);

    async Task<List<TodoResponse>> GetTodos() =>
        (await client.GetFromJsonAsync<List<TodoResponse>>("/api/todos", JsonOptions, TestContext.Current.CancellationToken))!;

    static async Task<JsonElement> ReadProblem(HttpResponseMessage response)
    {
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        return JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).RootElement;
    }
}
