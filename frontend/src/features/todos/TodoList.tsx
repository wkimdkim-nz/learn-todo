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
    <li className="flex items-center gap-3 rounded-md px-3 py-2">
      <input type="checkbox" className="size-4 accent-indigo-600" checked={completed} readOnly />
      <span className={`flex-1 truncate text-sm ${completed ? "text-stone-400 line-through" : ""}`}>
        {todo.title}
        {todo.description && (
          <span className="ml-2 text-xs text-stone-400" title="Has a Description">
            ¶
          </span>
        )}
      </span>
    </li>
  );
}
