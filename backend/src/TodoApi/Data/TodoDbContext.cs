using Microsoft.EntityFrameworkCore;
using TodoApi.Entities;

namespace TodoApi.Data;

public class TodoDbContext(DbContextOptions<TodoDbContext> options) : DbContext(options)
{
    public DbSet<Todo> Todos => Set<Todo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Todo>(todo =>
        {
            todo.Property(t => t.Title).HasMaxLength(Todo.TitleMaxLength);
            todo.Property(t => t.Description).HasMaxLength(Todo.DescriptionMaxLength);
            todo.Property(t => t.Status).HasConversion<string>();

            // Not unique: SQLite checks UNIQUE row by row, so shifting Positions would collide mid-update.
            todo.HasIndex(t => t.Position);
        });
    }
}
