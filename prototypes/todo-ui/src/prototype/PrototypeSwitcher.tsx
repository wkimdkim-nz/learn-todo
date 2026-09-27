// PROTOTYPE: floating variant switcher. Inline styles on purpose, so it looks like none of the variants.
import { useEffect, useState, type CSSProperties } from 'react'
import type { TodoStore } from './store'

type Props = {
  variants: { key: string; name: string }[]
  current: string
  onChange: (key: string) => void
  store: TodoStore
}

export function PrototypeSwitcher({ variants, current, onChange, store }: Props) {
  const [showState, setShowState] = useState(false)
  const i = Math.max(0, variants.findIndex((v) => v.key === current))
  const go = (step: number) => onChange(variants[(i + step + variants.length) % variants.length].key)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (import.meta.env.PROD) return null

  const { state } = store
  const btn: CSSProperties = {
    background: 'transparent', color: '#fff', border: 'none', fontSize: 18, cursor: 'pointer', padding: '0 10px',
  }

  return (
    <>
      {showState && (
        <pre
          style={{
            position: 'fixed', right: 16, bottom: 72, width: 380, maxHeight: '60vh', overflow: 'auto', zIndex: 9999,
            background: '#111', color: '#9fe870', font: '12px/1.4 ui-monospace, monospace', padding: 12, borderRadius: 8,
            boxShadow: '0 8px 30px rgba(0,0,0,.35)',
          }}
        >
          {`Status selection: ${state.statusSelection ?? '(unset)'}
Tag selection:    ${state.tagSelection ? store.tagName(state.tagSelection) : '(unset)'}

Position  Status     Title  [Tags]   (* = shown)
${state.todos
  .map(
    (t, p) =>
      `${store.shown.includes(t) ? '*' : ' '} ${String(p + 1).padStart(2)}     ${t.status.padEnd(10)} ${t.title}  [${t.tagIds.map(store.tagName).join(', ')}]`,
  )
  .join('\n')}

Tags: ${state.tags.map((t) => t.name).join(', ') || '(none)'}`}
        </pre>
      )}
      <div
        style={{
          position: 'fixed', left: '50%', bottom: 16, transform: 'translateX(-50%)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 4, background: '#e0115f', color: '#fff',
          font: '600 13px system-ui, sans-serif', padding: '8px 10px', borderRadius: 999,
          boxShadow: '0 6px 24px rgba(0,0,0,.3)',
        }}
      >
        <button style={btn} onClick={() => go(-1)} aria-label="Previous variant">←</button>
        <span style={{ minWidth: 260, textAlign: 'center' }}>
          PROTOTYPE {variants[i].key}: {variants[i].name}
        </span>
        <button style={btn} onClick={() => go(1)} aria-label="Next variant">→</button>
        <button
          style={{ ...btn, fontSize: 12, borderLeft: '1px solid rgba(255,255,255,.4)', marginLeft: 4 }}
          onClick={() => setShowState((v) => !v)}
        >
          {showState ? 'Hide state' : 'State'}
        </button>
      </div>
    </>
  )
}
