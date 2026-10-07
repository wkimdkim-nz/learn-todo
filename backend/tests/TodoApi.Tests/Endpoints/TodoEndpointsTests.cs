using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
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
            "/api/todos", new CreateTodoRequest("Buy milk", null), JsonOptions, TestContext.Current.CancellationToken);

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
    public async Task GetTodos_OneTodo_SerializesCamelCaseWithStringStatusAndNoPosition()
    {
        await CreateTodo("Buy milk");

        var json = await client.GetStringAsync("/api/todos", TestContext.Current.CancellationToken);

        var todo = JsonDocument.Parse(json).RootElement.EnumerateArray().Single();
        Assert.Equal(["id", "title", "description", "status"], todo.EnumerateObject().Select(p => p.Name));
        Assert.Equal("Active", todo.GetProperty("status").GetString());
    }

    [Fact]
    public async Task UpdateTodo_ExistingTodo_ReplacesTitleAndDescription()
    {
        var created = await CreateTodo("Buy milk");

        var response = await client.PutAsJsonAsync(
            $"/api/todos/{created.Id}", new UpdateTodoRequest("  Buy oat milk  ", "  From the corner shop  "),
            JsonOptions, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var expected = new TodoResponse(created.Id, "Buy oat milk", "From the corner shop", Status.Active);
        Assert.Equal(expected, await response.Content.ReadFromJsonAsync<TodoResponse>(JsonOptions, TestContext.Current.CancellationToken));
        Assert.Equal(expected, await client.GetFromJsonAsync<TodoResponse>(
            $"/api/todos/{created.Id}", JsonOptions, TestContext.Current.CancellationToken));
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
            $"/api/todos/{Guid.NewGuid()}", new UpdateTodoRequest("Buy milk", null),
            JsonOptions, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTodo_BlankTitle_Returns400WithTitleError()
    {
        var response = await client.PostAsJsonAsync(
            "/api/todos", new CreateTodoRequest("   ", null), JsonOptions, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await ReadProblem(response)).GetProperty("errors");
        Assert.Equal(["title"], errors.EnumerateObject().Select(p => p.Name));
    }

    [Fact]
    public async Task UpdateTodo_DescriptionOver2000Characters_Returns400WithDescriptionError()
    {
        var created = await CreateTodo("Buy milk");

        var response = await client.PutAsJsonAsync(
            $"/api/todos/{created.Id}", new UpdateTodoRequest("Buy milk", new string('a', Todo.DescriptionMaxLength + 1)),
            JsonOptions, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = (await ReadProblem(response)).GetProperty("errors");
        Assert.Equal(["description"], errors.EnumerateObject().Select(p => p.Name));
        Assert.Null((await GetTodos()).Single().Description);
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

    async Task<TodoResponse> CreateTodo(string title)
    {
        var response = await client.PostAsJsonAsync(
            "/api/todos", new CreateTodoRequest(title, null), JsonOptions, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<TodoResponse>(JsonOptions, TestContext.Current.CancellationToken))!;
    }

    async Task<List<TodoResponse>> GetTodos() =>
        (await client.GetFromJsonAsync<List<TodoResponse>>("/api/todos", JsonOptions, TestContext.Current.CancellationToken))!;

    static async Task<JsonElement> ReadProblem(HttpResponseMessage response)
    {
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        return JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).RootElement;
    }
}
