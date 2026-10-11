using Microsoft.EntityFrameworkCore;
using TodoApi.Entities;

namespace TodoApi.Data;

public class TodoDbContext(DbContextOptions<TodoDbContext> options) : DbContext(options)
{
    public DbSet<Todo> Todos => Set<Todo>();
    public DbSet<Tag> Tags => Set<Tag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Todo>(todo =>
        {
            todo.Property(t => t.Title).HasMaxLength(Todo.TitleMaxLength);
            todo.Property(t => t.Description).HasMaxLength(Todo.DescriptionMaxLength);
            todo.Property(t => t.Status).HasConversion<string>();

            // Not unique: SQLite checks UNIQUE row by row, so shifting Positions would collide mid-update.
            todo.HasIndex(t => t.Position);

            // No join entity: EF makes the link table itself.
            todo.HasMany(t => t.Tags).WithMany(t => t.Todos);
        });

        modelBuilder.Entity<Tag>(tag =>
        {
            // NOCASE makes SQLite compare and sort this column ignoring case, so the unique index,
            // the duplicate check and the alphabetical list all treat "Work" and "work" as equal.
            tag.Property(t => t.Name).HasMaxLength(Tag.NameMaxLength).UseCollation("NOCASE");
            tag.HasIndex(t => t.Name).IsUnique();
        });
    }
}
