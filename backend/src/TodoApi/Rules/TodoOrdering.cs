using TodoApi.Entities;

namespace TodoApi.Rules;

public enum MoveSide
{
    Before,
    After,
}

/// <summary>
/// The Position changes for one Move: every other Todo with a Position from
/// <paramref name="ShiftFrom"/> to <paramref name="ShiftTo"/> (inclusive) shifts by
/// <paramref name="ShiftBy"/>, and the moved Todo takes <paramref name="NewPosition"/>.
/// The range is empty when <paramref name="ShiftFrom"/> is greater than <paramref name="ShiftTo"/>.
/// </summary>
public record MovePlan(int NewPosition, int ShiftFrom, int ShiftTo, int ShiftBy);

public static class TodoOrdering
{
    /// <summary>
    /// Plans a Move that puts <paramref name="moved"/> right before or after <paramref name="target"/>.
    /// Only the Todos between the two shift, each by one, so every other Todo keeps its place
    /// relative to the rest, including Todos the user can't see.
    /// </summary>
    /// <example>
    /// With the full list <c>A, h, B</c> and <c>h</c> hidden, Move up on <c>B</c> is a Move before
    /// <c>A</c>: <c>A</c> and <c>h</c> shift down one, <c>B</c> takes <c>A</c>'s Position, and the
    /// list becomes <c>B, A, h</c>.
    /// </example>
    public static MovePlan Move(Todo moved, Todo target, MoveSide side)
    {
        // Positions are unique, so a shared Position means the same Todo.
        if (moved.Position == target.Position)
        {
            throw new ArgumentException("A Todo can't move next to itself.", nameof(target));
        }

        if (moved.Position > target.Position)
        {
            // Up: the Todos from the landing spot to just above the moved Todo shift down one.
            var newPosition = side == MoveSide.Before ? target.Position : target.Position + 1;
            return new MovePlan(newPosition, newPosition, moved.Position - 1, +1);
        }
        else
        {
            // Down: the Todos from just below the moved Todo to the landing spot shift up one.
            var newPosition = side == MoveSide.Before ? target.Position - 1 : target.Position;
            return new MovePlan(newPosition, moved.Position + 1, newPosition, -1);
        }
    }
}
