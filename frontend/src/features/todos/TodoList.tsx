import type { Todo } from "./types";

type TodoListProps = {
  todos: Todo[];
};

export function TodoList({ todos }: TodoListProps) {
  return (
    <ul className="flex-1 overflow-auto px-3 py-2">
      {todos.map((todo) => (
        <TodoRow key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

type TodoRowProps = {
  todo: Todo;
};

function TodoRow({ todo }: TodoRowProps) {
  const completed = todo.status === "Completed";

  return (
    <li className="flex items-center gap-2 rounded-md px-3 py-2">
      {/* The label wraps the checkbox so the Title becomes its accessible name. */}
      <label className="flex min-w-0 items-center gap-3">
        <input type="checkbox" className="size-4 accent-indigo-600" checked={completed} readOnly />
        <span className={`truncate text-sm ${completed ? "text-stone-500 line-through" : ""}`}>
          {todo.title}
        </span>
      </label>
      {todo.description && (
        <span className="text-xs text-stone-500" title="Has a Description">
          ¶
        </span>
      )}
    </li>
  );
}
