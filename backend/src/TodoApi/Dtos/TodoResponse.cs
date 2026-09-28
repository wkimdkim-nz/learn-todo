using TodoApi.Entities;

namespace TodoApi.Dtos;

public record TodoResponse(Guid Id, string Title, string? Description, Status Status);
