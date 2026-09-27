// PROTOTYPE variant B: "Sidebar + detail panel", styled with raw Tailwind utility classes.
// Three panes: a nav of Status/Tag selections (Tags are managed right there), the list with a
// title-only quick add, and a detail panel that edits whichever Todo is selected.
import { useState, type ReactNode } from 'react'
import type { Status, TodoStore } from '../store'

export const name = 'Sidebar + detail · Tailwind'

export function VariantB({ store }: { store: TodoStore }) {
  const { state, shown, counts } = store
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [quickTitle, setQuickTitle] = useState('')
  const selected = state.todos.find((t) => t.id === selectedId) ?? null

  const heading =
    [state.statusSelection, state.tagSelection && store.tagName(state.tagSelection)].filter(Boolean).join(' · ') ||
    'Everything'

  return (
    <div className="flex h-screen bg-stone-50 text-stone-800">
      {/* Sidebar: selections + Tag management */}
      <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-stone-200 bg-stone-100 p-4 pb-24">
        <div className="text-lg font-semibold tracking-tight">Todo</div>

        <nav className="flex flex-col gap-0.5">
          <SectionLabel>Status</SectionLabel>
          {([null, 'Active', 'Completed'] as (Status | null)[]).map((s) => (
            <NavItem
              key={s ?? 'any'}
              active={state.statusSelection === s}
              onClick={() => store.setStatusSelection(s)}
              count={s === null ? state.todos.length : s === 'Active' ? counts.active : counts.completed}
            >
              {s ?? 'Any status'}
            </NavItem>
          ))}
        </nav>

        <SidebarTags store={store} />
      </aside>

      {/* List */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h1 className="text-xl font-semibold">{heading}</h1>
          <button
            className="rounded-md px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-200 disabled:opacity-40 disabled:hover:bg-transparent"
            disabled={counts.clearable === 0}
            onClick={store.clearCompleted}
          >
            Clear completed ({counts.clearable})
          </button>
        </header>

        <form
          className="border-b border-stone-200 px-6 py-3"
          onSubmit={(e) => {
            e.preventDefault()
            store.addTodo(quickTitle, '', state.tagSelection ? [state.tagSelection] : [])
            setQuickTitle('')
          }}
        >
          <input
            className="w-full rounded-md border border-dashed border-stone-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-stone-400 focus:border-solid focus:border-indigo-400"
            placeholder={`+ Add a Todo${state.tagSelection ? ` tagged ${store.tagName(state.tagSelection)}` : ''} (Enter)`}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
          />
        </form>

        <ul className="flex-1 overflow-auto px-3 py-2 pb-24">
          {shown.length === 0 && <li className="px-3 py-8 text-center text-sm text-stone-400">Nothing here.</li>}
          {shown.map((todo) => {
            const isSel = todo.id === selectedId
            const done = todo.status === 'Completed'
            return (
              <li
                key={todo.id}
                onClick={() => setSelectedId(todo.id)}
                className={`group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 ${
                  isSel ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-stone-100'
                }`}
              >
                <input
                  type="checkbox"
                  className="size-4 accent-indigo-600"
                  checked={done}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => store.toggleStatus(todo.id)}
                />
                <span className={`flex-1 truncate text-sm ${done ? 'text-stone-400 line-through' : ''}`}>
                  {todo.title}
                  {todo.description && <span className="ml-2 text-xs text-stone-400">¶</span>}
                </span>
                <span className="flex gap-1">
                  {todo.tagIds.map((id) => (
                    <span key={id} className="rounded bg-stone-200 px-1.5 py-0.5 text-[11px] text-stone-600">
                      {store.tagName(id)}
                    </span>
                  ))}
                </span>
                <span className={`flex gap-0.5 ${isSel ? '' : 'invisible group-hover:visible'}`}>
                  <MoveButton store={store} id={todo.id} dir="up" />
                  <MoveButton store={store} id={todo.id} dir="down" />
                </span>
              </li>
            )
          })}
        </ul>
      </main>

      {/* Detail panel */}
      <section className="w-96 shrink-0 border-l border-stone-200 bg-white p-6 pb-24">
        {selected ? (
          // key resets the local form state when a different Todo is selected
          <Detail key={selected.id} store={store} id={selected.id} onClose={() => setSelectedId(null)} />
        ) : (
          <p className="mt-24 text-center text-sm text-stone-400">Select a Todo to see and edit it.</p>
        )}
      </section>
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{children}</div>
}

function NavItem({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${
        active ? 'bg-white font-medium shadow-sm' : 'text-stone-600 hover:bg-stone-200'
      }`}
    >
      <span className="truncate">{children}</span>
      <span className="text-xs text-stone-400">{count}</span>
    </button>
  )
}

function SidebarTags({ store }: { store: TodoStore }) {
  const { state } = store
  const [adding, setAdding] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const inputClass = 'w-full rounded border border-indigo-300 bg-white px-2 py-1 text-sm outline-none'

  return (
    <nav className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <SectionLabel>Tags</SectionLabel>
        <button
          className="mb-1 rounded px-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
          onClick={() => {
            setAdding(true)
            setValue('')
            setError(null)
          }}
          aria-label="Add Tag"
        >
          +
        </button>
      </div>

      <NavItem active={state.tagSelection === null} onClick={() => store.setTagSelection(null)} count={state.todos.length}>
        Any tag
      </NavItem>

      {state.tags.map((t) =>
        renamingId === t.id ? (
          <form
            key={t.id}
            onSubmit={(e) => {
              e.preventDefault()
              const err = store.renameTag(t.id, value)
              setError(err)
              if (!err) setRenamingId(null)
            }}
          >
            <input className={inputClass} value={value} autoFocus onChange={(e) => setValue(e.target.value)} onBlur={() => setRenamingId(null)} />
          </form>
        ) : (
          <div key={t.id} className="group relative">
            <NavItem
              active={state.tagSelection === t.id}
              onClick={() => store.setTagSelection(t.id)}
              count={store.counts.perTag(t.id)}
            >
              # {t.name}
            </NavItem>
            <div className="absolute top-1 right-7 hidden gap-1 group-hover:flex">
              <button
                className="rounded bg-stone-100 px-1 text-xs text-stone-500 hover:text-stone-800"
                onClick={() => {
                  setRenamingId(t.id)
                  setValue(t.name)
                  setError(null)
                }}
              >
                rename
              </button>
              <button className="rounded bg-stone-100 px-1 text-xs text-red-500 hover:text-red-700" onClick={() => store.deleteTag(t.id)}>
                delete
              </button>
            </div>
          </div>
        ),
      )}

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const err = store.addTag(value)
            setError(err)
            if (!err) setAdding(false)
          }}
        >
          <input
            className={inputClass}
            placeholder="New Tag, Enter to save"
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
          />
        </form>
      )}
      {error && <p className="px-2 text-xs text-red-600">{error}</p>}
    </nav>
  )
}

function MoveButton({ store, id, dir }: { store: TodoStore; id: string; dir: 'up' | 'down' }) {
  return (
    <button
      className="rounded px-1.5 text-stone-400 hover:bg-white hover:text-stone-800 disabled:opacity-25 disabled:hover:bg-transparent"
      disabled={!store.canMove(id, dir)}
      onClick={(e) => {
        e.stopPropagation()
        store.move(id, dir)
      }}
      aria-label={`Move ${dir}`}
    >
      {dir === 'up' ? '▲' : '▼'}
    </button>
  )
}

function Detail({ store, id, onClose }: { store: TodoStore; id: string; onClose: () => void }) {
  const todo = store.state.todos.find((t) => t.id === id)!
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description)
  const dirty = title !== todo.title || description !== todo.description
  const hidden = !store.shown.includes(todo)

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>Todo</span>
        <button className="hover:text-stone-700" onClick={onClose}>
          Close ✕
        </button>
      </div>

      {hidden && (
        <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This Todo no longer matches the current selection, so it is hidden from the list.
        </p>
      )}

      <input
        className="border-b border-transparent text-lg font-semibold outline-none focus:border-stone-300"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-indigo-600"
          checked={todo.status === 'Completed'}
          onChange={() => store.toggleStatus(todo.id)}
        />
        {todo.status}
      </label>

      <textarea
        className="min-h-32 rounded-md border border-stone-200 p-3 text-sm outline-none focus:border-indigo-400"
        placeholder="Add a Description…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Tags</div>
        <div className="flex flex-wrap gap-1.5">
          {store.state.tags.map((t) => {
            const on = todo.tagIds.includes(t.id)
            return (
              <button
                key={t.id}
                onClick={() =>
                  store.updateTodo(todo.id, { tagIds: on ? todo.tagIds.filter((x) => x !== t.id) : [...todo.tagIds, t.id] })
                }
                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                  on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-stone-300 text-stone-500 hover:border-stone-500'
                }`}
              >
                {t.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          disabled={!dirty || !title.trim()}
          onClick={() => store.updateTodo(todo.id, { title: title.trim(), description })}
        >
          Save
        </button>
        <button
          className="ml-auto rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          onClick={() => {
            store.deleteTodo(todo.id)
            onClose()
          }}
        >
          Delete Todo
        </button>
      </div>
    </div>
  )
}
