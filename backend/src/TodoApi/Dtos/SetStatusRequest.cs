using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos;

// A string, not the Status enum: the JSON enum converter would also accept "completed", 1 and
// "Active, Completed". AllowedValues compares exactly, so only these two spellings get through.
public record SetStatusRequest(
    [Required, AllowedValues(nameof(Entities.Status.Active), nameof(Entities.Status.Completed))] string Status);
