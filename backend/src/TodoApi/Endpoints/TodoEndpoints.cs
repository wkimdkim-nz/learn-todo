using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Entities;

namespace TodoApi.Endpoints;

public static class TodoEndpoints
{
    public static IEndpointRouteBuilder MapTodoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/todos");

        group.MapGet("/", GetTodos);
        group.MapPost("/", CreateTodo);

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

    static async Task<Created<TodoResponse>> CreateTodo(CreateTodoRequest request, TodoDbContext db)
    {
        var description = request.Description?.Trim();
        var lastPosition = await db.Todos.MaxAsync(t => (int?)t.Position) ?? 0;

        var todo = new Todo
        {
            Title = request.Title.Trim(),
            Description = string.IsNullOrEmpty(description) ? null : description,
            Status = Status.Active,
            Position = lastPosition + 1,
        };

        db.Todos.Add(todo);
        await db.SaveChangesAsync();

        var response = new TodoResponse(todo.Id, todo.Title, todo.Description, todo.Status);
        return TypedResults.Created($"/api/todos/{todo.Id}", response);
    }
}
