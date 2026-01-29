# Consolidate API route helpers

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `.agent/PLANS.md` from the repository root and must be maintained in accordance with its requirements.

## Purpose / Big Picture

Reduce duplicated API route boilerplate by centralizing JSON parsing, admin authorization, and standard 500-error handling into a shared helper. After this change, API behavior stays the same, but error handling and request parsing are consistent and maintainable in one place.

## Progress

- [x] (2026-01-29 04:17Z) ExecPlan drafted from repo analysis.
- [x] (2026-01-29 04:19Z) Add failing tests for shared API helpers and update admin utils tests to import the new shared module.
- [x] (2026-01-29 04:20Z) Implement shared helpers in `app/api/_utils.ts` and remove `app/api/admin/_utils.ts`.
- [x] (2026-01-29 04:20Z) Update API routes to use the shared helpers and confirm error responses stay the same.
- [x] (2026-01-29 04:22Z) Run Jest and verify API behavior with manual smoke checks.

## Surprises & Discoveries

- Observation: Local dev server ran on port 3002 because port 3000 was already in use.
  Evidence: Next.js dev output indicated port fallback to 3002.

## Decision Log

- Decision: Consolidate JSON parsing, admin authorization, and 500-error response handling into `app/api/_utils.ts`, then update routes and tests to use it.
  Rationale: The same error handling and JSON parsing logic is duplicated in `app/api/poll/route.ts`, `app/api/vote/route.ts`, and `app/api/admin/*`, so a shared helper reduces drift without changing behavior.
  Date/Author: 2026-01-29 / Codex

## Outcomes & Retrospective

Completed shared API helper consolidation with tests and manual API smoke checks. The API error payloads for invalid JSON, missing `anonId`, and unauthorized admin key match prior behavior, and the routes now share a single helper module for JSON parsing, admin authorization, and 500 responses. No follow-up work identified.

## Context and Orientation

The Next.js App Router API routes live under `app/api`. Admin routes (`app/api/admin/open/route.ts`, `app/api/admin/close/route.ts`, `app/api/admin/clear/route.ts`, `app/api/admin/presets/route.ts`) share helpers defined in `app/api/admin/_utils.ts` for `requireAdminKey`, `ensureAuthorized`, and `parseJson`. The poll and vote routes (`app/api/poll/route.ts`, `app/api/vote/route.ts`) implement their own JSON parsing and repeat the same `console.error` plus `{ error: message }` 500 response pattern that also appears in admin routes. Tests for the admin helpers live in `app/api/admin/__tests__/adminUtils.test.ts` and assert specific error payloads and status codes. The goal is to move the shared helpers into `app/api/_utils.ts`, update all routes to import from there, keep response payloads unchanged, and delete `app/api/admin/_utils.ts`.

Run Logs: Not provided in prompt.

## Plan of Work

Start with tests to lock in current behavior. Update `app/api/admin/__tests__/adminUtils.test.ts` to import helpers from the new shared module, and add a new test that exercises the new 500-error helper. Run Jest and confirm the test fails because the new helper does not exist yet, so the refactor is driven by a failing test. Next, implement `app/api/_utils.ts` by moving the existing admin helper implementations and adding a `handleRouteError` helper that logs with `console.error(label, error)` and returns the same error JSON shape. Then update all API routes to import the shared helpers, replace their local JSON parsing and 500-error response code with the shared functions, and remove `app/api/admin/_utils.ts`. Finally, re-run Jest and manually exercise the API routes to confirm the error messages and status codes are unchanged.

## Concrete Steps

Work from `/Users/georgepickett/live-polling`.

First, update tests before implementation. In `app/api/admin/__tests__/adminUtils.test.ts`, change the import to use `app/api/_utils.ts` and add a test that calls the new `handleRouteError` helper with a labeled `Error("boom")`, then asserts the response status is 500 and the JSON body equals `{ "error": "boom" }`. Run tests with:

  npm test

Expect a failing test because the new module or helper does not exist yet. A typical failure looks like:

  Cannot find module '@/app/api/_utils' from 'app/api/admin/__tests__/adminUtils.test.ts'

Next, implement the shared helper module at `app/api/_utils.ts` by moving the existing `requireAdminKey`, `ensureAuthorized`, and `parseJson` logic from `app/api/admin/_utils.ts` and adding `handleRouteError`. Update all routes to use the shared helper, including:

- `app/api/poll/route.ts`: replace the try/catch 500 handler with `return handleRouteError("GET /api/poll failed", error)`.
- `app/api/vote/route.ts`: replace the JSON parsing try/catch with `parseJson`, and replace the 500 handler with `handleRouteError("POST /api/vote failed", error)`.
- `app/api/admin/open/route.ts`, `app/api/admin/close/route.ts`, `app/api/admin/clear/route.ts`, `app/api/admin/presets/route.ts`: update imports to use the shared helper and replace their 500 handlers with `handleRouteError` calls.

After confirming all imports are updated, delete `app/api/admin/_utils.ts` and re-run tests:

  npm test

Finally, start the dev server and perform a quick smoke check that the API responses are unchanged:

  npm run dev

Then in another terminal, use the browser or curl to confirm the same error payloads and status codes for invalid JSON, missing `anonId`, and unauthorized admin key.

## Validation and Acceptance

Run `npm test` and expect all Jest tests to pass, including the updated admin utils tests and the new `handleRouteError` test. Start the dev server with `npm run dev` and verify:

- `GET http://localhost:3000/api/poll` (no `anonId`) returns status 400 and `{ "error": "anonId is required" }`.
- `POST http://localhost:3000/api/vote` with invalid JSON returns status 400 and `{ "error": "invalid json" }`.
- `POST http://localhost:3000/api/admin/open` with a missing or wrong key returns status 401 and `{ "error": "unauthorized" }`.

The responses and status codes must match the pre-refactor behavior.

## Idempotence and Recovery

These changes are safe to repeat. If the API responses change unexpectedly, restore the previous route-specific error handling and JSON parsing, then compare the shared helper implementation against the old logic before trying again.

## Artifacts and Notes

Capture a short diff showing `app/api/_utils.ts` and at least one updated route to document the consolidation without altering response payloads.

## Interfaces and Dependencies

Define these exports in `app/api/_utils.ts` and use them from all API routes:

  export type AdminKeyResult =
    | { ok: true; adminKey: string }
    | { ok: false; response: NextResponse };

  export type JsonResult<T> =
    | { ok: true; data: T }
    | { ok: false; response: NextResponse };

  export function requireAdminKey(): AdminKeyResult;
  export function ensureAuthorized(key: string | null | undefined, adminKey: string): NextResponse | null;
  export async function parseJson<T>(request: Request): Promise<JsonResult<T>>;
  export function handleRouteError(label: string, error: unknown): NextResponse;

The helper should use `NextResponse.json` from `next/server` and preserve the existing error payloads and status codes.

Plan Change Log: Initial draft created on 2026-01-29.
Plan Change Log: Marked failing-tests step complete after updating tests to reference shared helpers (2026-01-29).
Plan Change Log: Marked helper implementation and route updates complete after adding `app/api/_utils.ts` and updating API imports (2026-01-29).
Plan Change Log: Noted Jest completion while manual API smoke check remains pending (2026-01-29).
Plan Change Log: Marked validation step complete after manual API smoke checks (2026-01-29).
