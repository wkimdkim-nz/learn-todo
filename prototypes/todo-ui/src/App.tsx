// PROTOTYPE: "How should the Todo UI look and be styled?" (learn-todo #15)
// Three variants of the whole Todo screen, switchable via ?variant=A|B|C, sharing one in-memory store.
import { useState } from 'react'
import { PrototypeSwitcher } from './prototype/PrototypeSwitcher'
import { useTodoStore } from './prototype/store'
import { VariantA, name as nameA } from './prototype/variant-a/VariantA'
import { VariantB, name as nameB } from './prototype/variant-b/VariantB'
import { VariantC, name as nameC } from './prototype/variant-c/VariantC'

const variants = [
  { key: 'A', name: nameA },
  { key: 'B', name: nameB },
  { key: 'C', name: nameC },
]

export default function App() {
  const store = useTodoStore()
  const [variant, setVariant] = useState(() => new URLSearchParams(location.search).get('variant') ?? 'A')

  function change(key: string) {
    const url = new URL(location.href)
    url.searchParams.set('variant', key)
    history.replaceState(null, '', url)
    setVariant(key)
  }

  return (
    <>
      {variant === 'A' && <VariantA store={store} />}
      {variant === 'B' && <VariantB store={store} />}
      {variant === 'C' && <VariantC store={store} />}
      <PrototypeSwitcher variants={variants} current={variant} onChange={change} store={store} />
    </>
  )
}
