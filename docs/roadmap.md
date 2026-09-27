# Learning roadmap

The build plan for the Todo app: a .NET 10 minimal API with EF Core and SQLite, and a React + Redux Toolkit frontend styled with Tailwind. Each step is one small, readable delivery, filed as a GitHub issue. Claude writes the code, and Derek reads it and asks about anything that's unclear.

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

## Turning the steps into tickets

`/to-spec` wrote the spec, [#23](https://github.com/wkimdkim-nz/learn-todo/issues/23), and `/to-tickets` filed the steps as its sub-issues, [#24](https://github.com/wkimdkim-nz/learn-todo/issues/24)–[#59](https://github.com/wkimdkim-nz/learn-todo/issues/59). `/to-tickets` followed these rules instead of its defaults, and a ticket added later follows them too:

- **One ticket per step, 0–35.** Steps are not re-cut into slices through every layer: the one-stack, one-sitting budget above is what keeps each one reviewable. Steps 34–35 are filed too, with `(optional)` in their titles.
- **Each ticket is its step reshaped, with nothing re-derived.** File paths stay, because they were decided on the map and they tell Derek what to read.
  - **Title:** `Step NN: <heading>`, the step's heading without the stack suffix.
  - **Parent:** the spec issue.
  - **What to build:** the Goal.
  - **Concepts** and **Contents**: as written.
  - **You do**, **Must confirm**, **Aside** and **In the PR**: when the step has them.
  - **Acceptance criteria:** the Done when checks, as checkboxes.
  - **Blocked by:** the previous step.
- **Ordering and labels.** The tickets are sub-issues of the spec, chained in a straight line with GitHub's native "blocked by" links. The only label is `ready-for-agent` (create it if it's missing). There are no milestones or stack labels.
- **The tickets are canonical.** The step sections have left this file, which keeps the delivery rules and the phases. A step that splits in two becomes a new ticket inserted into the chain.

## Phases

| Phase | Steps | Tickets |
|---|---|---|
| Setup | 0 | [#24](https://github.com/wkimdkim-nz/learn-todo/issues/24) |
| Backend foundation | 1–8 | [#25](https://github.com/wkimdkim-nz/learn-todo/issues/25)–[#32](https://github.com/wkimdkim-nz/learn-todo/issues/32) |
| Frontend foundation | 9–14 | [#33](https://github.com/wkimdkim-nz/learn-todo/issues/33)–[#38](https://github.com/wkimdkim-nz/learn-todo/issues/38) |
| Features | 15–32 | [#39](https://github.com/wkimdkim-nz/learn-todo/issues/39)–[#56](https://github.com/wkimdkim-nz/learn-todo/issues/56) |
| Hardening | 33, plus the optional 34–35 | [#57](https://github.com/wkimdkim-nz/learn-todo/issues/57), plus [#58](https://github.com/wkimdkim-nz/learn-todo/issues/58)–[#59](https://github.com/wkimdkim-nz/learn-todo/issues/59) |

The steps live in the spec's sub-issues, [#23](https://github.com/wkimdkim-nz/learn-todo/issues/23), chained so each is blocked by the one before. Each ticket has **What to build**, the **Concepts** it teaches, and **Acceptance criteria** (the "done when" checks). **You do** marks something only Derek can do. **Must confirm** is a tool behaviour to check, with its fallback. **Aside** is a one-line note worth knowing, which isn't built.
