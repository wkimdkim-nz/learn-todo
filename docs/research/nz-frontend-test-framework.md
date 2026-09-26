# Which frontend test framework is most in demand in the NZ job market?

Research for [issue #2](https://github.com/wkimdkim-nz/learn-todo/issues/2) (part of map #1).
Researched 2026-09-26. Job-ad data is a snapshot from that day and will go stale.

## Answer (short)

Use **Vitest + React Testing Library** for unit and component tests, and add **Playwright** for a small number of end-to-end tests once the React app talks to the .NET API.

- In NZ ads, **Vitest and Jest are about equally common**, and ads usually list them as alternatives ("Vitest / Jest"). What you learn in one carries over to the other.
- For a Vite + Redux Toolkit app, the primary sources all favour Vitest: Jest's own docs say Jest is not supported by Vite, and the official Redux Vite template ships with Vitest and React Testing Library.
- For end-to-end tests, **Playwright is named far more often than Cypress** in NZ ads, and it shows up in both developer and QA/test roles. In every developer ad I read that named Cypress, Playwright was listed next to it.

## 1. NZ job-market evidence

### Method

- **Source:** SEEK NZ (nz.seek.com), keyword searches in quotes so they match the exact word, all of New Zealand, 2026-09-26.
- **Context:** a quoted search for "react" in the ICT classification returned 87 jobs ([search](https://nz.seek.com/jobs?keywords=%22react%22&classification=6281)). The test-tool numbers below are small compared with that, because most ads don't name a test tool at all.
- **Full reads:** I opened 10 individual ads (8 developer roles, 2 QA/test roles) and recorded which tools each one names.

### Listing counts (quoted keyword, SEEK NZ, 2026-09-26)

| Keyword | Listings | Distinct employers/advertisers | Search |
|---|---|---|---|
| "playwright" | 22 | ~16 (mix of dev and QA/test roles) | [link](https://nz.seek.com/jobs?keywords=%22playwright%22) |
| "cypress" | 13 | ~9 (mostly QA/test roles) | [link](https://nz.seek.com/jobs?keywords=%22cypress%22) |
| "jest" | 9 | 5 | [link](https://nz.seek.com/jobs?keywords=%22jest%22) |
| "vitest" | 7 | 4 | [link](https://nz.seek.com/jobs?keywords=%22vitest%22) |
| "testing library" | 1 | 1 | [link](https://nz.seek.com/jobs?keywords=%22testing%20library%22) |

C3 Limited posted the same Senior Developer ad in 4 cities, so it adds 4 listings to every row except "testing library". Count it once and the Vitest and Jest totals are almost identical.

### The ads I read in full

| Role (advertiser) | Unit/component | E2E | Frontend stack | Source |
|---|---|---|---|---|
| Senior Web Engineer (Humankind for Emerge) | "Jest, Vitest, Testing Library" | "Playwright or Cypress" | React, TypeScript, Vite | [ad](https://nz.seek.com/job/94824913) |
| Senior Developer (C3 Limited, 4 cities) | "Vitest / Jest" | "Playwright / Cypress" | React/React Native, TypeScript | [ad](https://nz.seek.com/job/94353675) |
| Tech Lead (Rush Digital) | "xUnit, Vitest" | "Playwright" | React; .NET Core backend | [ad](https://nz.seek.com/job/94377851) |
| Lead Frontend Engineer (Potentia) | "Vitest, Jest or similar" | Playwright (nice-to-have) | Vue, TypeScript | [ad](https://nz.seek.com/job/94416481) |
| Senior Software Development Engineer (Law Cyborg) | Jest | none | React (backend-heavy) | [ad](https://nz.seek.com/job/94347616) |
| Fullstack Engineer (Pilot Tech) | "unit, component" (no tool named) | "Playwright or Cypress" | React/Vue, Next/Nuxt, TypeScript | [ad](https://nz.seek.com/job/94680393) |
| Frontend Leaning Full Stack (placeMe) | none | Playwright (or Jasmine/Cucumber) | Angular, TypeScript | [ad](https://nz.seek.com/job/94721547) |
| Intermediate Full Stack (Techion) | none | Playwright | Angular, ASP.NET Web API | [ad](https://nz.seek.com/job/94302449) |
| *QA:* Automation Test Engineer (Sunstone) | "Playwright & Jest" | Playwright | TypeScript | [ad](https://nz.seek.com/job/94318343) |
| *QA:* Test Engineer (KiwiRail) | none | "Playwright, Selenium or Cypress" (advantageous) | none | [ad](https://nz.seek.com/job/94790318) |

Tallies across the 8 developer ads:

- **Unit/component runner:** Vitest appears in 4, Jest in 4, and 3 of those ads list both as alternatives.
- **E2E:** Playwright appears in 7, Cypress in 3, and all 3 Cypress mentions also name Playwright.
- **React Testing Library:** named in 1 (as "Testing Library").
- **TypeScript:** named in 7 of 8.
- **.NET:** Rush Digital pairs Vitest and Playwright with xUnit and .NET, which is the same shape as this project.

### Other sources I tried, and why I didn't use them

- **LinkedIn NZ** (guest job search): the counts are too loose to use. For example, "Cypress" returned "6,000+" jobs that included nurses and valuers, and "Vitest" returned "1,000+" that included finance roles ([Cypress](https://www.linkedin.com/jobs/search?keywords=%22Cypress%22&location=New%20Zealand), [Vitest](https://www.linkedin.com/jobs/search?keywords=%22Vitest%22&location=New%20Zealand)). The only pattern visible was that QA roles dominated the Playwright results ([search](https://www.linkedin.com/jobs/search?keywords=%22Playwright%22&location=New%20Zealand)).
- **Trade Me Jobs:** "react" returned 8 results, mostly unrelated to software, and "jest" returned 0 ([react](https://www.trademe.co.nz/a/jobs/search?search_string=react), [jest](https://www.trademe.co.nz/a/jobs/search?search_string=jest)). Trade Me is not where NZ tech roles are advertised in volume.
- **www.seek.co.nz:** returned HTTP 403 to my fetcher. nz.seek.com served the same listings.

### Limits of this evidence

- This is one day's snapshot, and the numbers are small (single digits to low twenties). It shows a direction; it doesn't measure anything precisely.
- A quoted search for "react testing library" returned 0 results, while "testing library" returned 1. Ads may call it "RTL" or not name it at all, so this search probably undercounts React Testing Library.
- Most NZ React ads don't name a test tool. They say "automated testing" or "unit tests". Employers seem to care more that you can write good tests than which runner you used.
- Recruiter reposts and multi-city duplicates (C3) inflate the counts. Where I could, I counted distinct employers.

## 2. Fit with Vite + Redux Toolkit (primary docs)

- **Vitest is built for Vite:**
  - It reads your existing `vite.config.*`, so the same plugins and config apply to tests with no extra setup ([Vitest guide](https://vitest.dev/guide/)).
  - Current version: v5.0.2. It requires Vite >= 6.4 and Node >= 22.12 ([Vitest guide](https://vitest.dev/guide/)).
- **Jest does not fit this project well:**
  - Jest's own getting-started page says Jest is not supported by Vite, because of incompatibilities with the Vite plugin system.
  - The same page points Vite users to Vitest, noting its API is compatible with Jest's ([Jest docs](https://jestjs.io/docs/getting-started)).
  - Using Jest here would mean adding a separate Babel or ts-jest transform ([Jest docs](https://jestjs.io/docs/getting-started)).
- **Redux's own guidance:**
  - Redux's "Writing Tests" page says Vitest is "an increasingly common choice... (used by the Redux library repos), though Jest is still used widely."
  - It recommends React Testing Library or Vitest Browser Mode for components connected to Redux, and MSW for mocking network requests.
  - It says to prefer integration tests: render a real store inside `<Provider>` and assert on what the user sees ([Redux: Writing Tests](https://redux.js.org/usage/writing-tests)).
- **The official Redux + Vite template:**
  - `vite-template-redux` runs `"test": "vitest --run"`.
  - Its test dependencies include `vitest`, `@testing-library/react`, `@testing-library/user-event` and `@testing-library/jest-dom` ([package.json](https://github.com/reduxjs/redux-templates/blob/master/packages/vite-template-redux/package.json)).
- **React Testing Library isn't a test runner:**
  - It isn't a framework either, and it works with any runner.
  - Its guiding principle is that tests should resemble how the software is used ([RTL intro](https://testing-library.com/docs/react-testing-library/intro/)).
  - Because it works with any runner, what you learn with Vitest carries over to a Jest codebase.
- **Moving between Vitest and Jest:**
  - Vitest's migration guide lists a small set of differences: globals are off by default, `vi.*` replaces `jest.*`, and module mocks behave slightly differently ([Vitest: Migrating from Jest](https://vitest.dev/guide/migration/jest)).
  - That list is short enough that someone who knows Vitest can pick up a Jest codebase quickly.
- **Playwright:**
  - It runs on Chromium, Firefox and WebKit, and provides a UI mode (`npx playwright test --ui`) with time-travel debugging and a code generator ([Playwright intro](https://playwright.dev/docs/intro)).
  - It has official Node.js, Python, Java and **.NET** versions ([Playwright intro](https://playwright.dev/docs/intro)). That matters for a project with a .NET backend.
  - Component testing is now a built-in, non-experimental fixture ([Playwright component testing](https://playwright.dev/docs/test-components)).
- **Cypress:**
  - It covers both e2e and component tests, on Chrome-family browsers and Firefox ([Why Cypress](https://docs.cypress.io/app/get-started/why-cypress)).
  - Its documented trade-offs: tests run inside the browser in JavaScript only, it can control only one browser at a time, and each test is tied to one superdomain ([Cypress trade-offs](https://docs.cypress.io/app/references/trade-offs)).
  - Features such as Test Replay and parallel orchestration are part of the paid Cypress Cloud ([Why Cypress](https://docs.cypress.io/app/get-started/why-cypress)).

## 3. Recommendation for this project (beginner)

**Unit and component tests (start here): Vitest + React Testing Library + user-event + jest-dom**

- It's the stack the official Redux Vite template already uses, so there's almost nothing to configure.
- It matches the Redux team's advice: write integration-style tests with a real store, and treat Redux as an implementation detail.
- Vitest is named in NZ ads as often as Jest, and knowing it lets you work in a Jest codebase with little extra learning.

**End-to-end tests: Playwright, but later and small**

- Hold off until the React app is calling the real .NET API. Then write 2–5 smoke tests, for example "add a todo, reload, it's still there".
- It's the e2e tool named most often in NZ ads, in both developer and QA roles, and it has an official .NET binding.
- Cypress isn't worth learning as well. Every developer ad that named it also accepted Playwright.

**Skip for now:** Jest, as a separate tool (you learn its concepts through Vitest anyway), and Vitest Browser Mode. Browser Mode needs Playwright or WebdriverIO underneath in CI ([Vitest Browser Mode](https://vitest.dev/guide/browser/)), which is too many moving parts while you are still learning React.
