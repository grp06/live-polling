# Consolidate client fetch error handling

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `.agent/PLANS.md` from the repository root and must be maintained in accordance with its requirements.

## Purpose / Big Picture

Reduce duplicated client-side fetch/JSON error handling by introducing a small shared helper and refactoring the attendee, results polling hook, and admin UI to use it. After this change, all client fetches will follow the same error and JSON parsing behavior with consistent fallback messages, so tweaks to error handling or response parsing happen in one place while UI behavior stays the same.

## Progress

- [x] (2026-01-29 02:00Z) ExecPlan drafted from repo analysis.
- [x] (2026-01-29 02:20Z) Added failing Jest tests for the shared fetch helper.
- [x] (2026-01-29 02:40Z) Implemented the shared helper and refactored client call sites to use it.
- [x] (2026-01-29 02:45Z) Ran Jest and confirmed client error messages remain the same.

## Surprises & Discoveries

No surprises during implementation; the helper matched existing error behavior without changes.

## Decision Log

- Decision: Centralize client-side fetch + JSON error handling into `lib/apiClient.ts` and update `app/page.tsx`, `app/admin/AdminClient.tsx`, and `lib/hooks/usePollState.ts` to use it.
  Rationale: These files currently duplicate the same `fetch` + `response.json()` + `response.ok` + `payload.error` pattern, so a single helper reduces duplication with a small blast radius and preserves behavior.
  Date/Author: 2026-01-29 / Codex

## Outcomes & Retrospective

Client-side fetch/JSON error handling now flows through `lib/apiClient.ts`, removing repeated `fetch` + `response.json()` + `response.ok` checks in the attendee page, admin UI, and polling hook. Jest passes, including new helper tests, and fallback error messages remain consistent with the pre-refactor behavior.

## Context and Orientation

Client-side fetches currently live in three files. The attendee page (`app/page.tsx`) posts votes to `/api/vote` and manually parses JSON errors. The polling hook (`lib/hooks/usePollState.ts`) loads `/api/poll` and parses JSON to surface errors. The admin UI (`app/admin/AdminClient.tsx`) issues requests to `/api/admin/open`, `/api/admin/close`, `/api/admin/clear`, and `/api/admin/presets`, repeating the same `fetch` + `response.json()` + `response.ok` checks with slightly different fallback messages. These call sites can share a thin helper without changing UI behavior. Jest is the unit test runner (`npm test`).

Run Logs: Not provided in prompt.

## Plan of Work

Create a small helper module `lib/apiClient.ts` that exports a `fetchJson` function. This helper should call `fetch`, parse the JSON body once, and throw `Error` with a message that mirrors the current fallback messages when `response.ok` is false. Then refactor client call sites to use the helper, ensuring each use site passes the same fallback message it uses today. Keep route-specific validation and post-processing logic intact (for example, the presets response still verifies that `polls` is an array). Add Jest coverage for the helper using mocked `global.fetch`, and ensure tests fail before the helper exists, then pass once the helper and refactor are complete.

## Concrete Steps

Work from `/Users/georgepickett/live-polling`.

First, add a new test file `lib/__tests__/apiClient.test.ts` that exercises the helper. Mock `global.fetch` to return a resolved response object with `ok` and `json()` fields. Cover at least these cases:

- When `ok` is true, `fetchJson` returns the parsed payload.
- When `ok` is false and the payload has an `error` string, `fetchJson` throws with that error message.
- When `ok` is false and the payload has no `error`, `fetchJson` throws with the provided fallback message.

Run `npm test` and confirm the tests fail because `lib/apiClient.ts` does not exist yet.

Next, implement `lib/apiClient.ts` with a `fetchJson` function. The helper should accept the fetch input, the optional init, and an options object that includes a required `errorMessage` fallback string. It should parse JSON once, throw `Error` with the payload error when present, and throw `Error` with the provided fallback when not. Do not swallow JSON parsing errors; allow them to propagate as they do today.

Then refactor these call sites to use `fetchJson` while keeping existing UI behavior intact:

- `lib/hooks/usePollState.ts`: replace the inline `fetch` + `response.json()` logic with `fetchJson` and keep the fallback message `failed to load poll state`.
- `app/page.tsx`: in `submitVote`, use `fetchJson` with fallback `failed to submit vote`.
- `app/admin/AdminClient.tsx`: replace the repeated `fetch` + `response.json()` code in `loadPresets`, `handleOpen`, `handleClose`, and `handleClearAll` with `fetchJson` and preserve the existing fallback messages (`failed to load presets`, `failed to open poll`, `failed to close poll`, `failed to clear polls`). Keep the `invalid presets response` check and other admin-specific validations as-is.

Finally, run `npm test` again and confirm all Jest suites pass.

## Validation and Acceptance

Run `npm test` from `/Users/georgepickett/live-polling` and expect all tests to pass, including the new `apiClient` tests. Verify that the error messages thrown by client requests still match the previous fallback strings when `response.ok` is false:

- `usePollState` still surfaces `failed to load poll state` when `/api/poll` responds with a non-OK status lacking an error message.
- Vote submission still surfaces `failed to submit vote` on non-OK responses without an `error` payload.
- Admin actions still surface the same fallback messages (`failed to open poll`, `failed to close poll`, `failed to clear polls`, `failed to load presets`) when appropriate.

## Idempotence and Recovery

These changes are safe to repeat. If a refactor changes error messages unexpectedly, revert that call site to the previous inline logic and compare the helper behavior until parity is restored.

## Artifacts and Notes

Capture a small diff showing the new helper and one refactored call site (e.g., `usePollState`) to document the consolidation.

## Interfaces and Dependencies

Add `lib/apiClient.ts` with a single helper function similar to:

    export type FetchJsonOptions = {
      errorMessage: string;
    };

    export async function fetchJson<T>(
      input: RequestInfo | URL,
      init: RequestInit | undefined,
      options: FetchJsonOptions
    ): Promise<T>;

The helper should rely only on the global `fetch` API and not introduce new dependencies.

Plan Change Log: Initial draft created on 2026-01-29. Progress updated after adding failing tests on 2026-01-29. Progress, outcomes, and discoveries updated after implementation on 2026-01-29.
