// PROTOTYPE: in-memory stand-in for the real API + Redux store.
// Shared by every variant so only the rendering differs. Nothing persists: reload = reset.
import { useMemo, useState } from 'react'

export type Status = 'Active' | 'Completed'
export type Tag = { id: string; name: string }
export type Todo = {
  id: string
  title: string
  description: string
  status: Status
  tagIds: string[]
}

type State = {
  todos: Todo[] // array order IS Position
  tags: Tag[]
  statusSelection: Status | null
  tagSelection: string | null
}

let nextId = 100
const newId = () => String(nextId++)

const seed: State = {
  tags: [
    { id: 't1', name: 'Work' },
    { id: 't2', name: 'Home' },
    { id: 't3', name: 'Learning' },
  ],
  todos: [
    { id: '1', title: 'Rename master to main', description: '', status: 'Completed', tagIds: ['t3'] },
    { id: '2', title: 'Read the minimal API walkthrough', description: 'Focus on route groups and TypedResults.', status: 'Active', tagIds: ['t3'] },
    { id: '3', title: 'Buy groceries', description: 'Milk, bread, feijoas', status: 'Active', tagIds: ['t2'] },
    { id: '4', title: 'Review AEM component PR', description: '', status: 'Completed', tagIds: ['t1'] },
    { id: '5', title: 'Book dentist', description: '', status: 'Active', tagIds: [] },
    { id: '6', title: 'Try Redux DevTools', description: 'Watch actions fire when toggling Status.', status: 'Active', tagIds: ['t3', 't1'] },
    { id: '7', title: 'Fix the leaking tap', description: '', status: 'Completed', tagIds: ['t2'] },
  ],
  statusSelection: null,
  tagSelection: null,
}

const matches = (s: State, t: Todo) =>
  (s.statusSelection === null || t.status === s.statusSelection) &&
  (s.tagSelection === null || t.tagIds.includes(s.tagSelection))

export function useTodoStore() {
  const [state, setState] = useState<State>(seed)

  const shown = useMemo(() => state.todos.filter((t) => matches(state, t)), [state])

  const api = {
    state,
    shown,
    tagName: (id: string) => state.tags.find((t) => t.id === id)?.name ?? '?',
    counts: {
      active: state.todos.filter((t) => t.status === 'Active').length,
      completed: state.todos.filter((t) => t.status === 'Completed').length,
      // Completed Todos that Clear completed would delete right now (respects Tag selection).
      clearable: state.todos.filter(
        (t) => t.status === 'Completed' && (state.tagSelection === null || t.tagIds.includes(state.tagSelection)),
      ).length,
      perTag: (tagId: string) => state.todos.filter((t) => t.tagIds.includes(tagId)).length,
    },

    addTodo(title: string, description = '', tagIds: string[] = []) {
      if (!title.trim()) return
      setState((s) => ({
        ...s,
        todos: [...s.todos, { id: newId(), title: title.trim(), description, status: 'Active', tagIds }],
      }))
    },
    updateTodo(id: string, patch: Partial<Omit<Todo, 'id'>>) {
      setState((s) => ({ ...s, todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
    },
    toggleStatus(id: string) {
      setState((s) => ({
        ...s,
        todos: s.todos.map((t) =>
          t.id === id ? { ...t, status: t.status === 'Active' ? 'Completed' : 'Active' } : t,
        ),
      }))
    },
    deleteTodo(id: string) {
      setState((s) => ({ ...s, todos: s.todos.filter((t) => t.id !== id) }))
    },
    // Move: step past the shown neighbour; hidden Todos keep their places.
    move(id: string, dir: 'up' | 'down') {
      setState((s) => {
        const visible = s.todos.filter((t) => matches(s, t))
        const i = visible.findIndex((t) => t.id === id)
        const neighbour = visible[dir === 'up' ? i - 1 : i + 1]
        if (i < 0 || !neighbour) return s
        const moved = s.todos.find((t) => t.id === id)!
        const rest = s.todos.filter((t) => t.id !== id)
        const at = rest.findIndex((t) => t.id === neighbour.id) + (dir === 'up' ? 0 : 1)
        return { ...s, todos: [...rest.slice(0, at), moved, ...rest.slice(at)] }
      })
    },
    canMove(id: string, dir: 'up' | 'down') {
      const i = shown.findIndex((t) => t.id === id)
      return dir === 'up' ? i > 0 : i >= 0 && i < shown.length - 1
    },
    clearCompleted() {
      setState((s) => ({
        ...s,
        todos: s.todos.filter(
          (t) => !(t.status === 'Completed' && (s.tagSelection === null || t.tagIds.includes(s.tagSelection))),
        ),
      }))
    },

    // Returns an error message (like the API's 409) or null.
    addTag(name: string): string | null {
      const n = name.trim()
      if (!n) return 'Name is required'
      if (state.tags.some((t) => t.name.toLowerCase() === n.toLowerCase())) return `"${n}" already exists`
      setState((s) => ({ ...s, tags: [...s.tags, { id: newId(), name: n }] }))
      return null
    },
    renameTag(id: string, name: string): string | null {
      const n = name.trim()
      if (!n) return 'Name is required'
      if (state.tags.some((t) => t.id !== id && t.name.toLowerCase() === n.toLowerCase())) return `"${n}" already exists`
      setState((s) => ({ ...s, tags: s.tags.map((t) => (t.id === id ? { ...t, name: n } : t)) }))
      return null
    },
    deleteTag(id: string) {
      setState((s) => ({
        ...s,
        tags: s.tags.filter((t) => t.id !== id),
        todos: s.todos.map((t) => ({ ...t, tagIds: t.tagIds.filter((x) => x !== id) })),
        tagSelection: s.tagSelection === id ? null : s.tagSelection,
      }))
    },

    setStatusSelection(v: Status | null) {
      setState((s) => ({ ...s, statusSelection: v }))
    },
    setTagSelection(v: string | null) {
      setState((s) => ({ ...s, tagSelection: v }))
    },
  }
  return api
}

export type TodoStore = ReturnType<typeof useTodoStore>
