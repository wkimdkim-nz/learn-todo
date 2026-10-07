using System.ComponentModel.DataAnnotations;
using TodoApi.Entities;

namespace TodoApi.Dtos;

public record CreateTodoRequest(
    [Required, MaxLength(Todo.TitleMaxLength)] string Title,
    [MaxLength(Todo.DescriptionMaxLength)] string? Description);
