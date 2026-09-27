## Agent skills

### Issue tracker

Issues live in GitHub Issues (wkimdkim-nz/learn-todo), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Build steps

The app is built one step at a time from the step tickets: the sub-issues of the spec, chained with "blocked by" links.

- Take the lowest-numbered open step with no open blocker, and claim it by assigning it before any work.
- Before writing code, read `docs/roadmap.md` §"How a step is delivered" and §"Rules every step follows".
- Work on a `step/NN-short-name` branch from the latest `main`, even when a skill (such as `/implement`) says to use the current branch.
- Open a PR titled `Step NN: …` that says `Closes #<ticket>`. The PR description is the walkthrough; there are no notes files.
- Never merge. Derek squash-merges to sign off.
