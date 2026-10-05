using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using TodoApi.Dtos;
using TodoApi.Entities;

namespace TodoApi.Tests.Endpoints;

// Each test gets its own host and its own empty database.
public class TodoEndpointsTests : IAsyncDisposable
{
    static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    readonly TodoApiFactory factory = new();
    readonly HttpClient client;

    public TodoEndpointsTests() => client = factory.CreateClient();

    public ValueTask DisposeAsync() => factory.DisposeAsync();

    [Fact]
    public async Task GetTodos_WhenNoneExist_ReturnsEmptyList()
    {
        Assert.Empty(await GetTodos());
    }

    [Fact]
    public async Task CreateTodo_ValidTitle_Returns201WithLocation()
    {
        var response = await client.PostAsJsonAsync(
            "/api/todos", new CreateTodoRequest("Buy milk", null), Json, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<TodoResponse>(Json, TestContext.Current.CancellationToken);
        Assert.Equal("Buy milk", created!.Title);
        Assert.Equal(Status.Active, created.Status);
        Assert.Equal($"/api/todos/{created.Id}", response.Headers.Location?.ToString());
    }

    [Fact]
    public async Task GetTodos_AfterSeveralCreates_KeepsCreationOrder()
    {
        await CreateTodo("First");
        await CreateTodo("Second");
        await CreateTodo("Third");

        var todos = await GetTodos();

        Assert.Equal(["First", "Second", "Third"], todos.Select(t => t.Title));
    }

    [Fact]
    public async Task GetTodos_Json_IsCamelCaseWithStringStatusAndNoPosition()
    {
        await CreateTodo("Buy milk");

        var json = await client.GetStringAsync("/api/todos", TestContext.Current.CancellationToken);

        var todo = JsonDocument.Parse(json).RootElement.EnumerateArray().Single();
        Assert.Equal(["id", "title", "description", "status"], todo.EnumerateObject().Select(p => p.Name));
        Assert.Equal("Active", todo.GetProperty("status").GetString());
    }

    async Task<TodoResponse> CreateTodo(string title)
    {
        var response = await client.PostAsJsonAsync(
            "/api/todos", new CreateTodoRequest(title, null), Json, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<TodoResponse>(Json, TestContext.Current.CancellationToken))!;
    }

    async Task<List<TodoResponse>> GetTodos() =>
        (await client.GetFromJsonAsync<List<TodoResponse>>("/api/todos", Json, TestContext.Current.CancellationToken))!;
}
