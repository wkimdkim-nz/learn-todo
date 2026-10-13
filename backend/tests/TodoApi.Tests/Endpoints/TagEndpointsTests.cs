using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using TodoApi.Dtos;

namespace TodoApi.Tests.Endpoints;

// Each test gets its own host and its own empty database.
public class TagEndpointsTests : IAsyncDisposable
{
    readonly TodoApiFactory factory = new();
    readonly HttpClient client;

    public TagEndpointsTests() => client = factory.CreateClient();

    public ValueTask DisposeAsync() => factory.DisposeAsync();

    [Fact]
    public async Task CreateTag_NewName_Returns201WithTrimmedName()
    {
        var response = await client.PostAsJsonAsync(
            "/api/tags", new TagNameRequest("  Work  "), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<TagResponse>(TestContext.Current.CancellationToken);
        Assert.Equal("Work", created!.Name);
        Assert.Equal($"/api/tags/{created.Id}", response.Headers.Location?.ToString());
        Assert.Equal([created], await GetTags());
    }

    [Fact]
    public async Task CreateTag_SameNameInDifferentCase_Returns409WithDetail()
    {
        await CreateTag("Work");

        var response = await client.PostAsJsonAsync(
            "/api/tags", new TagNameRequest("WORK"), TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(TestContext.Current.CancellationToken);
        Assert.Equal("A Tag named \"Work\" already exists.", problem!.Detail);
        Assert.Equal(["Work"], (await GetTags()).Select(t => t.Name));
    }

    [Fact]
    public async Task GetTags_SeveralTags_ListsThemAlphabeticallyIgnoringCase()
    {
        await CreateTag("work");
        await CreateTag("Errands");
        await CreateTag("bills");
        await CreateTag("Home");

        var tags = await GetTags();

        // A case-sensitive sort would put every capital first: Errands, Home, bills, work.
        Assert.Equal(["bills", "Errands", "Home", "work"], tags.Select(t => t.Name));
    }

    [Fact]
    public async Task RenameTag_CaseOnlyChange_Returns200WithNewName()
    {
        var created = await CreateTag("work");

        var response = await RenameTag(created.Id, "Work");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var expected = created with { Name = "Work" };
        Assert.Equal(expected, await response.Content.ReadFromJsonAsync<TagResponse>(TestContext.Current.CancellationToken));
        Assert.Equal([expected], await GetTags());
    }

    [Fact]
    public async Task RenameTag_NameOfAnotherTagInDifferentCase_Returns409()
    {
        await CreateTag("Work");
        var home = await CreateTag("Home");

        var response = await RenameTag(home.Id, "work");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(["Home", "Work"], (await GetTags()).Select(t => t.Name));
    }

    [Fact]
    public async Task DeleteTag_ExistingTag_Returns204AndTheSecondDeleteReturns404()
    {
        var work = await CreateTag("Work");
        await CreateTag("Home");

        var first = await client.DeleteAsync($"/api/tags/{work.Id}", TestContext.Current.CancellationToken);
        var second = await client.DeleteAsync($"/api/tags/{work.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, second.StatusCode);
        Assert.Equal(["Home"], (await GetTags()).Select(t => t.Name));
    }

    async Task<TagResponse> CreateTag(string name)
    {
        var response = await client.PostAsJsonAsync(
            "/api/tags", new TagNameRequest(name), TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<TagResponse>(TestContext.Current.CancellationToken))!;
    }

    Task<HttpResponseMessage> RenameTag(Guid id, string name) =>
        client.PutAsJsonAsync($"/api/tags/{id}", new TagNameRequest(name), TestContext.Current.CancellationToken);

    async Task<List<TagResponse>> GetTags() =>
        (await client.GetFromJsonAsync<List<TagResponse>>("/api/tags", TestContext.Current.CancellationToken))!;
}
