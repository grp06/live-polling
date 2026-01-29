# Consolidate admin API auth and JSON parsing

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

If a PLANS.md file is checked into the repo, follow it exactly. The governing document for this plan is `.agent/PLANS.md` from the repository root; keep this ExecPlan consistent with it.

## Purpose / Big Picture

After this change, all admin API routes (`/api/admin/open`, `/api/admin/close`, `/api/admin/clear`, `/api/admin/presets`) share a single, consistent path for validating `ADMIN_KEY` and parsing JSON payloads. This removes duplicated auth logic, fixes the current inconsistency where `clear` skips `ADMIN_KEY` configuration checks and JSON parsing errors, and makes future changes (like rotating the admin key or improving error messaging) a one-file update. You can see it working by running Jest tests for the helper and by manually calling the admin endpoints to confirm consistent 401/400/500 responses across routes.

## Progress

- [x] (2026-01-29 03:25Z) Write failing Jest tests for the admin API helper (missing `ADMIN_KEY`, unauthorized key, invalid JSON); tests fail due to missing `app/api/admin/_utils.ts`.
- [x] (2026-01-29 03:29Z) Implement the helper in `app/api/admin/_utils.ts` and refactor admin routes to use it.
- [x] (2026-01-29 03:29Z) Run Jest (all tests pass).
- [ ] (2026-01-29 03:29Z) Manually smoke-test admin endpoints for consistent error responses.

## Surprises & Discoveries

- Observation: Admin auth checks are duplicated across `app/api/admin/open/route.ts`, `app/api/admin/close/route.ts`, and `app/api/admin/presets/route.ts`.
  Evidence: Each file reads `process.env.ADMIN_KEY`, logs missing configuration, and returns 401 for mismatched keys.
- Observation: `app/api/admin/clear/route.ts` skips the missing-`ADMIN_KEY` check and does not guard JSON parsing.
  Evidence: The route reads `request.json()` without try/catch and compares directly to `process.env.ADMIN_KEY`.

## Decision Log

- Decision: Centralize admin auth and JSON parsing in `app/api/admin/_utils.ts` and keep route-specific validation (like poll question and options) in the route files.
  Rationale: This removes duplicated auth behavior without obscuring the unique validation logic each route needs.
  Date/Author: 2026-01-29 / Codex
- Decision: Preserve existing error messages and status codes where possible, and align `clear` with the other admin routes for missing `ADMIN_KEY` and invalid JSON.
  Rationale: Consistency reduces surprises for the admin UI and keeps behavior predictable.
  Date/Author: 2026-01-29 / Codex

## Outcomes & Retrospective

- Implemented the admin helper and refactored all admin routes; Jest suite passes. Manual smoke test still pending.

## Context and Orientation

This is a Next.js App Router repository. Admin-only endpoints live under `app/api/admin/`:

- `app/api/admin/open/route.ts` opens a poll via `lib/pollService.ts`.
- `app/api/admin/close/route.ts` closes the active poll via `lib/pollService.ts`.
- `app/api/admin/clear/route.ts` clears the active poll and history via `lib/pollService.ts`.
- `app/api/admin/presets/route.ts` reads JSON presets from `lib/prewrittenPolls.ts`.

All admin endpoints rely on `process.env.ADMIN_KEY` and reject requests when the provided `key` does not match. The code currently duplicates that check in multiple files, and one route (`clear`) diverges by skipping the missing-key check and JSON parse guards.

Run Logs: `/Users/georgepickett/live-polling/.agent/run-logs`

## Plan of Work

Create a small helper module in `app/api/admin/_utils.ts` that owns two responsibilities: (1) resolving `ADMIN_KEY` and returning a consistent error response when it is missing, and (2) parsing JSON request bodies with a consistent 400 response when JSON is invalid. Add a helper to check the provided admin key and return a 401 response when unauthorized. Keep route-specific validation inside each route (for example, poll question/options validation in `open`).

Refactor each admin route to use the helper functions. Ensure the `clear` route now mirrors the same missing-`ADMIN_KEY` behavior as the other routes, and that invalid JSON is handled with the same 400 response that `open` and `close` already emit.

Add Jest tests for the helper module to lock in the new behavior. The tests should fail before the helper exists and pass once implemented. Use local `Request` instances and mock `process.env.ADMIN_KEY` as needed. Avoid network calls.

## Concrete Steps

From the repo root (`/Users/georgepickett/live-polling`), add a new test file and write failing tests first:

    mkdir -p app/api/admin/__tests__
    $EDITOR app/api/admin/__tests__/adminUtils.test.ts

Then implement the helper and refactor the routes:

    $EDITOR app/api/admin/_utils.ts
    $EDITOR app/api/admin/open/route.ts
    $EDITOR app/api/admin/close/route.ts
    $EDITOR app/api/admin/clear/route.ts
    $EDITOR app/api/admin/presets/route.ts

Run the focused tests:

    npm test -- --runTestsByPath app/api/admin/__tests__/adminUtils.test.ts

Expected output includes:

    PASS app/api/admin/__tests__/adminUtils.test.ts

Run the full Jest suite:

    npm test

Expected output includes only PASS lines and a zero exit code.

Optionally, manually smoke-test the admin endpoints by running `npm run dev` and calling the routes with valid and invalid `?key=` or JSON payloads; confirm consistent 401/400/500 responses and unchanged success payloads.

## Validation and Acceptance

This refactor is accepted when all of the following are true:

- All admin endpoints return a 500 response with `{ error: "admin key not configured" }` when `ADMIN_KEY` is missing.
- All admin endpoints return a 401 response with `{ error: "unauthorized" }` when the provided key is missing or incorrect.
- JSON parsing errors return a 400 response with `{ error: "invalid json" }` for routes that expect a body (`open`, `close`, `clear`).
- Route-specific validation (like poll type/options in `open`) continues to behave as it does today.
- Jest tests pass, including the new admin helper tests.

## Idempotence and Recovery

This refactor is code-only and safe to repeat. If an edit goes wrong, revert the affected route and helper files to their previous state and rerun the tests. No data migrations or external services are involved.

## Artifacts and Notes

Example helper usage to aim for:

    const adminKeyResult = requireAdminKey();
    if (!adminKeyResult.ok) return adminKeyResult.response;

    const bodyResult = await parseJson<OpenPayload>(request);
    if (!bodyResult.ok) return bodyResult.response;

    const unauthorized = ensureAuthorized(bodyResult.data.key, adminKeyResult.adminKey);
    if (unauthorized) return unauthorized;

Keep helper usage small and direct; avoid introducing new abstractions beyond auth and JSON parsing.

## Interfaces and Dependencies

Create `app/api/admin/_utils.ts` with small, focused helpers. The exact names can vary, but the module must provide:

- A function to resolve `ADMIN_KEY` and return a `NextResponse` error when missing.
- A function to parse JSON safely and return a `NextResponse` error on invalid JSON.
- A function to validate the provided admin key and return a 401 `NextResponse` when unauthorized.

Use `NextResponse` from `next/server` for all responses. Do not add new dependencies. Route files should continue to call `openPoll`, `closePoll`, `clearAllPolls`, and `loadPrewrittenPolls` exactly as they do today.

Plan update note: Updated progress and outcomes after implementing the helper, refactoring admin routes, and running Jest.
