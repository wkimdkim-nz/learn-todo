# PROTOTYPE: Todo UI look + styling (throwaway)

Answers **"How should the Todo UI look and be styled?"** (wkimdkim-nz/learn-todo#15).
Not production code: no tests, no API, no Redux; everything lives in memory and resets on reload.

```bash
npm --prefix prototypes/todo-ui install
npm --prefix prototypes/todo-ui run dev
```

Open the printed URL and flip variants with the pink bar (or ← / →). `?variant=A|B|C` is shareable.
"State" in the bar shows every Todo's Position, Status, and Tags, and which ones are shown.

| Variant | Layout | Styling approach | Read the code in |
| --- | --- | --- | --- |
| A | Classic column: add box on top, footer holds selections + Clear completed, inline edit, Tags in a fold-out | plain CSS + **CSS Modules** | `src/prototype/variant-a/` |
| B | Sidebar + detail: selections and Tag management in a left nav, quick add, right-hand editor | **Tailwind** utility classes | `src/prototype/variant-b/` |
| C | Toolbar + dialogs: one toolbar, New/Edit Todo and Manage Tags in modals, ⋯ row menu | **shadcn/ui** (Tailwind + Radix) | `src/prototype/variant-c/` + `src/components/ui/` |

`src/prototype/store.ts` holds the shared domain rules (Move, Clear completed, Tag uniqueness) so only the rendering differs.
