import type { Status, Todo } from "../features/todos/types";

// The fake API's data: Todos held in memory. Tests seed it, the handlers
// answer from it, and setupTests resets it after each test.
let todos: Todo[] = [];

// A new Todo with the API's defaults, overridden by whatever is given.
function newTodo(override: Partial<Todo>): Todo {
  return {
    id: crypto.randomUUID(),
    title: "A Todo",
    description: null,
    status: "Active",
    ...override,
  };
}

export const db = {
  allTodos: () => todos,

  // Adds a Todo for each set of overrides, filling in the rest.
  seedTodos(...overrides: Partial<Todo>[]) {
    todos.push(...overrides.map(newTodo));
  },

  // Adds a Todo last, the way the API does, and returns it.
  addTodo(title: string) {
    const todo = newTodo({ title: title.trim() });
    todos.push(todo);
    return todo;
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
