import type { Tag } from "../features/tags/types";
import type { Status, Todo } from "../features/todos/types";

// The fake API's data: Todos and Tags held in memory. Tests seed it, the
// handlers answer from it, and setupTests resets it after each test.
let todos: Todo[] = [];
let tags: Tag[] = [];

// A new Todo with the API's defaults, overridden by whatever is given.
function newTodo(override: Partial<Todo>): Todo {
  return {
    id: crypto.randomUUID(),
    title: "A Todo",
    description: null,
    status: "Active",
    tags: [],
    ...override,
  };
}

function newTag(name: string): Tag {
  return { id: crypto.randomUUID(), name };
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

  // Sorted by name ignoring case, like the API: "home" comes before "Work".
  allTags: () => tags.toSorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),

  seedTags(...names: string[]) {
    tags.push(...names.map(newTag));
  },

  // The Tag with this name in any case, the way the API's duplicate check finds it.
  findTag: (name: string) => tags.find((t) => t.name.toLowerCase() === name.trim().toLowerCase()),

  addTag(name: string) {
    const tag = newTag(name.trim());
    tags.push(tag);
    return tag;
  },

  reset() {
    todos = [];
    tags = [];
  },
};
