# Consolidate admin route authorization

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `.agent/PLANS.md` from the repository root and must be maintained in accordance with its requirements.

## Purpose / Big Picture

Reduce duplicated admin-route boilerplate by centralizing admin-key lookup, authorization, and request parsing into a single shared helper. After this change, the admin API routes for opening, closing, clearing, and loading presets will all reuse the same authorization flow and error responses, so updates to admin auth or request parsing happen in one place while behavior stays identical for clients.

## Progress

- [x] (2026-01-29 00:00Z) Repo analysis completed and consolidation target selected.
- [x] (2026-01-29 01:00Z) Added failing Jest tests for the new admin parsing helper (JSON body + query key cases).
- [x] (2026-01-29 01:10Z) Implemented shared admin parsing helper and refactored admin routes to use it.
- [x] (2026-01-29 01:20Z) Ran Jest and confirmed admin route tests pass with existing error payloads.

## Surprises & Discoveries

- Observation: Admin routes duplicate the same `requireAdminKey` + `parseJson` + `ensureAuthorized` sequence with only minor variations, which means any auth behavior change requires editing four files.
  Evidence: `app/api/admin/open/route.ts`, `app/api/admin/close/route.ts`, `app/api/admin/clear/route.ts`, `app/api/admin/presets/route.ts`.

## Decision Log

- Decision: Introduce a shared admin parsing helper in `app/api/admin` that wraps `requireAdminKey`, `parseJson`, and `ensureAuthorized`, then refactor each admin route to call it before their route-specific validation and service calls.
  Rationale: This removes duplicated authorization logic with a small blast radius, keeps all admin behavior consistent, and avoids deleting route directories (a repo constraint).
  Date/Author: 2026-01-29 / Codex

## Outcomes & Retrospective

Admin routes now share a single authorization/parsing flow via `app/api/admin/adminRoute.ts`, reducing repeated logic while preserving existing error responses. Jest passes across all suites, including new coverage for the helper. No endpoint behavior changes were observed in tests.

## Context and Orientation

Admin API routes live under `app/api/admin` and currently each one repeats the same authorization steps: `requireAdminKey()` to fetch `ADMIN_KEY`, `parseJson()` for POST bodies (except presets), and `ensureAuthorized()` to compare keys, followed by route-specific logic. These routes rely on shared helpers in `app/api/_utils.ts` and poll domain logic in `lib/pollService.ts` or `lib/prewrittenPolls.ts`. The admin UI in `app/admin/AdminClient.tsx` calls the individual endpoints; we will keep those endpoints intact and only centralize the shared admin authorization/parsing steps.

Run Logs: /Users/georgepickett/live-polling/.agent/run-logs (not yet created).

## Plan of Work

Create a new helper module at `app/api/admin/adminRoute.ts` that consolidates admin authorization and request parsing for both JSON POST bodies and query-based GETs. The helper should return a discriminated result that either includes the parsed data plus the resolved admin key or a `NextResponse` to return immediately. Update each admin route to use this helper before performing route-specific validation or calling `pollService`/`prewrittenPolls`, keeping existing error messages and status codes intact. Add Jest tests that cover success and failure paths for the helper (missing `ADMIN_KEY`, invalid JSON, missing key, mismatched key, and success) and ensure those tests fail before the helper exists.

## Concrete Steps

Work from `/Users/georgepickett/live-polling`.

First, add a new Jest test file `app/api/admin/__tests__/adminRoute.test.ts` (or extend the existing admin utils tests if you prefer) that exercises two new helper functions: one that parses JSON bodies containing a `key` field, and one that parses a `key` from query parameters. Use `new Request()` to build fake requests. Include cases for missing `ADMIN_KEY` (expect 500 with `{ error: "admin key not configured" }`), invalid JSON (expect 400 with `{ error: "invalid json" }`), missing or mismatched `key` (expect 401 with `{ error: "unauthorized" }`), and a success case (expect `ok: true` and the parsed payload). Run `npm test` and confirm these tests fail because the helper is not implemented yet.

Next, create `app/api/admin/adminRoute.ts` with helper types and functions that wrap the existing utilities from `app/api/_utils.ts`. The body-parsing helper should call `requireAdminKey()`, then `parseJson<T>()`, then `ensureAuthorized(data.key, adminKey)`, and return either `{ ok: true, adminKey, data }` or `{ ok: false, response }`. The query helper should extract the `key` search param and follow the same authorization steps. Update all four admin routes to call the appropriate helper and return `result.response` early when `ok` is false. Keep route-specific validation and error handling the same as before and continue using `handleRouteError` for try/catch blocks.

Finally, run `npm test` again and confirm all Jest suites pass. If any admin responses change, adjust the helper so the responses match the previous behavior exactly.

## Validation and Acceptance

Run `npm test` from `/Users/georgepickett/live-polling` and expect all Jest tests to pass, including the new admin helper tests. Then start the dev server with `npm run dev` and verify:

- `POST /api/admin/open` with no or wrong `key` still returns 401 with `{ "error": "unauthorized" }`.
- `POST /api/admin/open` with invalid JSON still returns 400 with `{ "error": "invalid json" }`.
- `GET /api/admin/presets?key=...` still returns the same 401 when the key is missing or incorrect.

The admin endpoints and error payloads must match the pre-refactor behavior.

## Idempotence and Recovery

These changes are safe to repeat. If any responses change unexpectedly, revert the admin routes to their previous inline authorization sequence and compare the helper implementation with the pre-change logic to restore parity.

## Artifacts and Notes

Capture a short diff that shows the new helper and one updated admin route as proof of consolidation in the eventual commit message or journal entry.

## Interfaces and Dependencies

The shared helper lives at `app/api/admin/adminRoute.ts` and depends only on `NextResponse` plus existing helpers in `app/api/_utils.ts`. At the end of implementation, the module should export a discriminated result type and two functions with signatures equivalent to:

    export type AdminParseResult<T> =
      | { ok: true; adminKey: string; data: T }
      | { ok: false; response: NextResponse };

    export async function parseAdminJson<T extends { key?: string }>(
      request: Request
    ): Promise<AdminParseResult<T>>;

    export function parseAdminQuery(
      request: Request
    ): AdminParseResult<null>;

Routes continue to import `handleRouteError` and `NextResponse` directly and remain thin wrappers around domain functions. No new external dependencies are introduced.
