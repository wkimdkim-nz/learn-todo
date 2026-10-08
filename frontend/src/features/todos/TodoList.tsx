import { useGetTodosQuery } from "./todosApi";
import type { Todo } from "./types";

export function TodoList() {
  const { data: todos, isLoading, isFetching, isError, refetch } = useGetTodosQuery();

  // isLoading is only the first load, before there is any list to show.
  if (isLoading) {
    return (
      <p role="status" className="px-6 py-4 text-sm text-stone-500">
        Loading Todos…
      </p>
    );
  }

  return (
    <div className="flex-1 overflow-auto px-3 py-2">
      {isError && <LoadError onRetry={() => refetch()} />}
      {!isError && todos?.length === 0 && (
        <p className="px-3 py-2 text-sm text-stone-500">No Todos yet.</p>
      )}
      {todos && todos.length > 0 && (
        // A refetch keeps the previous list on screen, dimmed until the new one arrives.
        <ul
          aria-busy={isFetching}
          className={`transition-opacity ${isFetching ? "opacity-60" : ""}`}
        >
          {todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} />
          ))}
        </ul>
      )}
    </div>
  );
}

type LoadErrorProps = {
  onRetry: () => void;
};

function LoadError({ onRetry }: LoadErrorProps) {
  return (
    <div
      role="alert"
      className="mb-2 flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <span>Couldn't load your Todos.</span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-white px-3 py-1 font-medium shadow-sm ring-1 ring-red-200 hover:bg-red-100"
      >
        Retry
      </button>
    </div>
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
