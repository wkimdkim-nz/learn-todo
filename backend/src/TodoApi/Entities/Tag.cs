namespace TodoApi.Entities;

public class Tag
{
    public const int NameMaxLength = 50;

    public Guid Id { get; set; }
    public required string Name { get; set; }
    public ICollection<Todo> Todos { get; set; } = [];
}
