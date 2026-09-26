# Setting up React with Redux Toolkit (as of 2026-09-26)

Research for [#4](https://github.com/wkimdkim-nz/learn-todo/issues/4), part of map [#1](https://github.com/wkimdkim-nz/learn-todo/issues/1).

**Question:** What is the current official way to scaffold a React + Redux Toolkit (RTK) app, which versions are current, what do the Redux docs say about TypeScript and about RTK Query vs `createAsyncThunk` for a REST API, and what should a beginner avoid?

This note reports facts and flags trade-offs. It does not make the decisions; those belong to the downstream decision tickets.

## TL;DR

- The Redux docs recommend starting from the **official Vite + Redux + TypeScript template**: `npx tiged reduxjs/redux-templates/packages/vite-template-redux my-app` [[redux: Installation]](https://redux.js.org/introduction/installation), [[RTK: Getting Started]](https://redux-toolkit.js.org/introduction/getting-started).
- The template is **TypeScript only**. It ships RTK, React-Redux, Vitest, React Testing Library, oxlint and oxfmt, plus a sample slice and a sample RTK Query API slice ([template package.json and README](https://github.com/reduxjs/redux-templates/tree/master/packages/vite-template-redux)).
- The Redux docs **strongly recommend TypeScript**, but call it a trade-off to evaluate, not a requirement [[redux: Usage with TypeScript]](https://redux.js.org/usage/usage-with-typescript).
- For fetching from a REST API, Redux recommends **RTK Query as the default approach**. `createAsyncThunk` is still supported, but it means writing the loading-state and cache logic by hand [[redux: Style Guide]](https://redux.js.org/style-guide/#use-rtk-query-for-data-fetching), [[Essentials Part 7]](https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics).
- Avoid: Create React App (deprecated), `createStore` (deprecated), the plain `redux` package on its own, hand-written action types and switch reducers, and `connect`.
- Vite's `server.proxy` can forward `/api/*` from the dev server to the local .NET API, which avoids CORS setup during development [[vite: server.proxy]](https://vite.dev/config/server-options#server-proxy).

## 1. Recommended scaffold

### Redux's recommendation: the official Vite template

The Redux installation page says: "The recommended way to start a new app with React and Redux is to use one of our official templates" [[redux: Installation]](https://redux.js.org/introduction/installation). RTK's Getting Started page names the "official Redux Toolkit + TS template for Vite" (or Next.js's `with-redux` example) as the recommended way to start new apps [[RTK: Getting Started]](https://redux-toolkit.js.org/introduction/getting-started).

```sh
npx tiged reduxjs/redux-templates/packages/vite-template-redux my-app
cd my-app
npm install
```

(Command from the [template README](https://github.com/reduxjs/redux-templates/blob/master/packages/vite-template-redux/README.md).) `tiged` copies the folder out of the GitHub repo. It is not an interactive generator like `npm create vite`.

The [redux-templates repo](https://github.com/reduxjs/redux-templates) also has Expo and React Native templates and an `rtk-app-structure-example`. The old Create React App templates were **removed**; their last versions are kept at the `archive/cra-and-rn-cli` tag.

### Alternative: plain Vite plus a manual RTK install

react.dev lists Vite, Parcel and Rsbuild as build tools for "building a React app from scratch" and gives `npm create vite@latest my-app -- --template react-ts` [[react.dev: Build a React app from scratch]](https://react.dev/learn/build-a-react-app-from-scratch). Vite's own templates include `react` (JavaScript) and `react-ts` [[vite: Getting Started]](https://vite.dev/guide/). You then add Redux with `npm install @reduxjs/toolkit react-redux` and follow the RTK Quick Start, which shows each step in both TypeScript and JavaScript [[RTK: Quick Start]](https://redux-toolkit.js.org/tutorials/quick-start).

### What react.dev says about frameworks

react.dev's top recommendation for new apps is a framework (Next.js, React Router, Expo). It presents Vite, Parcel and Rsbuild as the choice for people who have unusual constraints, want to build their own framework, or "just want to learn how react works from scratch" [[react.dev blog: Sunsetting CRA]](https://react.dev/blog/2025/02/14/sunsetting-create-react-app). It also warns that starting from scratch "is often the same as building your own adhoc framework", meaning routing, SSR and data fetching are left to you [[react.dev: Build from scratch]](https://react.dev/learn/build-a-react-app-from-scratch). This project is a learning app talking to a separate .NET API, so Vite fits the "learn the basics" case. Redux also lists Next.js's `with-redux` example if a framework is ever wanted.

### Trade-off for the decision tickets

| | Official `vite-template-redux` | Plain `npm create vite` plus manual RTK |
|---|---|---|
| Language | TypeScript only | Choose `react` (JS) or `react-ts` |
| Redux wiring | Done: store, typed hooks, `<Provider>`, sample RTK Query slice | You write it by following the Quick Start (about 5 small files) |
| Tests | Vitest + React Testing Library + jsdom, with a `renderWithProviders` helper | None; add them yourself |
| Lint/format | oxlint + oxfmt (not ESLint/Prettier) | `react-ts` template: oxlint only, no formatter ([create-vite template-react-ts package.json](https://github.com/vitejs/vite/blob/main/packages/create-vite/template-react-ts/package.json)) |
| Learning value | Less to set up. You start by reading working code, including some advanced pieces (`combineSlices`, `makeStore`, `createAppSlice`) | More to set up, but you write every line and see why it is there |
| Leftovers | You need to delete the counter and quotes sample features | Nothing to remove |

## 2. What the official template includes

Taken from the template's [package.json](https://github.com/reduxjs/redux-templates/blob/master/packages/vite-template-redux/package.json), [README](https://github.com/reduxjs/redux-templates/blob/master/packages/vite-template-redux/README.md) and source files, last refreshed 2026-09-19 ("Vite 8, Vitest 5, TS 6, oxlint + oxfmt"):

- **Dependencies:** `@reduxjs/toolkit ^2.12.0`, `react ^19.3.0`, `react-dom ^19.3.0`, `react-redux ^9.3.0`.
- **Dev tooling:** `vite ^8.3.0`, `@vitejs/plugin-react ^6.1.1`, `typescript ~6.0.2`, `vitest ^5.0.1`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `oxlint`, `oxfmt`.
- **Scripts:** `dev`/`start`, `build` (`tsc -b && vite build`), `preview`, `test` (`vitest --run`), `lint`, `lint:fix`, `format`, `format:check`, `type-check`.
- **Source layout:**
  - `src/app/store.ts`: `combineSlices` + `configureStore`, a `makeStore(preloadedState)` factory for tests, the RTK Query middleware, `setupListeners`, and the types `RootState`, `AppDispatch` and `AppThunk`.
  - `src/app/hooks.ts`: `useAppDispatch = useDispatch.withTypes<AppDispatch>()` and `useAppSelector = useSelector.withTypes<RootState>()`.
  - `src/features/counter`: a `createSlice` example with a thunk, plus tests.
  - `src/features/quotes`: an RTK Query `createApi` slice (`fetchBaseQuery`, `tagTypes`, `providesTags`) calling a public API.
  - `src/utils/test-utils.tsx`: `renderWithProviders`.
- `vite.config.ts` sets `server.open: true` and the Vitest config (jsdom, globals, type-checking). It has **no proxy configured**.
- `package.json` has an `overrides` entry that pins `rolldown` to 1.2.8 to work around a StackBlitz crash. The README says to remove it once rolldown ships a fix.

Two small things to notice: `hooks.ts` still has an `eslint-disable` comment even though the template now lints with oxlint, and the template pins TypeScript `~6.0.2` while npm `latest` is 7.0.2 (see section 3).

## 3. Current versions

From `npm view <pkg> version` on 2026-09-26:

| Package | Latest on npm | Last published | Notes |
|---|---|---|---|
| `react` / `react-dom` | 19.3.0 | 2026-09-23 | |
| `react-redux` | 9.3.0 | 2026-09-24 | peer deps: `react ^18 \|\| ^19`, `redux ^5` |
| `@reduxjs/toolkit` | 2.12.0 | 2026-05-15 | peer deps (optional): `react ... \|\| ^19`, `react-redux ... \|\| ^9.0.0`. RTK 2.x needs TypeScript 5.4+ [[RTK: Usage With TypeScript]](https://redux-toolkit.js.org/usage/usage-with-typescript) |
| `redux` | 5.0.1 | 2024-05-06 | RTK re-exports it, so "most apps do not need to install it separately" [[redux: Installation]](https://redux.js.org/introduction/installation) |
| `vite` | 8.3.1 | 2026-09-24 | `engines.node: ^20.19.0 \|\| >=22.12.0`, which Node 26 satisfies [[vite: Getting Started]](https://vite.dev/guide/) |
| `@vitejs/plugin-react` | 6.1.1 | 2026-08-28 | |
| `typescript` | 7.0.2 | 2026-09-25 | Both the Redux template and Vite's own `react-ts` template pin `~6.0.2` ([create-vite](https://github.com/vitejs/vite/blob/main/packages/create-vite/template-react-ts/package.json)). Whether TS 7 works with this toolchain was **not verified** |

## 4. TypeScript or JavaScript?

- The Redux Style Guide rates "Use Static Typing" as **Strongly Recommended**: "Use a static type system like TypeScript rather than plain JavaScript" [[redux: Style Guide]](https://redux.js.org/style-guide/#use-static-typing).
- The Usage with TypeScript page says: "We strongly recommend using TypeScript in Redux applications." It also lists the costs: more code to write, TS syntax to learn, and a more complex build. It asks readers to "evaluate the tradeoffs and decide whether it's worth using TS in your own application" [[redux: Usage with TypeScript]](https://redux.js.org/usage/usage-with-typescript).
- RTK is written in TypeScript [[RTK: Usage With TypeScript]](https://redux-toolkit.js.org/usage/usage-with-typescript). The official Vite template and the Redux Essentials tutorial are written in TypeScript [[Essentials Part 7]](https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics). The RTK Quick Start shows both TS and JS [[RTK: Quick Start]](https://redux-toolkit.js.org/tutorials/quick-start).
- The standard TS setup has two parts. First, infer `RootState` and `AppDispatch` from the store. Second, create typed hooks with `.withTypes()` in `app/hooks.ts` and use them everywhere instead of plain `useSelector`/`useDispatch` [[redux: Usage with TypeScript]](https://redux.js.org/usage/usage-with-typescript), [[RTK: TS Quick Start]](https://redux-toolkit.js.org/tutorials/typescript).

**Trade-off for the decision tickets:** the learner knows basic JS and no TS. Choosing TS matches the official template and tutorial, but means learning TS syntax alongside Redux. Choosing JS rules out the official template (use plain `create vite --template react` plus the JS code blocks in the Quick Start) and goes against a "Strongly Recommended" style-guide rule.

## 5. RTK Query or `createAsyncThunk` for the REST API?

**What Redux recommends:**

- The Style Guide rule "Use RTK Query for Data Fetching" (Priority C, Recommended) says: "we recommend using RTK Query as the default approach for data fetching and caching in a Redux app" [[redux: Style Guide]](https://redux.js.org/style-guide/#use-rtk-query-for-data-fetching).
- The Essentials tutorial says: "We recommend RTK Query as the default approach for data fetching in Redux apps" [[Essentials Part 7]](https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics).
- RTK Query is an optional addon that already ships inside `@reduxjs/toolkit`, imported from `@reduxjs/toolkit/query/react`, so there is nothing extra to install [[RTK Query Overview]](https://redux-toolkit.js.org/rtk-query/overview).

**Why RTK Query over `createAsyncThunk`:**

- With `createAsyncThunk` you still "create the async thunk, make the actual request, pull relevant fields out of the response, add loading state fields, add handlers in `extraReducers` to handle the `pending/fulfilled/rejected` cases, and actually write the proper state updates" [[Essentials Part 7]](https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics).
- The `createAsyncThunk` API page says RTK Query "can eliminate the need to write any thunks or reducers to manage data fetching" [[RTK: createAsyncThunk]](https://redux-toolkit.js.org/api/createAsyncThunk).
- RTK Query handles caching, request de-duplication and loading flags for you, and generates hooks such as `useGetTodosQuery` [[Essentials Part 7]](https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics).
- For CRUD: queries mark their results with `providesTags`, and mutations (create/update/delete) declare `invalidatesTags`. When a mutation runs, the queries holding those tags refetch automatically. This covers the "add or delete a todo, then refresh the list" flow [[RTK Query: Automated Re-fetching]](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching).

**Where thunks still fit:** the Style Guide recommends thunks for "imperative logic", such as complex synchronous logic that needs `dispatch`/`getState`, and moderately complex async logic [[redux: Style Guide]](https://redux.js.org/style-guide/#use-thunks-and-listeners-for-other-async-logic). The Thunks page says thunks are fine for "simple to moderate async logic such as making a standard AJAX request" [[redux: Writing Logic with Thunks]](https://redux.js.org/usage/writing-logic-thunks).

**RTK Query limits to know about:**

- It deliberately has **no normalized cache**. If the same item appears in two different requests, it is stored twice [[RTK Query: Comparison]](https://redux-toolkit.js.org/rtk-query/comparison).
- It adds about 9 kB, plus about 2 kB for the hooks, when RTK is already in the app [[RTK Query: Comparison]](https://redux-toolkit.js.org/rtk-query/comparison).

**Trade-off for the decision tickets:** RTK Query matches the official recommendation and needs much less code for CRUD. With RTK Query, the server data (todos, categories) lives in the API cache rather than in a hand-written slice. Client-only state such as the current filter or UI selection would still go in a `createSlice`. Writing `createAsyncThunk` + `extraReducers` by hand shows more of how Redux works inside, which may be worth doing once to learn. One option is to build one feature by hand first and then switch to RTK Query. Also relevant: ordering (reordering todos) will likely need a mutation plus either tag invalidation or an optimistic update. The optimistic-update pattern was not researched here.

## 6. Legacy patterns a beginner should avoid

Tutorials, blog posts and AI answers often show these older patterns:

| Avoid | Use instead | Source |
|---|---|---|
| **Create React App** (`create-react-app`, `cra-template-redux`) | Vite (or a framework). CRA was deprecated for new apps on 2025-02-14, and Redux removed its CRA template | [react.dev blog](https://react.dev/blog/2025/02/14/sunsetting-create-react-app), [redux-templates](https://github.com/reduxjs/redux-templates) |
| `createStore` from `redux` (shows with a strikethrough in the editor) | `configureStore` from RTK. `createStore` was marked `@deprecated` in Redux 4.2.0; it still works and will not be removed | [redux: createStore](https://redux.js.org/api/createstore) |
| Installing or writing code against the plain `redux` package | `@reduxjs/toolkit`. The `redux` core "still works, but today we consider it to be obsolete" | [Why RTK is How To Use Redux Today](https://redux.js.org/introduction/why-rtk-is-redux-today) |
| Hand-written action type constants, action creators, and `switch` reducers | `createSlice` | [Why RTK is How To Use Redux Today](https://redux.js.org/introduction/why-rtk-is-redux-today) |
| Immutable updates written by hand with object spread | The "mutating" syntax inside `createSlice` (Immer) | [redux: Style Guide](https://redux.js.org/style-guide/#use-immer-for-writing-immutable-updates) |
| Calling `combineReducers` and setting up middleware/DevTools yourself | `configureStore`, which does this for you. The template uses `combineSlices` | [Why RTK...](https://redux.js.org/introduction/why-rtk-is-redux-today), [template store.ts](https://github.com/reduxjs/redux-templates/blob/master/packages/vite-template-redux/src/app/store.ts) |
| `connect` / `mapStateToProps` | The React-Redux hooks `useSelector`/`useDispatch`, or the typed `useAppSelector`/`useAppDispatch`. `connect` still works but is not the default | [redux: Style Guide](https://redux.js.org/style-guide/#use-the-react-redux-hooks-api) |
| Storing Promises, class instances, `Map`/`Set` or functions in state or actions | Plain serializable data (rated **Essential**) | [redux: Style Guide](https://redux.js.org/style-guide/#do-not-put-non-serializable-values-in-state-or-actions) |
| Hand-written fetch + loading flags + `useEffect` for server data | RTK Query hooks | [redux: Style Guide](https://redux.js.org/style-guide/#use-rtk-query-for-data-fetching) |

## 7. Calling the local .NET API: Vite dev-server proxy

Vite's `server.proxy` sets "custom proxy rules for the dev server" [[vite: server.proxy]](https://vite.dev/config/server-options#server-proxy). The browser calls the Vite origin (`http://localhost:5173` by default), and Vite forwards matching paths to the API. Because the browser only ever talks to the Vite origin, the .NET API does not need CORS enabled during development. Example based on the Vite docs:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // the .NET API's URL (check its launchSettings.json)
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // only if the API's routes don't start with /api
        // secure: false, // needed if target is https with the ASP.NET dev certificate
      },
    },
  },
})
```

Then use `fetchBaseQuery({ baseUrl: '/api' })` in the RTK Query `createApi`.

- Server options apply to the dev server only. `vite preview` (port 4173) uses `preview.proxy`, which **defaults to `server.proxy`** [[vite: preview options]](https://vite.dev/config/preview-options).
- The proxy does not exist in a real production build. There you would need to serve the app and API from the same origin, add a reverse proxy, or enable CORS on the API.
- The `secure: false` note for the ASP.NET HTTPS dev certificate comes from Vite's `ProxyOptions`, which extends http-proxy options. The Vite docs page does not show that example, so **confirm it** once the .NET API's port and scheme are known.

**Trade-off for the decision tickets:** a proxy means no CORS configuration on the .NET side while developing, and relative URLs in the frontend. Enabling CORS in .NET means the frontend uses the API's absolute URL, which is closer to a split production deployment but needs server-side configuration.

## Open questions surfaced

1. **TypeScript or JavaScript** for this learner, and therefore official template or plain `create vite`.
2. **RTK Query or `createAsyncThunk`** (or thunks first to learn, then RTK Query).
3. **Proxy or CORS**. This needs the .NET API's port, scheme (http/https) and route prefix (`/api`?), probably from the backend ticket.
4. **TypeScript 7:** npm `latest` is 7.0.2, but both the Redux and Vite templates pin `~6.0.2`. If TS is chosen, keep the template's pin unless there is a reason to change it.
5. **Lint tooling:** both the Redux template and Vite's `react-ts` template now use oxlint (the Redux template adds oxfmt), not the ESLint/Prettier setup that most tutorials assume. This matters for VS Code extension setup (the oxc extension instead of the ESLint extension).

## Sources

- Redux, [Installation](https://redux.js.org/introduction/installation)
- Redux, [Why Redux Toolkit is How To Use Redux Today](https://redux.js.org/introduction/why-rtk-is-redux-today)
- Redux, [Style Guide](https://redux.js.org/style-guide/)
- Redux, [Usage with TypeScript](https://redux.js.org/usage/usage-with-typescript)
- Redux, [Writing Logic with Thunks](https://redux.js.org/usage/writing-logic-thunks)
- Redux, [Essentials Part 7: RTK Query Basics](https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics)
- Redux, [API: createStore](https://redux.js.org/api/createstore)
- Redux Toolkit, [Getting Started](https://redux-toolkit.js.org/introduction/getting-started), [Quick Start](https://redux-toolkit.js.org/tutorials/quick-start), [TypeScript Quick Start](https://redux-toolkit.js.org/tutorials/typescript), [Usage With TypeScript](https://redux-toolkit.js.org/usage/usage-with-typescript)
- Redux Toolkit, [RTK Query Overview](https://redux-toolkit.js.org/rtk-query/overview), [Comparison](https://redux-toolkit.js.org/rtk-query/comparison), [Automated Re-fetching](https://redux-toolkit.js.org/rtk-query/usage/automated-refetching), [createAsyncThunk](https://redux-toolkit.js.org/api/createAsyncThunk)
- GitHub, [reduxjs/redux-templates](https://github.com/reduxjs/redux-templates), [vite-template-redux](https://github.com/reduxjs/redux-templates/tree/master/packages/vite-template-redux) (read via `gh api`, latest template commit 2026-09-22)
- React, [Build a React app from Scratch](https://react.dev/learn/build-a-react-app-from-scratch), [Sunsetting Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
- Vite, [Getting Started](https://vite.dev/guide/), [Server Options](https://vite.dev/config/server-options), [Preview Options](https://vite.dev/config/preview-options)
- npm registry, `npm view <pkg> version` / `peerDependencies` / `engines`, run 2026-09-26
