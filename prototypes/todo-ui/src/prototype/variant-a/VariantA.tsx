// PROTOTYPE variant A: "Classic column", styled with plain CSS Modules.
// One centred column: add box on top, the list, a footer holding the selections + Clear completed,
// inline editing, and Tags managed in a fold-out section under the list.
import { useState, type FormEvent } from 'react'
import type { Status, Todo, TodoStore } from '../store'
import styles from './VariantA.module.css'

export const name = 'Classic column · CSS Modules'

export function VariantA({ store }: { store: TodoStore }) {
  const { state, shown, counts } = store
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [showMore, setShowMore] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    store.addTodo(title, description, tagIds)
    setTitle('')
    setDescription('')
    setTagIds([])
  }

  const statusOptions: { label: string; value: Status | null }[] = [
    { label: 'Any status', value: null },
    { label: 'Active', value: 'Active' },
    { label: 'Completed', value: 'Completed' },
  ]

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>todos</h1>

      <div className={styles.panel}>
        <form className={styles.addForm} onSubmit={submit}>
          <input
            className={styles.addInput}
            placeholder="What needs doing?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="button" className={styles.linkButton} onClick={() => setShowMore((v) => !v)}>
            {showMore ? 'Less' : 'More…'}
          </button>
          <button type="submit" className={styles.primaryButton} disabled={!title.trim()}>
            Add
          </button>
          {showMore && (
            <div className={styles.addMore}>
              <textarea
                className={styles.textarea}
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <TagPicker store={store} value={tagIds} onChange={setTagIds} />
            </div>
          )}
        </form>

        <ul className={styles.list}>
          {shown.length === 0 && <li className={styles.empty}>No Todos match this selection.</li>}
          {shown.map((todo) =>
            editingId === todo.id ? (
              <EditRow key={todo.id} todo={todo} store={store} onDone={() => setEditingId(null)} />
            ) : (
              <li key={todo.id} className={styles.row} data-completed={todo.status === 'Completed'}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={todo.status === 'Completed'}
                  onChange={() => store.toggleStatus(todo.id)}
                  aria-label="Toggle Status"
                />
                <div className={styles.rowBody} onDoubleClick={() => setEditingId(todo.id)}>
                  <span className={styles.title}>{todo.title}</span>
                  {todo.description && <span className={styles.description}>{todo.description}</span>}
                  {todo.tagIds.length > 0 && (
                    <span className={styles.tags}>
                      {todo.tagIds.map((id) => (
                        <span key={id} className={styles.tag}>
                          {store.tagName(id)}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                <div className={styles.rowActions}>
                  <button
                    className={styles.iconButton}
                    disabled={!store.canMove(todo.id, 'up')}
                    onClick={() => store.move(todo.id, 'up')}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className={styles.iconButton}
                    disabled={!store.canMove(todo.id, 'down')}
                    onClick={() => store.move(todo.id, 'down')}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button className={styles.iconButton} onClick={() => setEditingId(todo.id)} aria-label="Edit">
                    ✎
                  </button>
                  <button
                    className={`${styles.iconButton} ${styles.danger}`}
                    onClick={() => store.deleteTodo(todo.id)}
                    aria-label="Delete"
                  >
                    ×
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>

        <footer className={styles.footer}>
          <span className={styles.count}>
            {counts.active} active
          </span>
          <div className={styles.segmented}>
            {statusOptions.map((o) => (
              <button
                key={o.label}
                className={styles.segment}
                data-selected={state.statusSelection === o.value}
                onClick={() => store.setStatusSelection(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <select
            className={styles.select}
            value={state.tagSelection ?? ''}
            onChange={(e) => store.setTagSelection(e.target.value || null)}
            aria-label="Tag selection"
          >
            <option value="">Any tag</option>
            {state.tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button className={styles.linkButton} disabled={counts.clearable === 0} onClick={store.clearCompleted}>
            Clear completed ({counts.clearable})
          </button>
        </footer>
      </div>

      <details className={styles.tagManager}>
        <summary>Manage Tags ({state.tags.length})</summary>
        <TagManager store={store} />
      </details>

      <p className={styles.hint}>Double-click a Todo to edit it.</p>
    </div>
  )
}

function TagPicker({ store, value, onChange }: { store: TodoStore; value: string[]; onChange: (ids: string[]) => void }) {
  return (
    <div className={styles.tagPicker}>
      {store.state.tags.map((t) => {
        const on = value.includes(t.id)
        return (
          <button
            type="button"
            key={t.id}
            className={styles.tagToggle}
            data-selected={on}
            onClick={() => onChange(on ? value.filter((x) => x !== t.id) : [...value, t.id])}
          >
            {on ? '✓ ' : '+ '}
            {t.name}
          </button>
        )
      })}
      {store.state.tags.length === 0 && <span className={styles.muted}>No Tags yet</span>}
    </div>
  )
}

function EditRow({ todo, store, onDone }: { todo: Todo; store: TodoStore; onDone: () => void }) {
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description)
  const [tagIds, setTagIds] = useState(todo.tagIds)
  return (
    <li className={`${styles.row} ${styles.editing}`}>
      <form
        className={styles.editForm}
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          store.updateTodo(todo.id, { title: title.trim(), description, tagIds })
          onDone()
        }}
      >
        <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <textarea
          className={styles.textarea}
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TagPicker store={store} value={tagIds} onChange={setTagIds} />
        <div className={styles.editActions}>
          <button type="button" className={styles.linkButton} onClick={onDone}>
            Cancel
          </button>
          <button type="submit" className={styles.primaryButton} disabled={!title.trim()}>
            Save
          </button>
        </div>
      </form>
    </li>
  )
}

function TagManager({ store }: { store: TodoStore }) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <div className={styles.tagManagerBody}>
      <form
        className={styles.inlineForm}
        onSubmit={(e) => {
          e.preventDefault()
          const err = store.addTag(name)
          setError(err)
          if (!err) setName('')
        }}
      >
        <input className={styles.input} placeholder="New Tag name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className={styles.primaryButton}>Add Tag</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      <ul className={styles.tagList}>
        {store.state.tags.map((t) => (
          <TagRow key={t.id} store={store} id={t.id} name={t.name} />
        ))}
      </ul>
    </div>
  )
}

function TagRow({ store, id, name }: { store: TodoStore; id: string; name: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [error, setError] = useState<string | null>(null)
  return (
    <li className={styles.tagRow}>
      {editing ? (
        <form
          className={styles.inlineForm}
          onSubmit={(e) => {
            e.preventDefault()
            const err = store.renameTag(id, value)
            setError(err)
            if (!err) setEditing(false)
          }}
        >
          <input className={styles.input} value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          <button className={styles.primaryButton}>Save</button>
          {error && <span className={styles.error}>{error}</span>}
        </form>
      ) : (
        <>
          <span>{name}</span>
          <span className={styles.muted}>{store.counts.perTag(id)} Todos</span>
          <button className={styles.linkButton} onClick={() => setEditing(true)}>
            Rename
          </button>
          <button className={`${styles.linkButton} ${styles.danger}`} onClick={() => store.deleteTag(id)}>
            Delete
          </button>
        </>
      )}
    </li>
  )
}
