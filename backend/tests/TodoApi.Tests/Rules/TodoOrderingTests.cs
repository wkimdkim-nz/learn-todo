using TodoApi.Entities;
using TodoApi.Rules;

namespace TodoApi.Tests.Rules;

public class TodoOrderingTests
{
    [Fact]
    public void Move_UpPastHiddenTodo_LeavesHiddenTodoInPlace()
    {
        var todos = Todos("A", "h", "B");

        var plan = TodoOrdering.Move(todos["B"], todos["A"], MoveSide.Before);

        Assert.Equal("B, A, h", OrderAfter(plan, todos["B"], todos));
    }

    [Fact]
    public void Move_DownPastHiddenTodo_LeavesHiddenTodoInPlace()
    {
        var todos = Todos("A", "h", "B");

        var plan = TodoOrdering.Move(todos["A"], todos["B"], MoveSide.After);

        Assert.Equal("h, B, A", OrderAfter(plan, todos["A"], todos));
    }

    [Theory]
    [InlineData("C", MoveSide.Before, "B", "A, C, B, D")]
    [InlineData("B", MoveSide.After, "C", "A, C, B, D")]
    [InlineData("D", MoveSide.After, "A", "A, D, B, C")]
    [InlineData("A", MoveSide.Before, "D", "B, C, A, D")]
    public void Move_NextToTarget_LandsRightBesideIt(string moved, MoveSide side, string target, string expected)
    {
        var todos = Todos("A", "B", "C", "D");

        var plan = TodoOrdering.Move(todos[moved], todos[target], side);

        Assert.Equal(expected, OrderAfter(plan, todos[moved], todos));
    }

    [Theory]
    [InlineData("D", MoveSide.Before, "A", "D, A, B, C")]
    [InlineData("A", MoveSide.After, "D", "B, C, D, A")]
    public void Move_PastFirstOrLast_BecomesFirstOrLast(string moved, MoveSide side, string target, string expected)
    {
        var todos = Todos("A", "B", "C", "D");

        var plan = TodoOrdering.Move(todos[moved], todos[target], side);

        Assert.Equal(expected, OrderAfter(plan, todos[moved], todos));
    }

    [Theory]
    [InlineData("C", MoveSide.Before, "B", "A, C, B")]
    [InlineData("A", MoveSide.After, "B", "B, A, C")]
    public void Move_WithGapsBetweenPositions_LandsRightBesideTarget(string moved, MoveSide side, string target, string expected)
    {
        var todos = Todos(("A", 1), ("B", 5), ("C", 9));

        var plan = TodoOrdering.Move(todos[moved], todos[target], side);

        Assert.Equal(expected, OrderAfter(plan, todos[moved], todos));
    }

    [Fact]
    public void Move_AfterTodoAlreadyAbove_ChangesNothing()
    {
        var todos = Todos("A", "B", "C");

        var plan = TodoOrdering.Move(todos["B"], todos["A"], MoveSide.After);

        Assert.Equal(todos["B"].Position, plan.NewPosition);
        Assert.True(plan.ShiftFrom > plan.ShiftTo, "No other Todo should shift.");
    }

    [Fact]
    public void Move_NextToItself_Throws()
    {
        var todos = Todos("A", "B");

        Assert.Throws<ArgumentException>(() => TodoOrdering.Move(todos["A"], todos["A"], MoveSide.Before));
    }

    // Todos named by Title, at Positions 1, 2, 3, ...
    static Dictionary<string, Todo> Todos(params string[] titles) =>
        Todos(titles.Select((title, i) => (title, i + 1)).ToArray());

    static Dictionary<string, Todo> Todos(params (string Title, int Position)[] todos) =>
        todos
            .Select(t => new Todo { Title = t.Title, Position = t.Position })
            .ToDictionary(t => t.Title);

    // Applies the plan the way the Move endpoint will in SQL, and lists the Titles in their new order.
    static string OrderAfter(MovePlan plan, Todo moved, Dictionary<string, Todo> todos)
    {
        int PositionAfter(Todo todo) =>
            todo == moved ? plan.NewPosition
            : todo.Position >= plan.ShiftFrom && todo.Position <= plan.ShiftTo ? todo.Position + plan.ShiftBy
            : todo.Position;

        var positions = todos.Values.Select(PositionAfter).ToList();
        Assert.Distinct(positions);

        return string.Join(", ", todos.Values.OrderBy(PositionAfter).Select(t => t.Title));
    }
}
