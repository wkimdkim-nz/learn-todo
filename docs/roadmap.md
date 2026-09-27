# Learning roadmap

The build plan for the Todo app: a .NET 10 minimal API with EF Core and SQLite, and a React + Redux Toolkit frontend styled with Tailwind. Each step below is one small, readable delivery. Claude writes the code, and Derek reads it and asks about anything that's unclear.

Every decision behind this plan is on the map, [Wayfinder: Learning roadmap for a .NET + React/Redux Todo app](https://github.com/wkimdkim-nz/learn-todo/issues/1). Words like **Todo**, **Tag**, **Status selection**, **Position** and **Move** are defined in [`CONTEXT.md`](../CONTEXT.md).

## How a step is delivered

- **One branch and one PR per step.** The branch is `step/NN-short-name` and the PR title is `Step NN: …`. Claude branches from the latest `main`.
- **The PR description is the walkthrough.** It lists the files to read in order, explains the new concepts in plain language, and says how to run the "done when" check. Code comments stay at normal production level.
- **Questions** go in PR line comments (chat is fine too). If an answer changes the code, the fix is pushed to the same PR.
- **Derek squash-merges** to sign off. The next step starts only after the previous one is merged.
- **Backend checks** use the committed `.http` files, run with VS Code's REST Client. Scalar is a dev-only extra for browsing the API.
- **From step 5, CI runs on every PR.** A green check is part of every "done when" from then on.

## Rules every step follows

- **Readable in one sitting:** about 30–45 minutes of reading. That's roughly **≤ 200 lines of hand-written diff** in **≤ 8 files**, with **one main new idea plus two or three supporting ones**.
  - Generated files (lockfiles, scaffold boilerplate) don't count. Migrations do, because they are read before they are applied.
  - A step that would go over the budget splits in two.
- **One stack per step.** A PR is either API or UI. Step 11 (running both together) and step 0 (setup) are the only exceptions.
- **The API goes first for each feature.** After the two foundations, each feature's API step comes just before the UI step that uses it.
- **Tests ride with the code.**
  - After the two backend test steps (5–6), each API step adds about 2–6 tests: the happy path and its most important error.
  - After the two frontend test steps (13–14), each UI step adds about 1–4 component tests and grows the MSW fake with its endpoint.
- **Frontend types mirror the API as it is now.** They grow with it (for example, a Todo's `tags` field arrives with the Tags steps).
- **Migrations:** one per schema-changing step, named for the change. Never edit a merged migration. Read each one before applying it.

## Phases

| Phase | Steps |
|---|---|
| Setup | 0 |
| Backend foundation | 1–8 |
| Frontend foundation | 9–14 |
| Features | 15–32 |
| Hardening | 33, plus the optional 34–35 |

Each step below has a **Goal**, the **Concepts** it teaches, and a **Done when** check. **You do** marks something only Derek can do. **Aside** is a one-line note worth knowing, which isn't built.

---

## Setup

### Step 00: Project setup · Setup

**Goal:** the repo is ready for a .NET 10 solution, pinned to the right SDK.
**Concepts:** SDK vs runtime · `global.json` and `rollForward` · solution files (`.slnx`) · `.gitignore` · recommended VS Code extensions
**You do:** run the .NET SDK **10.0.401** macOS arm64 installer (replacing 10.0.300). Install the REST Client extension when VS Code suggests it.
**Contents:**
- root `global.json` (SDK `10.0.401`, `rollForward: latestFeature`);
- `backend/TodoApi.slnx` with `src/` and `tests/` folders;
- `.gitignore` from `dotnet new gitignore`, plus `*.db`, `*.db-shm` and `*.db-wal`;
- `.vscode/extensions.json` recommending C# Dev Kit and REST Client.

**Done when:** `dotnet --version` in the repo prints 10.0.401 or a later 10.0.x (never 11) · `dotnet sln backend/TodoApi.slnx list` runs · VS Code recommends the extensions

---

## Backend foundation

### Step 01: Scaffold the API · API

**Goal:** an empty `TodoApi` runs on a fixed port and answers a request.
**Concepts:** `dotnet new webapi` · a tour of `Program.cs` (builder, services, middleware, endpoints) · `launchSettings.json` profiles · `dotnet watch` (plus one mention of `dotnet run`) · `.http` files
**Contents:**
- `backend/src/TodoApi` added to the solution;
- the `http` profile pinned to `http://localhost:5080`;
- the `https` profile deleted and `app.UseHttpsRedirection()` removed.

The template's sample endpoint stays for now, as the first thing to call.
**Aside:** HTTPS and `UseHttpsRedirection` matter once an app is deployed. This one never leaves your machine, and later the browser only talks to Vite.
**Done when:** `dotnet watch --project backend/src/TodoApi` serves on port 5080 with no https warning · the template's `.http` request returns 200

### Step 02: The Todo entity and the database · API

**Goal:** a SQLite `todo.db` with an empty Todos table, created by a migration.
**Concepts:**
- EF Core entities: `Entities/Todo.cs` (Guid `Id`, `Title`, `Description`, `Status`, `Position`) and `Entities/Status.cs`;
- `Data/TodoDbContext.cs`: `Status` stored as text, max lengths, and a non-unique index on `Position`;
- the connection string in `appsettings.Development.json`;
- `dotnet-ef` as a local tool (`.config/dotnet-tools.json`, `dotnet tool restore`);
- the `InitialCreate` migration in `Data/Migrations`, read before it's applied by hand with `dotnet ef database update`.

**Done when:** SQLite Viewer shows an empty Todos table with the expected columns · `todo.db` doesn't appear in `git status`

### Step 03: List Todos · API

**Goal:** `GET /api/todos` returns the Todos in Position order.
**Concepts:**
- minimal API route groups (`Endpoints/TodoEndpoints.cs`, `app.MapTodoEndpoints()`);
- named handlers that take `TodoDbContext` directly;
- DTO `record`s (`Dtos/TodoResponse`) and `TypedResults`;
- auto-migrate at startup in Development only, with EF's SQL logged to the console.

The template sample is removed.
**Aside:** Microsoft's minimal API Todo tutorial is optional side reading. It covers the same ground in a different shape.
**Done when:** delete `todo.db` and restart, and auto-migrate recreates it · the `.http` GET returns `[]` · the generated SQL shows in the console

### Step 04: Create a Todo · API

**Goal:** `POST /api/todos` adds an Active Todo at the bottom of the list.
**Concepts:**
- request records;
- trimming, with a blank Description saved as `null`;
- Position = max + 1;
- `201 Created` + `Location`;
- enums as strings (`JsonStringEnumConverter` via `ConfigureHttpJsonOptions`);
- breakpoint debugging with a committed `.vscode/launch.json` "Debug API" config.

**Done when:** the `.http` POST returns 201 with a `Location` and `"status": "Active"` · two POSTs come back from GET in creation order · with the watch terminal stopped, F5 stops at a breakpoint in the create handler, where you can watch Position being worked out

### Step 05: Backend tests I: the Move rule · API

**Goal:** a test project, the pure Move rule it tests, and CI.
**Concepts:**
- xUnit v3 (`dotnet new xunit3`) on Microsoft Testing Platform (`"test": { "runner": "Microsoft.Testing.Platform" }` in `global.json`);
- `[Fact]` / `[Theory]` and the built-in `Assert`;
- `Rules/TodoOrdering.cs`, a pure function explained with the `A, h, B` example;
- about 5–8 unit tests: stepping past the shown neighbour, first and last, gaps, hidden Todos not reshuffled, a Move that changes nothing;
- `Method_Scenario_Expected` names;
- the first GitHub Actions workflow (backend job: `dotnet test`).

`coverlet` is removed; `xunit.runner.visualstudio` and `Microsoft.NET.Test.Sdk` stay for Test Explorer.
**You do:** `dotnet new install xunit.v3.templates`.
**Must confirm:** Test Explorer finds the tests under MTP. If it doesn't, fall back to the VSTest runner and say so in the PR.
**Done when:** `dotnet test` passes in the terminal · the tests show and pass in Test Explorer · CI is green

### Step 06: Backend tests II: API tests · API

**Goal:** tests that call the real API over HTTP against a fresh in-memory database.
**Concepts:**
- `WebApplicationFactory<Program>` in `TodoApiFactory.cs`, using the `Testing` environment;
- one open SQLite `:memory:` connection, with `TodoDbContext` swapped in after removing its options registration;
- the factory runs the real migrations;
- a new host per test via the class constructor and dispose;
- setup only through the API, with helpers (`CreateTodo`, `GetTodos`) that pass `TestContext.Current.CancellationToken`;
- one contract test on the raw JSON: camelCase, `status` as a string, no `position`.

**Must confirm:** the app's `AddDbContext` doesn't fail under `Testing`, which has no connection string, before the factory swaps it out.
**Done when:** about 3–5 API tests pass (empty list, create returns 201 + `Location`, creation order kept, contract) · CI is green

### Step 07: Read, update and delete a Todo · API

**Goal:** `GET`, `PUT` and `DELETE /api/todos/{id}`, with proper 404s.
**Concepts:**
- the `{id:guid}` route constraint;
- `PUT` replaces the editable fields;
- `204 No Content`;
- ProblemDetails (`AddProblemDetails` + status-code pages) so a 404 has a standard body;
- Scalar as a dev-only API browser (`MapScalarApiReference` in Development).

**Done when:** the `.http` requests for all six Todo calls behave · Scalar lists the endpoints at its local URL · the tests cover update, delete-then-get-404 and unknown-id-404 · CI is green

### Step 08: Validation and errors · API

**Goal:** bad input gets a clear 400, and unexpected failures a clean 500.
**Concepts:**
- .NET 10 `AddValidation()` with DataAnnotations on the request records (Title 1–200 characters, Description ≤ 2000);
- the 400 `errors` keyed by field;
- the camelCase key rewrite in `CustomizeProblemDetails` (a .NET 10 quirk, to be deleted once .NET 12 fixes it);
- `UseExceptionHandler` → a 500 ProblemDetails.

**Must confirm:** the built-in validation response passes through the `CustomizeProblemDetails` hook. If it doesn't, the frontend will match field errors ignoring case; say so in the PR.
**Done when:** a blank Title returns 400 with `errors.title` · the tests have one example per kind of rule · CI is green

---

## Frontend foundation

### Step 09: Scaffold the frontend · UI

**Goal:** a stripped Vite + React + TypeScript app in `frontend/`, linted and formatted on save.
**Concepts:**
- `npm create vite@latest frontend -- --template react-ts`, with the demo removed;
- what each generated file does;
- TypeScript `~6.0.2` with `strict` (inference first; types by hand only for API data and props);
- `"engines": { "node": ">=22.12" }`;
- oxlint + oxfmt with `lint`, `lint:fix`, `format` and `format:check` scripts;
- the root `.vscode/settings.json` format-on-save via the Oxc extension (Oxc added to `extensions.json`).

**Aside:** ESLint and Prettier are the older equivalents you'll meet at work, and the ideas carry over. TypeScript 7 exists; upgrading is a possible later step once the tools support it.
**Done when:** `npm run dev` shows the stripped page on 5173 · `npm run lint` and `npm run format:check` pass · saving a `.tsx` file reformats it

### Step 10: Tailwind and the static layout · UI

**Goal:** the three-pane layout (sidebar, list, detail panel), drawn from hard-coded Todos.
**Concepts:**
- Tailwind v4 (`tailwindcss` + `@tailwindcss/vite`, `@import "tailwindcss"`);
- utility classes;
- components and typed props;
- rendering lists with `key`;
- a hand-written `Todo` type that mirrors the API.

The [layout prototype](https://github.com/wkimdkim-nz/learn-todo/tree/prototype/todo-ui/prototypes/todo-ui) (variant B) is the reference, rewritten properly rather than copied.
**Done when:** the page shows the three panes with a few hard-coded Todos, resembling prototype B

### Step 11: Run the frontend and API together · Both

**Goal:** the browser talks only to Vite, and Vite passes `/api` on to the API.
**Concepts:**
- the Vite `server.proxy` (`'/api'` → `http://localhost:5080`);
- port 5173 with `strictPort: true`;
- first by hand: `dotnet watch` and `npm run dev` in two terminals;
- then a committed `.vscode/tasks.json` compound "dev" task, run with ⇧⌘B.

**Aside:** without the proxy (say, a frontend served from another domain) the API would need a CORS policy.
**Done when:** with both running, `http://localhost:5173/api/todos` returns the API's JSON · ⇧⌘B starts both in split terminals

### Step 12: Redux and RTK Query: the list from the API · UI

**Goal:** the list shows real Todos from the API.
**Concepts:**
- the Redux store (`src/app/store.ts`) and `<Provider>`;
- typed hooks (`src/app/hooks.ts`, `withTypes`);
- RTK Query: an empty base `apiSlice` (`baseUrl: '/api'`, `tagTypes: ['Todo', 'Tag']`), plus `todosApi.ts` with `injectEndpoints` and `getTodos`;
- `isLoading` vs `isFetching` (keep showing the previous list);
- a failed query with Retry (`refetch()`).

How loading, the empty list and errors look is decided here, in plain Tailwind.
**In the PR:** two collapsed `<details>` blocks for reference, never in the code. One shows the same endpoints as a single-file `createApi`, with a note on when each layout fits. The other shows the `useEffect` + `fetch` version, to show what RTK Query saves you.
**Aside:** `createAsyncThunk` is the older pattern you'll meet in codebases at work.
**Done when:** Todos created with the `.http` file show in the browser in Position order · stopping the API shows the error, and Retry recovers once it's back

### Step 13: Frontend tests I: tooling · UI

**Goal:** component tests run locally and in CI.
**Concepts:**
- Vitest + jsdom + React Testing Library + jest-dom + user-event;
- the Vitest config inside `vite.config.ts`, and `src/setupTests.ts`;
- `makeStore()`, plus `renderWithProviders` in `src/utils/test-utils.tsx`;
- accessibility-first queries and the `user` it returns;
- tests next to the code;
- the frontend CI job: `npm ci`, oxlint, type-check, `npm test`.

Includes 1–2 tests of something on screen that doesn't fetch, and the Vitest extension recommendation for VS Code's Testing panel.
**Aside:** Vitest Browser Mode (tests in a real browser) is what you'd consider next.
**Done when:** `npm test` passes · the tests show in VS Code's Testing panel · CI is green

### Step 14: Frontend tests II: a fake API with MSW · UI

**Goal:** component tests that load data, against a small fake API.
**Concepts:**
- `msw`: `src/mocks/db.ts` (in-memory Todos, seed helpers, reset), `handlers.ts` (just `GET /api/todos` for now) and `server.ts`;
- `onUnhandledRequest: 'error'`, with the handlers and data reset after each test;
- per-test overrides with `server.use` for failures;
- `findBy…` for async data;
- `apiSlice`'s `baseUrl` becomes `new URL('/api', location.origin).href`, because jsdom can't resolve a relative URL. In the browser it still goes through the proxy.

**Done when:** 2–3 tests pass (the list shows the API's Todos, the empty list, the error state) · the app still works in the browser · CI is green

---

## Features

### Step 15: Set a Todo's Status · API

**Goal:** `PUT /api/todos/{id}/status` sets Active or Completed.
**Concepts:**
- a sub-resource endpoint that *sets* the Status (never toggles), so repeating it is safe;
- the enum validated as exactly `Active` or `Completed`;
- Status never changes Position.

**Done when:** the `.http` call marks a Todo Completed and back · the tests cover setting it, the order being unchanged, and an invalid status (400) · CI is green

### Step 16: Status checkbox · UI

**Goal:** tick a Todo to mark it Completed, untick to make it Active again.
**Concepts:**
- the first RTK Query mutation (`setStatus`);
- `providesTags` / `invalidatesTags` by type, so the list refetches;
- a labelled checkbox;
- disabling the control while pending;
- one inline error near the list for a failed mutation;
- the MSW fake gains the status endpoint.

**Aside:** RTK Query's "tags" are cache labels. They have nothing to do with our **Tag**.
**Done when:** ticking survives a reload · the tests cover marking a Todo Completed and a failure showing the error · CI is green

### Step 17: Tags · API

**Goal:** create, list, rename and delete Tags.
**Concepts:**
- `Entities/Tag.cs` and an implicit many-to-many (`Todo.Tags` / `Tag.Todos`);
- the `AddTags` migration, read together (Tags table + link table + `NOCASE` unique index);
- `Endpoints/TagEndpoints.cs`;
- alphabetical order ignoring case;
- checking for a duplicate first and returning `409 Conflict` with a `detail`, with the index as the backstop;
- a case-only rename of a Tag is allowed.

**Done when:** the `.http` Tag calls behave · the tests cover create, a duplicate in different case (409), a case-only rename and the alphabetical list · CI is green

### Step 18: Tags on Todos · API

**Goal:** Todos carry Tags. Deleting a Tag removes it from its Todos but never deletes them.
**Concepts:**
- a required `tagIds` on create and update (`[]` allowed, duplicates ignored, an unknown id → 400 naming it);
- replacing a many-to-many set;
- embedding Tags in `TodoResponse`, sorted, via `Include`;
- deleting a Tag only removes its link rows;
- the contract test extended to cover embedded Tags.

**Done when:** a Todo created with `tagIds` comes back with its Tags · after deleting a Tag, its Todos remain without it · CI is green

### Step 19: Quick add · UI

**Goal:** type a Title, press Enter, and the new Todo appears at the bottom.
**Concepts:**
- a controlled input with `useState`;
- the `addTodo` mutation (`tagIds: []` for now);
- clearing the input on success;
- showing the 400 field error from the failed mutation's `error`, never copied into state;
- the MSW fake gains `POST`.

**Done when:** a quick-added Todo appears last and survives a reload · the tests cover adding, and a server 400 showing under the input · CI is green

### Step 20: Tags in the sidebar · UI

**Goal:** the sidebar lists Tags, and `+` adds one.
**Concepts:**
- `tagsApi.ts` via `injectEndpoints` (`getTags`, `addTag`);
- Tag mutations invalidate `'Tag'` **and** `'Todo'`, because Todos embed Tag names;
- the 409 message shown under the list;
- the frontend `Todo` type gains `tags`;
- the MSW fake gains Tags.

**Done when:** a new Tag appears in alphabetical order · the tests cover adding a Tag, and a duplicate showing the API's message · CI is green

### Step 21: Rename and delete Tags; Tag chips · UI

**Goal:** hover a Tag to rename or delete it, and see each Todo's Tags as chips.
**Concepts:**
- inline editing state with `useState`;
- `renameTag` / `deleteTag`;
- hover-revealed controls that still have accessible names;
- Tag chips on list rows.

**Done when:** renaming a Tag updates the chips on its Todos · deleting it removes the chips but keeps the Todos · the tests cover rename and delete · CI is green

### Step 22: Filtering by Status and Tag · API

**Goal:** `GET /api/todos?status=…&tagId=…` returns only the matching Todos.
**Concepts:**
- query-string binding;
- filters that combine (AND), where unset means "any";
- composing an `IQueryable`;
- an unknown `tagId` gives an empty list, and a malformed one a 400.

**Done when:** the `.http` requests show each combination · the tests cover Status only, Tag only, both, and an unknown Tag · CI is green

### Step 23: Status selection and Tag selection · UI

**Goal:** choose a Status and/or a Tag in the sidebar to limit the list.
**Concepts:**
- the first hand-written `createSlice`, `selectionSlice` (`{ status, tagId }`, reset on reload);
- `useAppSelector` / `useAppDispatch`;
- query args, where each selection is its own cache entry;
- `extraReducers` with `addMatcher(deleteTag.matchFulfilled)`, so deleting the selected Tag clears the Tag selection;
- quick add under a Tag selection gives the new Todo that Tag (the placeholder says so);
- the "Any status" / "Any tag" labels and a heading naming the selection.

**Done when:** choosing Active hides Completed Todos · the tests cover selecting a Status, deleting the selected Tag (back to "Any tag"), and quick add under a Tag · CI is green

### Step 24: Sidebar counts · UI

**Goal:** each Status and Tag in the sidebar shows how many Todos it would show.
**Concepts:**
- one unfiltered `getTodos({})` query;
- memoized selectors with `createSelector` (the first ones);
- Status counts respect the Tag selection, and Tag counts respect the Status selection;
- unit tests of the selectors on plain arrays (about 3).

**Aside:** at scale you'd ask the server for counts instead of downloading every Todo.
**Done when:** the counts update as Todos change and selections change · the selector unit tests pass · CI is green

### Step 25: Detail panel and Delete Todo · UI

**Goal:** click a Todo to see it in the right-hand panel, and delete it from there.
**Concepts:**
- a second slice, `selectedTodoSlice`, with a `deleteTodo` matcher that clears the selection;
- `getTodo(id)` for the panel;
- the placeholder when nothing is selected;
- the "hidden from the list" note when the selected Todo stops matching the selections.

**Done when:** selecting and deleting work · the tests cover selecting a Todo, deleting it (the panel goes back to the placeholder), and the hidden note · CI is green

### Step 26: Edit in the detail panel · UI

**Goal:** edit a Todo's Title, Description, Status and Tags in the panel.
**Concepts:**
- a form in `useState`, reset when the selection changes;
- Save disabled until something changes;
- 400 field errors next to their fields;
- Tag toggle chips that save immediately (`tagIds` replaces the set), with `aria-label`s and real `<label>`s.

**Done when:** edits survive a reload · the tests cover saving a new Title, a 400 next to the Title field, and toggling a Tag · CI is green

### Step 27: Clear completed · API

**Goal:** `DELETE /api/todos/completed?tagId=…` deletes the Completed Todos under an optional Tag.
**Concepts:**
- a fixed route next to `{id:guid}` (the constraint keeps them apart);
- a bulk delete with `ExecuteDeleteAsync`;
- the Position gaps it leaves are harmless.

**Done when:** the tests cover clearing everything, clearing under one Tag (other Completed Todos stay), and Active Todos never being touched · CI is green

### Step 28: Clear completed (n) · UI

**Goal:** a "Clear completed (n)" button in the list header, hidden when n is 0.
**Concepts:**
- a count selector over the unfiltered `getTodos({})` that respects the Tag selection (with a unit test);
- a mutation with no confirmation, where the count on the button is the warning.

**Done when:** clearing under a Tag selection leaves other Completed Todos · the tests cover the count, clearing, and the button hiding at 0 · CI is green

### Step 29: Move · API

**Goal:** `POST /api/todos/{id}/move` with exactly one of `beforeId` / `afterId` puts the Todo right next to the target.
**Concepts:**
- the handler wires in the step-5 `TodoOrdering` rule;
- shifting Positions in a single transaction;
- 400 for both, neither or the same id, and 404 for an unknown Todo;
- why the Position index isn't unique (SQLite checks UNIQUE row by row).

**Done when:** the `.http` Moves reorder the GET list · the tests cover up, down, a hidden Todo not reshuffled, and the errors · CI is green

### Step 30: Move buttons · UI

**Goal:** ▲▼ buttons on hover and on the selected row move a Todo past its shown neighbour.
**Concepts:**
- the target comes from the *shown* list (up sends `beforeId` = the Todo above; down sends `afterId` = the Todo below);
- disabled at the ends;
- one Move at a time (a single `useMoveTodoMutation`, every Move button disabled while pending, and a comment explaining why);
- icon buttons with `aria-label`s;
- plain refetch.

**Done when:** Moves survive a reload, including under a selection · the tests cover moving up and down and the disabled ends · CI is green

### Step 31: Optimistic Status change · UI

**Goal:** ticking a Todo updates every list instantly, and rolls back if the server fails.
**Concepts:**
- `onQueryStarted`;
- `selectCachedArgsForQuery` + `updateQueryData` over every cached `getTodos` list;
- `patch.undo()`;
- a pure `applyStatus` in `src/features/todos/optimistic.ts`, where a Todo leaves lists whose Status selection no longer matches and is never inserted;
- its unit tests (about 2–3);
- a gate test (the list changes *before* the server answers) and a rollback test (500).

**Done when:** the tick shows before the response (try Chrome's slow-network throttling) · the unit, gate and rollback tests pass · CI is green

### Step 32: Optimistic Move · UI

**Goal:** Moves show instantly in every cached list that holds both Todos.
**Concepts:**
- a pure `moveNextTo(list, id, targetId, side)`;
- lists missing either Todo wait for the refetch;
- why one Move at a time still matters;
- about 5 unit tests plus gate and rollback tests.

**Done when:** a Move shows before the response · the tests pass · CI is green

---

## Hardening

### Step 33: End-to-end smoke tests · E2E

**Goal:** three Playwright tests prove the real UI, API and database are wired together.
**Concepts:**
- `@playwright/test`, Chromium only, with specs in `frontend/e2e/` and run by `npm run e2e`;
- a `webServer` array that starts both servers (`reuseExistingServer: !process.env.CI`), with `/api/tags` as the API readiness URL;
- a separate `e2e.db` via `ConnectionStrings__<Name>`;
- unique Titles and Tag names per test.

The three smoke tests:
1. Quick add, reload, and the Todo is still there.
2. Move up, reload, and the order is kept.
3. Tag → select → quick add → Completed → Clear completed.

A separate e2e CI job uploads the HTML report when it fails.
**You do:** `npx playwright install chromium`.
**Must confirm:** `launchSettings.json` doesn't override the connection-string variable. If it does, use `dotnet run -e …` or `--no-launch-profile`.
**Done when:** `npm run e2e` passes locally without touching `todo.db` · the e2e CI job is green

### Step 34 (optional): Optimistic concurrency · API

**Goal:** saving a Todo that changed elsewhere since you loaded it gives a 409 instead of silently overwriting it.
**Concepts:**
- a `Version` Guid concurrency token and its migration;
- `version` in `TodoResponse`, required on `PUT`;
- `DbUpdateConcurrencyException` → 409 ProblemDetails.

**Done when:** the tests cover a stale `version` getting 409 and a current one succeeding · CI is green

### Step 35 (optional): "Changed elsewhere" · UI

**Goal:** the detail panel tells you when your edit lost a race, and reloads the Todo.
**Concepts:**
- sending `version` on Save;
- handling a 409 by showing "changed elsewhere" and refetching;
- the MSW fake tracks versions.

**Done when:** the two-browser-tab demo shows the message · a component test covers it · CI is green
