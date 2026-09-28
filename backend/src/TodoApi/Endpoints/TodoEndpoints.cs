using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Dtos;

namespace TodoApi.Endpoints;

public static class TodoEndpoints
{
    public static IEndpointRouteBuilder MapTodoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/todos");

        group.MapGet("/", GetTodos);

        return app;
    }

    static async Task<Ok<List<TodoResponse>>> GetTodos(TodoDbContext db)
    {
        var todos = await db.Todos
            .OrderBy(t => t.Position)
            .Select(t => new TodoResponse(t.Id, t.Title, t.Description, t.Status))
            .ToListAsync();

        return TypedResults.Ok(todos);
    }
}
