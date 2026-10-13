using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Entities;

namespace TodoApi.Endpoints;

public static class TagEndpoints
{
    public static IEndpointRouteBuilder MapTagEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tags");

        group.MapGet("/", GetTags);
        group.MapPost("/", CreateTag);
        group.MapPut("/{id:guid}", RenameTag);
        group.MapDelete("/{id:guid}", DeleteTag);

        return app;
    }

    static async Task<Ok<List<TagResponse>>> GetTags(TodoDbContext db)
    {
        var tags = await db.Tags
            // Ignores case, thanks to NOCASE: "home" comes before "Work".
            .OrderBy(t => t.Name)
            .Select(t => new TagResponse(t.Id, t.Name))
            .ToListAsync();

        return TypedResults.Ok(tags);
    }

    static async Task<Results<Created<TagResponse>, ProblemHttpResult>> CreateTag(TagNameRequest request, TodoDbContext db)
    {
        var name = request.Name.Trim();
        if (await FindByName(name, db) is { } existing)
        {
            return DuplicateName(existing);
        }

        var tag = new Tag { Name = name };

        db.Tags.Add(tag);
        await db.SaveChangesAsync();

        return TypedResults.Created($"/api/tags/{tag.Id}", ToResponse(tag));
    }

    static async Task<Results<Ok<TagResponse>, NotFound, ProblemHttpResult>> RenameTag(
        Guid id, TagNameRequest request, TodoDbContext db)
    {
        var tag = await db.Tags.FindAsync(id);
        if (tag is null)
        {
            return TypedResults.NotFound();
        }

        // Finding this same Tag isn't a duplicate, so a case-only rename like "work" → "Work" is allowed.
        var name = request.Name.Trim();
        if (await FindByName(name, db) is { } existing && existing.Id != id)
        {
            return DuplicateName(existing);
        }

        tag.Name = name;
        await db.SaveChangesAsync();

        return TypedResults.Ok(ToResponse(tag));
    }

    static async Task<Results<NoContent, NotFound>> DeleteTag(Guid id, TodoDbContext db)
    {
        var deleted = await db.Tags.Where(t => t.Id == id).ExecuteDeleteAsync();

        return deleted == 0 ? TypedResults.NotFound() : TypedResults.NoContent();
    }

    // Ignores case, thanks to NOCASE. The unique index is the backstop: if two requests race
    // past this check, the second save fails with a 500 rather than storing a duplicate.
    static Task<Tag?> FindByName(string name, TodoDbContext db) =>
        db.Tags.FirstOrDefaultAsync(t => t.Name == name);

    static ProblemHttpResult DuplicateName(Tag existing) =>
        TypedResults.Problem(
            detail: $"A Tag named \"{existing.Name}\" already exists.", statusCode: StatusCodes.Status409Conflict);

    static TagResponse ToResponse(Tag tag) => new(tag.Id, tag.Name);
}
