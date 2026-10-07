using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using TodoApi.Data;
using TodoApi.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = context =>
    {
        // .NET 10's validation keys errors by C# name ("Title"), unlike the camelCase JSON.
        // Delete this rewrite once .NET 12 keys them by JSON name itself.
        if (context.ProblemDetails is HttpValidationProblemDetails validation)
        {
            validation.Errors = validation.Errors.ToDictionary(
                error => JsonNamingPolicy.CamelCase.ConvertName(error.Key), error => error.Value);
        }
    });
builder.Services.AddValidation();
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddDbContext<TodoDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Todos")));

var app = builder.Build();

// Turns an unhandled exception into a 500 ProblemDetails body, without the exception's details.
app.UseExceptionHandler();

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
