import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useId, useState, type FormEvent } from "react";
import { useAddTodoMutation } from "./todosApi";

export function QuickAdd() {
  const [title, setTitle] = useState("");
  const [addTodo, { isLoading, error }] = useAddTodoMutation();
  const errorId = useId();
  // Derived from the mutation on every render, so it clears when the next add starts.
  const message = error ? (titleError(error) ?? "Couldn't add that Todo.") : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // A second Enter while the first add is saving would add the Todo twice.
    if (isLoading) {
      return;
    }

    const result = await addTodo({ title, tagIds: [] });
    // On failure the input keeps the Title, so it can be fixed and sent again.
    // On success it clears, unless something new was typed while the add was saving.
    if (!result.error) {
      setTitle((current) => (current === title ? "" : current));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-stone-200 px-6 py-3">
      <input
        type="text"
        aria-label="Add a Todo"
        aria-invalid={message !== undefined}
        aria-describedby={message ? errorId : undefined}
        placeholder="Add a Todo…"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none aria-invalid:border-red-400"
      />
      {message && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-700">
          {message}
        </p>
      )}
    </form>
  );
}

// The API's 400 body for a rejected request: messages keyed by the field they're about.
type ValidationProblem = {
  errors: Record<string, string[]>;
};

// The API's message about the Title, or undefined when the add failed for another reason.
function titleError(error: FetchBaseQueryError | SerializedError) {
  if ("status" in error && error.status === 400) {
    return (error.data as ValidationProblem).errors.title?.[0];
  }
  return undefined;
}
