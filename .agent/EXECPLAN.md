# Consolidate poll state fetching and polling into a shared hook

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

If a PLANS.md file is checked into the repo, follow it exactly. The governing document for this plan is `.agent/PLANS.md` from the repository root; keep this ExecPlan consistent with it.

## Purpose / Big Picture

After this change, the attendee page (`/`), the projector results page (`/results`), and the admin console (`/admin`) all use a shared hook to load poll state, handle errors, and optionally poll on a fixed interval. This removes duplicated fetch logic while preserving the current UI and network behavior (same API endpoints, same polling cadence). You can see it working by running the dev server and confirming all three pages still load poll state and update live as before, and by running the Jest suite to confirm the polling test still passes.

## Progress

- [x] (2026-01-29 02:53Z) Audited poll state flows and drafted this ExecPlan.
- [x] (2026-01-29 03:04Z) Implement shared hook for anon id storage and poll state loading in `lib/hooks/usePollState.ts`.
- [x] (2026-01-29 03:04Z) Refactor `app/page.tsx`, `app/results/page.tsx`, and `app/admin/AdminClient.tsx` to use the shared hook.
- [x] (2026-01-29 03:04Z) Add `lib/__tests__/usePollState.test.ts` and run Jest (all tests pass).
- [ ] Manually verify polling and admin actions in the browser.

## Surprises & Discoveries

- Observation: Poll state fetching and error handling are duplicated across `app/page.tsx`, `app/results/page.tsx`, and `app/admin/AdminClient.tsx`.
  Evidence: Each file issues `fetch(/api/poll?anonId=...)`, parses error payloads, and updates local error state.
- Observation: Jest test matching only includes `**/__tests__/**/*.test.ts`, so hook tests must avoid JSX unless the extension changes.
  Evidence: Initial JSX in `lib/__tests__/usePollState.test.ts` failed to parse until converted to `React.createElement` calls.

## Decision Log

- Decision: Centralize anon-id storage and poll state fetching in a shared React hook that can optionally poll on an interval.
  Rationale: This removes three nearly identical fetch flows and reduces the risk of divergent behavior while touching a small, testable surface area.
  Date/Author: 2026-01-29 / Codex
- Decision: Keep page-level error state for user actions and sync it from the hook's error output to preserve existing behavior.
  Rationale: Vote/admin errors should still surface immediately, but polling success should clear them just as before.
  Date/Author: 2026-01-29 / Codex

## Outcomes & Retrospective

- Completed the hook refactor and test coverage; all Jest tests pass. Manual browser validation remains.

## Context and Orientation

This is a Next.js App Router repo. Poll state is exposed via `app/api/poll/route.ts`, which returns a `PollState` shape defined in `lib/pollTypes.ts`. Client pages use that endpoint to load state and render UI:

- `app/page.tsx` (attendee UI) loads poll state, polls every second, and submits votes.
- `app/results/page.tsx` (projector UI) loads poll state and polls every second.
- `app/admin/AdminClient.tsx` loads poll state on demand and after admin actions.

Anonymous IDs are stored in `localStorage` with page-specific keys (`anonId`, `resultsAnonId`, `adminAnonId`). The refactor keeps those keys unchanged so existing browsers continue to work.

Run Logs: `/Users/georgepickett/live-polling/.agent/journal`.

## Plan of Work

Create a shared client hook under `lib/hooks/` that owns two responsibilities: creating or reusing the anon id in `localStorage`, and fetching poll state from `/api/poll` with consistent error handling. The hook should expose the current `PollState`, any error message, and a `refresh` function. It should also accept an optional polling interval so caller pages can opt into `setInterval` polling without reimplementing it.

Refactor `app/page.tsx`, `app/results/page.tsx`, and `app/admin/AdminClient.tsx` to use the new hook. For the attendee and results pages, enable the 1-second polling interval to preserve existing behavior. For the admin client, disable interval polling and call `refresh` after open/close/clear actions, matching current on-demand updates.

Add a focused Jest test for the hook to confirm it performs an initial fetch, respects the polling interval, and uses the intended `localStorage` key. Keep the existing `app/__tests__/resultsPolling.test.ts` passing; update it only if the hook changes how many fetches occur per interval.

## Concrete Steps

From the repo root (`/Users/georgepickett/live-polling`), create the new hook files and refactor the three client pages. Then add or adjust tests.

Run the focused polling test:

    npm test -- --runTestsByPath app/__tests__/resultsPolling.test.ts

Expected output includes:

    PASS app/__tests__/resultsPolling.test.ts

Run the full Jest suite:

    npm test

Expected output includes only PASS lines and a zero exit code.

If manual validation is desired, start the dev server:

    npm run dev

Then visit `/`, `/results`, and `/admin?key=...` and confirm polling behavior and admin actions still work.

## Validation and Acceptance

The refactor is accepted when all of the following are true:

- The attendee page and results page both poll `/api/poll` every 1000 ms and update UI as before.
- The admin page loads poll state on first render and after open/close/clear actions without introducing interval polling.
- `localStorage` keys remain `anonId`, `resultsAnonId`, and `adminAnonId`.
- Jest tests pass, including the existing results polling test and the new hook test.
- Manual checks confirm: open a poll from `/admin`, see live updates on `/` and `/results`, close the poll, and see history updates.

## Idempotence and Recovery

This refactor is code-only and safe to repeat. If a step goes wrong, revert the affected files to the previous commit and re-apply the changes. No data migrations or external services are involved.

## Artifacts and Notes

Example hook signature to implement:

    type UsePollStateOptions = {
      storageKey: string;
      pollIntervalMs?: number | null;
    };

    type UsePollStateResult = {
      anonId: string | null;
      state: PollState | null;
      error: string | null;
      refresh: () => Promise<void>;
    };

    export function usePollState(options: UsePollStateOptions): UsePollStateResult;

## Interfaces and Dependencies

Create `lib/hooks/usePollState.ts` (and `lib/hooks/useAnonId.ts` if you prefer to separate concerns). The hook must use the browser `fetch` API and the `PollState` type from `lib/pollTypes.ts`. It must not introduce new dependencies; stay within React hooks and existing utilities. The hook must call `/api/poll?anonId=${anonId}` and preserve the current error handling semantics (read `{ error?: string }` from JSON when `response.ok` is false, and set a human-readable message in state).

In `app/page.tsx`, `app/results/page.tsx`, and `app/admin/AdminClient.tsx`, replace the duplicated `useEffect` + `fetch` logic with the hook, keeping existing UI logic and vote submission unchanged.

If you need a polling interval helper, keep it inside the hook; do not create a separate utility unless reuse demands it.

At the end of this ExecPlan, update the `Progress`, `Decision Log`, and `Outcomes & Retrospective` sections to reflect work completed and any changes in direction.

Plan update note: Updated progress, discoveries, decisions, and outcomes after implementing the shared poll-state hook, refactoring client pages, and running Jest to confirm passing tests.
