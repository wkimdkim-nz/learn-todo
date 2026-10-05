using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using TodoApi.Data;

namespace TodoApi.Tests;

// Hosts the real API in memory, backed by its own empty in-memory SQLite database.
public class TodoApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Not Development, so Program.cs skips its own Migrate() and OpenAPI; CreateHost migrates instead.
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Drop the app's UseSqlite(connection string) setup so only ours below applies.
            services.RemoveAll<IDbContextOptionsConfiguration<TodoDbContext>>();

            // An in-memory database lives only while its connection is open, so the host keeps
            // one open connection and closes it when the host is disposed.
            services.AddSingleton(_ =>
            {
                var connection = new SqliteConnection("Data Source=:memory:");
                connection.Open();
                return connection;
            });
            services.AddDbContext<TodoDbContext>((provider, options) =>
                options.UseSqlite(provider.GetRequiredService<SqliteConnection>()));
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<TodoDbContext>().Database.Migrate();

        return host;
    }
}
