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
        group.MapGet("/{id:guid}", GetTodo);
        group.MapPut("/{id:guid}", UpdateTodo);
        group.MapDelete("/{id:guid}", DeleteTodo);

        return app;
    }

    static async Task<Ok<List<TodoResponse>>> GetTodos(TodoDbContext db)
    {
        var todos = await db.Todos
            .OrderBy(t => t.Position)
            .Select(t => ToResponse(t))
            .ToListAsync();

        return TypedResults.Ok(todos);
    }

    static async Task<Created<TodoResponse>> CreateTodo(CreateTodoRequest request, TodoDbContext db)
    {
        var lastPosition = await db.Todos.MaxAsync(t => (int?)t.Position) ?? 0;

        var todo = new Todo
        {
            Title = request.Title.Trim(),
            Description = TrimOrNull(request.Description),
            Status = Status.Active,
            Position = lastPosition + 1,
        };

        db.Todos.Add(todo);
        await db.SaveChangesAsync();

        return TypedResults.Created($"/api/todos/{todo.Id}", ToResponse(todo));
    }

    static async Task<Results<Ok<TodoResponse>, NotFound>> GetTodo(Guid id, TodoDbContext db)
    {
        var todo = await db.Todos.FindAsync(id);

        return todo is null ? TypedResults.NotFound() : TypedResults.Ok(ToResponse(todo));
    }

    static async Task<Results<Ok<TodoResponse>, NotFound>> UpdateTodo(Guid id, UpdateTodoRequest request, TodoDbContext db)
    {
        var todo = await db.Todos.FindAsync(id);
        if (todo is null)
        {
            return TypedResults.NotFound();
        }

        todo.Title = request.Title.Trim();
        todo.Description = TrimOrNull(request.Description);
        await db.SaveChangesAsync();

        return TypedResults.Ok(ToResponse(todo));
    }

    static async Task<Results<NoContent, NotFound>> DeleteTodo(Guid id, TodoDbContext db)
    {
        var deleted = await db.Todos.Where(t => t.Id == id).ExecuteDeleteAsync();

        return deleted == 0 ? TypedResults.NotFound() : TypedResults.NoContent();
    }

    // A blank Description is stored as null, so "no Description" has one spelling.
    static string? TrimOrNull(string? description)
    {
        var trimmed = description?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    static TodoResponse ToResponse(Todo todo) => new(todo.Id, todo.Title, todo.Description, todo.Status);
}
