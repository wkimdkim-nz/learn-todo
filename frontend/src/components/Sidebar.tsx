import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { useAddTagMutation, useGetTagsQuery } from "../features/tags/tagsApi";

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-stone-200 bg-stone-100 p-4">
      <div className="text-lg font-semibold tracking-tight">Todo</div>

      <nav className="flex flex-col gap-0.5">
        <SectionLabel>Status</SectionLabel>
        <NavItem selected>Any status</NavItem>
        <NavItem>Active</NavItem>
        <NavItem>Completed</NavItem>
      </nav>

      <Tags />
    </aside>
  );
}

function Tags() {
  const { data: tags = [] } = useGetTagsQuery();
  const [addTag, { isLoading, error, reset }] = useAddTagMutation();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const labelId = useId();
  const errorId = useId();
  // Derived from the mutation on every render, so it clears when the next add starts.
  const errorMessage = error ? (nameError(error) ?? "Couldn't add that Tag.") : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // A second Enter while the first add is saving would hit a 409 from the first.
    if (isLoading) {
      return;
    }

    const result = await addTag({ name });
    // On failure the input stays open with the name, so it can be fixed and sent again.
    if (!result.error) {
      close();
    }
  }

  // Also clears the mutation, so a failed add's message goes with the input.
  function close() {
    setAdding(false);
    setName("");
    reset();
  }

  return (
    <section aria-labelledby={labelId} className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <SectionLabel id={labelId}>Tags</SectionLabel>
        <button
          type="button"
          aria-label="Add a Tag"
          onClick={() => setAdding(true)}
          className="mb-1 rounded px-1.5 text-stone-500 hover:bg-stone-200 hover:text-stone-800"
        >
          +
        </button>
      </div>

      <ul className="flex flex-col gap-0.5">
        {tags.map((tag) => (
          <li key={tag.id} className="rounded-md px-2 py-1.5 text-sm text-stone-600">
            {tag.name}
          </li>
        ))}
      </ul>

      {adding && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            aria-label="New Tag"
            aria-invalid={errorMessage !== undefined}
            aria-describedby={errorMessage ? errorId : undefined}
            placeholder="New Tag, Enter to save"
            // Opened by the + click, so the name can be typed straight away.
            autoFocus
            // Closes when the add succeeds, so a name typed meanwhile would be lost.
            readOnly={isLoading}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && close()}
            className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none aria-invalid:border-red-400"
          />
        </form>
      )}
      {errorMessage && (
        <p id={errorId} role="alert" className="px-2 text-xs text-red-700">
          {errorMessage}
        </p>
      )}
    </section>
  );
}

// The parts of the API's ProblemDetails bodies read here: a 409's detail, and a 400's
// messages keyed by the field they're about.
type Problem = {
  detail: string;
  errors: Record<string, string[]>;
};

// The API's message about the name, or undefined when the add failed for another reason.
function nameError(error: FetchBaseQueryError | SerializedError) {
  if (!("status" in error)) {
    return undefined;
  }
  // Guarded, because an error from elsewhere (a proxy, say) may have another body, or none.
  const problem = error.data as Partial<Problem> | null;
  if (error.status === 409) {
    return problem?.detail;
  }
  if (error.status === 400) {
    return problem?.errors?.name?.[0];
  }
  return undefined;
}

type SectionLabelProps = {
  id?: string;
  children: ReactNode;
};

function SectionLabel({ id, children }: SectionLabelProps) {
  return (
    <div
      id={id}
      className="mb-1 px-2 text-[11px] font-semibold tracking-wider text-stone-600 uppercase"
    >
      {children}
    </div>
  );
}

type NavItemProps = {
  selected?: boolean;
  children: ReactNode;
};

function NavItem({ selected = false, children }: NavItemProps) {
  return (
    <div
      className={`rounded-md px-2 py-1.5 text-sm ${
        selected ? "bg-white font-medium shadow-sm" : "text-stone-600"
      }`}
    >
      {children}
    </div>
  );
}
