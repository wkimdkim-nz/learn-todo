import type { Todo } from "../features/todos/types";

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

  reset() {
    todos = [];
  },
};
