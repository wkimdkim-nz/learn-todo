using System.ComponentModel.DataAnnotations;
using TodoApi.Entities;

namespace TodoApi.Dtos;

// One body for both creating and renaming a Tag: either way, the only thing sent is the name.
public record TagNameRequest([Required, MaxLength(Tag.NameMaxLength)] string Name);
