// PROTOTYPE variant C: "Toolbar + dialogs", built from shadcn/ui components (Tailwind + Radix underneath).
// Every control sits in one toolbar; creating/editing a Todo and managing Tags happen in modal dialogs;
// each row keeps secondary actions in a ⋯ menu.
import { useState } from 'react'
import { ArrowDown, ArrowUp, MoreHorizontal, Plus, Tags, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Status, Todo, TodoStore } from '../store'

export const name = 'Toolbar + dialogs · shadcn/ui'

const ANY = 'any' // Radix Select can't use '' as a value

export function VariantC({ store }: { store: TodoStore }) {
  const { state, shown, counts } = store
  const [editing, setEditing] = useState<Todo | 'new' | null>(null)
  const [managingTags, setManagingTags] = useState(false)

  return (
    <div className="min-h-screen bg-muted/40 px-4 pt-10 pb-28">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Todos</h1>
            <p className="text-sm text-muted-foreground">
              {counts.active} active · {counts.completed} completed
            </p>
          </div>
          <Button onClick={() => setEditing('new')}>
            <Plus /> New Todo
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={state.statusSelection ?? ANY}
            onValueChange={(v) => v && store.setStatusSelection(v === ANY ? null : (v as Status))}
          >
            <ToggleGroupItem value={ANY}>Any status</ToggleGroupItem>
            <ToggleGroupItem value="Active">Active</ToggleGroupItem>
            <ToggleGroupItem value="Completed">Completed</ToggleGroupItem>
          </ToggleGroup>

          <Select value={state.tagSelection ?? ANY} onValueChange={(v) => store.setTagSelection(v === ANY ? null : v)}>
            <SelectTrigger className="w-40 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any tag</SelectItem>
              {state.tags.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" onClick={() => setManagingTags(true)}>
            <Tags /> Manage Tags
          </Button>

          <Button
            variant="outline"
            className="ml-auto"
            disabled={counts.clearable === 0}
            onClick={store.clearCompleted}
          >
            <Trash2 /> Clear completed ({counts.clearable})
          </Button>
        </div>

        {/* List */}
        <Card className="gap-0 divide-y p-0">
          {shown.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">No Todos match this selection.</div>
          )}
          {shown.map((todo) => {
            const done = todo.status === 'Completed'
            return (
              <div key={todo.id} className="flex items-start gap-3 px-4 py-3">
                <Checkbox
                  className="mt-0.5"
                  checked={done}
                  onCheckedChange={() => store.toggleStatus(todo.id)}
                  aria-label="Toggle Status"
                />
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>
                    {todo.title}
                  </div>
                  {todo.description && (
                    <div className="line-clamp-1 text-sm text-muted-foreground">{todo.description}</div>
                  )}
                  {todo.tagIds.length > 0 && (
                    <div className="mt-1.5 flex gap-1">
                      {todo.tagIds.map((id) => (
                        <Badge key={id} variant="secondary">
                          {store.tagName(id)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!store.canMove(todo.id, 'up')}
                    onClick={() => store.move(todo.id, 'up')}
                    aria-label="Move up"
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!store.canMove(todo.id, 'down')}
                    onClick={() => store.move(todo.id, 'down')}
                    aria-label="Move down"
                  >
                    <ArrowDown />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="More actions">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(todo)}>Edit…</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => store.toggleStatus(todo.id)}>
                        Mark {done ? 'Active' : 'Completed'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => store.deleteTodo(todo.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </Card>
      </div>

      <TodoDialog
        // key remounts the form so it starts from the Todo being edited
        key={editing === null ? 'closed' : editing === 'new' ? 'new' : editing.id}
        store={store}
        todo={editing}
        onClose={() => setEditing(null)}
      />
      <TagsDialog store={store} open={managingTags} onOpenChange={setManagingTags} />
    </div>
  )
}

function TodoDialog({ store, todo, onClose }: { store: TodoStore; todo: Todo | 'new' | null; onClose: () => void }) {
  const existing = todo && todo !== 'new' ? todo : null
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [tagIds, setTagIds] = useState<string[]>(
    existing?.tagIds ?? (store.state.tagSelection ? [store.state.tagSelection] : []),
  )

  return (
    <Dialog open={todo !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            if (existing) store.updateTodo(existing.id, { title: title.trim(), description, tagIds })
            else store.addTodo(title, description, tagIds)
            onClose()
          }}
        >
          <DialogHeader>
            <DialogTitle>{existing ? 'Edit Todo' : 'New Todo'}</DialogTitle>
            <DialogDescription>Title is required; Description and Tags are optional.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" value={title} autoFocus onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea id="c-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-3">
              {store.state.tags.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={tagIds.includes(t.id)}
                    onCheckedChange={(c) => setTagIds(c ? [...tagIds, t.id] : tagIds.filter((x) => x !== t.id))}
                  />
                  {t.name}
                </label>
              ))}
              {store.state.tags.length === 0 && <span className="text-sm text-muted-foreground">No Tags yet.</span>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {existing ? 'Save' : 'Add Todo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TagsDialog({ store, open, onOpenChange }: { store: TodoStore; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>Deleting a Tag removes it from its Todos but keeps the Todos.</DialogDescription>
        </DialogHeader>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const err = store.addTag(name)
            setError(err)
            if (!err) setName('')
          }}
        >
          <Input placeholder="New Tag name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!error} />
          <Button type="submit">Add</Button>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="divide-y rounded-lg border">
          {store.state.tags.map((t) => (
            <TagRow key={t.id} store={store} id={t.id} name={t.name} />
          ))}
          {store.state.tags.length === 0 && <p className="p-4 text-sm text-muted-foreground">No Tags yet.</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TagRow({ store, id, name }: { store: TodoStore; id: string; name: string }) {
  const [value, setValue] = useState(name)
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="flex items-center gap-2 p-2">
      <Input
        className="h-8 border-transparent shadow-none focus-visible:border-input"
        value={value}
        aria-invalid={!!error}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value === name) return
          const err = store.renameTag(id, value)
          setError(err)
          if (err) setValue(name)
        }}
      />
      <span className="shrink-0 text-xs text-muted-foreground">{store.counts.perTag(id)} Todos</span>
      <Button variant="ghost" size="icon-sm" onClick={() => store.deleteTag(id)} aria-label={`Delete ${name}`}>
        <Trash2 />
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
