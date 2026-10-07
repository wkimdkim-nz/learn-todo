using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using TodoApi.Data;
using TodoApi.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddDbContext<TodoDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Todos")));

var app = builder.Build();

// Writes a ProblemDetails body into error responses that have none, such as a 404.
app.UseStatusCodePages();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();

    using var scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<TodoDbContext>().Database.Migrate();
}

app.MapTodoEndpoints();

app.Run();
