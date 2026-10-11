import type { Status, Todo } from "../features/todos/types";

// The fake API's data: Todos held in memory. Tests seed it, the handlers
// answer from it, and setupTests resets it after each test.
let todos: Todo[] = [];

export const db = {
  allTodos: () => todos,

  // Adds a Todo for each set of overrides, filling in the rest.
  seedTodos(...overrides: Partial<Todo>[]) {
    const seeded = overrides.map((override) => ({
      id: crypto.randomUUID(),
      title: "A Todo",
      description: null,
      status: "Active" as const,
      ...override,
    }));
    todos.push(...seeded);
  },

  // Returns the changed Todo, or undefined when there's no Todo with that id.
  setStatus(id: string, status: Status) {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      todo.status = status;
    }
    return todo;
  },

  reset() {
    todos = [];
  },
};
