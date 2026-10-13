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
        group.MapPut("/{id:guid}/status", SetStatus);
        group.MapDelete("/{id:guid}", DeleteTodo);

        return app;
    }

    static async Task<Ok<List<TodoResponse>>> GetTodos(TodoDbContext db)
    {
        var todos = await TodosWithTags(db)
            .OrderBy(t => t.Position)
            .ToListAsync();

        return TypedResults.Ok(todos.Select(ToResponse).ToList());
    }

    static async Task<Results<Created<TodoResponse>, ValidationProblem>> CreateTodo(CreateTodoRequest request, TodoDbContext db)
    {
        var tags = await FindTags(request.TagIds, db);
        if (UnknownTagIds(request.TagIds, tags) is { } problem)
        {
            return problem;
        }

        var lastPosition = await db.Todos.MaxAsync(t => (int?)t.Position) ?? 0;

        var todo = new Todo
        {
            Title = request.Title.Trim(),
            Description = TrimOrNull(request.Description),
            Status = Status.Active,
            Position = lastPosition + 1,
            Tags = tags,
        };

        db.Todos.Add(todo);
        await db.SaveChangesAsync();

        return TypedResults.Created($"/api/todos/{todo.Id}", ToResponse(todo));
    }

    static async Task<Results<Ok<TodoResponse>, NotFound>> GetTodo(Guid id, TodoDbContext db)
    {
        var todo = await FindTodo(id, db);

        return todo is null ? TypedResults.NotFound() : TypedResults.Ok(ToResponse(todo));
    }

    static async Task<Results<Ok<TodoResponse>, NotFound, ValidationProblem>> UpdateTodo(
        Guid id, UpdateTodoRequest request, TodoDbContext db)
    {
        // Loads its current Tags too, so EF knows which link rows to delete when the set is replaced.
        var todo = await FindTodo(id, db);
        if (todo is null)
        {
            return TypedResults.NotFound();
        }

        var tags = await FindTags(request.TagIds, db);
        if (UnknownTagIds(request.TagIds, tags) is { } problem)
        {
            return problem;
        }

        todo.Title = request.Title.Trim();
        todo.Description = TrimOrNull(request.Description);
        todo.Tags = tags;
        await db.SaveChangesAsync();

        return TypedResults.Ok(ToResponse(todo));
    }

    // Sets the Status rather than toggling it, so sending the same request twice is safe.
    // Position is left alone: completing a Todo never moves it.
    static async Task<Results<Ok<TodoResponse>, NotFound>> SetStatus(Guid id, SetStatusRequest request, TodoDbContext db)
    {
        var todo = await FindTodo(id, db);
        if (todo is null)
        {
            return TypedResults.NotFound();
        }

        // Validation has already limited request.Status to an exact Status name, so this can't throw.
        todo.Status = Enum.Parse<Status>(request.Status);
        await db.SaveChangesAsync();

        return TypedResults.Ok(ToResponse(todo));
    }

    static async Task<Results<NoContent, NotFound>> DeleteTodo(Guid id, TodoDbContext db)
    {
        var deleted = await db.Todos.Where(t => t.Id == id).ExecuteDeleteAsync();

        return deleted == 0 ? TypedResults.NotFound() : TypedResults.NoContent();
    }

    // Each Todo with its Tags sorted by name, the order TodoResponse lists them in.
    static IQueryable<Todo> TodosWithTags(TodoDbContext db) =>
        db.Todos.Include(t => t.Tags.OrderBy(tag => tag.Name));

    static Task<Todo?> FindTodo(Guid id, TodoDbContext db) =>
        TodosWithTags(db).FirstOrDefaultAsync(t => t.Id == id);

    // Duplicate ids collapse to one Tag. Sorted like TodosWithTags, so a response built from them matches.
    static Task<List<Tag>> FindTags(IReadOnlyList<Guid> tagIds, TodoDbContext db) =>
        db.Tags.Where(t => tagIds.Contains(t.Id)).OrderBy(t => t.Name).ToListAsync();

    // A 400 naming each requested id that isn't a Tag, or null when every id is one.
    static ValidationProblem? UnknownTagIds(IReadOnlyList<Guid> tagIds, List<Tag> found)
    {
        var unknown = tagIds.Except(found.Select(t => t.Id)).ToList();
        if (unknown.Count == 0)
        {
            return null;
        }

        return TypedResults.ValidationProblem(new Dictionary<string, string[]>
        {
            ["tagIds"] = [.. unknown.Select(id => $"No Tag has the id {id}.")],
        });
    }

    // A blank Description is stored as null, so "no Description" has one spelling.
    static string? TrimOrNull(string? description)
    {
        var trimmed = description?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    static TodoResponse ToResponse(Todo todo) => new(
        todo.Id, todo.Title, todo.Description, todo.Status,
        todo.Tags.Select(tag => new TagResponse(tag.Id, tag.Name)).ToList());
}
