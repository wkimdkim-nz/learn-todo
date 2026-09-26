# Todo

A single-list todo app for tracking things to do, labelling them with Tags, and marking them done.

## Language

### Todos

**Todo**:
One thing to do, with a required **Title**, an optional **Description**, a **Status**, and zero or more **Tags**.
_Avoid_: Task, Item, Note

**Title**:
The short, required name of a **Todo**.
_Avoid_: Name, Text

**Description**:
Optional longer free text that elaborates on a **Todo**.
_Avoid_: Notes, Details, Body

**Status**:
Whether a **Todo** is **Active** or **Completed**; every Todo has exactly one Status.
_Avoid_: Filter, State

**Active**:
The **Status** of a **Todo** that is not yet done.
_Avoid_: Open, Pending, Incomplete

**Completed**:
The **Status** of a **Todo** that has been marked done; it can be toggled back to **Active**.
_Avoid_: Done, Finished, Closed

### Ordering

**Position**:
A **Todo**'s place in the single, user-set order of the list; there is one order for all Todos, not one per **Tag**. A new Todo takes the last Position, and changing its **Status** never changes its Position.
_Avoid_: Order, Rank, Sort order, Priority

**Move**:
Changing a **Todo**'s **Position** one step up or down among the Todos currently shown, placing it just past its shown neighbour; only the moved Todo's place changes relative to the others, including those hidden by the **Status selection** or **Tag selection**. The first shown Todo cannot move up and the last cannot move down.
_Avoid_: Sort, Reorder, Drag

### Tags

**Tag**:
A user-managed label, identified by a unique name (ignoring case), that **Todos** can carry; a Todo has zero or more Tags and a Tag can be on many Todos. A Tag exists on its own, even when no Todo carries it; deleting it removes it from every Todo but never deletes a Todo.
_Avoid_: Category, Label, List, Project

### Viewing

**Status selection**:
The optional **Status** the shown **Todos** must have; when unset, Todos of either Status are shown.
_Avoid_: Filter, Tab, View mode, All

**Tag selection**:
The optional single **Tag** the shown **Todos** must carry; when unset, Todos are shown regardless of their Tags. Combines with the **Status selection**: a shown Todo matches both.
_Avoid_: Filter, Category

**Clear completed**:
Deleting, in one action, every **Completed** **Todo** that matches the current **Tag selection**.
_Avoid_: Purge, Archive
