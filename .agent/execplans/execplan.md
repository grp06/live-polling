# Build a Vercel-deployable realtime slider poll app in Next.js

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

If a PLANS.md file is checked into the repo, follow it exactly. If it exists, reference it here by path from repo root and keep this document consistent with it.

## Purpose / Big Picture

After this change, a meetup host can run one poll at a time from an admin page, and attendees can vote anonymously on a 0–10 slider. Votes update frequently (throttled to ~200ms on the client) and everyone sees live results (count, average, histogram) update during the poll. When the host closes the poll, results freeze and the poll is added to a history view that attendees can browse.

You can see it working by starting the dev server, opening `/admin?key=...` in one browser, opening `/` in several others, moving sliders, watching live aggregates change, then closing the poll and seeing it appear in history.

## Progress

- [x] (2026-01-12 22:30Z) Inspect repository for existing Next.js app structure and PLANS.md; record findings in Context and Orientation.
- [x] (2026-01-12 22:37Z) Add Vercel KV dependency wiring and environment variables; add a small server-side KV wrapper module.
- [x] (2026-01-12 22:37Z) Implement data model and server-side functions for poll lifecycle and aggregation.
- [x] (2026-01-12 22:39Z) Implement API routes: read poll state (includes history), vote, admin open/close.
- [x] (2026-01-12 22:43Z) Implement attendee UI at `/` with anonymous id, slider voting (throttled), live results, and history list.
- [x] (2026-01-12 22:43Z) Implement admin UI at `/admin` with key-gated controls and projector-friendly results.
- [x] (2026-01-12 22:43Z) Add a deterministic aggregation unit test via a Node script, plus manual e2e validation script.
- [x] (2026-01-12 22:44Z) Verify Vercel deployment behavior and document exact env vars and steps (documented env vars and confirmed code uses KV/env checks; deployment not executed here).
- [x] (2026-01-13 00:20Z) Add admin “clear all polls” flow to remove active poll, its votes, and history.
- [x] (2026-01-13 00:30Z) Normalize KV hash reads to handle array responses and prevent invalid vote parsing.

## Surprises & Discoveries

- Observation: (placeholder) Vercel serverless functions do not share in-memory state across instances; filesystem writes are not durable for app data.
  Evidence: (to add if encountered during implementation) notes from testing or error logs.

## Decision Log

- Decision: Use polling from the client (e.g., 750ms interval) instead of WebSockets for “realtime”.
  Rationale: Polling is simpler and more reliable on Vercel for a next-day meetup, and latency requirements are modest.
  Date/Author: 2026-01-12 / assistant

- Decision: Use Vercel KV instead of “in-memory + JSON file”.
  Rationale: Vercel serverless has non-durable local writes and non-shared memory; external KV provides correctness with minimal setup.
  Date/Author: 2026-01-12 / assistant

- Decision: Anonymous attendee identity via localStorage-stored random id.
  Rationale: No login, prevents accidental multi-vote from refresh, keeps UX friction near zero.
  Date/Author: 2026-01-12 / assistant

- Decision: Use a minimal `node:assert` script (`scripts/test-agg.mjs`) for aggregation validation instead of Jest.
  Rationale: User explicitly requested `test-agg.mjs` despite the project guideline favoring Jest; keep scope minimal while still adding deterministic coverage.
  Date/Author: 2026-01-12 / assistant

- Decision: Add `tsx` as a lightweight TypeScript loader for the Node aggregation test script.
  Rationale: The repo is TypeScript-only; `tsx` enables importing `lib/pollService.ts` from `scripts/test-agg.mjs` without adding a full test runner.
  Date/Author: 2026-01-12 / assistant

- Decision: Implement a dedicated admin API route to clear all polls.
  Rationale: A single explicit endpoint with server-side key validation keeps destructive actions scoped and traceable.
  Date/Author: 2026-01-13 / assistant

- Decision: Normalize KV hgetall arrays to objects in the KV wrapper.
  Rationale: Upstash KV can return array pairs; converting ensures computeAggregates only receives vote values.
  Date/Author: 2026-01-13 / assistant

## Outcomes & Retrospective

Implemented a Vercel-ready realtime slider poll app with KV-backed storage, API routes for polling and admin control, and attendee/admin UIs that show live aggregates and history. Added a deterministic aggregation test script and documented manual validation plus required environment variables. Added an admin “clear all polls” action to reset active polls and history. Normalized KV hash reads to handle array responses and avoid invalid vote parsing. Deployment was not executed here; the remaining follow-up is to deploy on Vercel and confirm KV credentials and admin key behavior in production.

## Context and Orientation

This repository is a Next.js App Router app (the `app/` directory). Routes are implemented as App Router route handlers under `app/api/.../route.ts`. The package manager is npm (`package-lock.json` is present).

Current structure (as of 2026-01-12):

- This repo uses npm (package-lock.json), Next.js App Router with `app/`, and Tailwind via `app/globals.css`.
- API routes will live under `app/api/.../route.ts`.
- `app/page.tsx`: default Next.js starter page to replace with attendee UI.
- `app/layout.tsx`, `app/globals.css`: global layout/styles and font setup.
- No `src/` directory currently. Add shared code under `lib/` at repo root (for example `lib/pollService.ts`).
- `package.json` scripts: `dev`, `build`, `start`, `lint`. No test scripts configured yet.

Key terms used in this plan:

- “Poll”: A single question the admin opens. Only one poll can be active at a time. It has a 0–10 slider scale.
- “Vote”: The attendee’s most recent slider value for the active poll, keyed by their anonymous id.
- “Histogram”: Counts of votes at each integer value from 0 through 10 (11 buckets).
- “KV”: Vercel KV, used as the source of truth for the active poll, votes, and history.

Run Logs: write logs to a local directory at:
  /tmp/run-logs
If you are running in a container with a different absolute path, record both the container path and any host path provided by the runner prompt here.

Plan update (2026-01-12 22:30Z): Marked repository inspection complete and expanded Context and Orientation with concrete repo details (scripts, routing, styling) for novice clarity.
Plan update (2026-01-12 22:34Z): Updated validation test step and Decision Log to reflect the user-requested `test-agg.mjs` script instead of Jest.
Plan update (2026-01-12 22:36Z): Noted `tsx` loader requirement for the aggregation test script and added a Decision Log entry for the dependency.
Plan update (2026-01-12 22:37Z): Marked KV setup and poll service work complete; noted aggregation script done but manual validation docs pending.
Plan update (2026-01-12 22:39Z): Marked API routes complete after implementing poll, vote, and admin handlers.
Plan update (2026-01-12 22:43Z): Marked attendee/admin UI and validation docs complete; noted README now documents env vars with Vercel verification still pending.
Plan update (2026-01-12 22:44Z): Marked Vercel readiness task complete after documenting env vars and verifying server-side checks by inspection.
Plan update (2026-01-12 22:45Z): Filled Outcomes & Retrospective with the delivered scope and remaining deployment validation.
Plan update (2026-01-13 00:20Z): Added admin clear-all flow to Progress, Decision Log, and Outcomes after user-requested reset capability.
Plan update (2026-01-13 00:30Z): Added KV hash normalization fix after observing invalid vote parsing from array responses.

Before coding, do an orientation pass:

1. From repo root, list the tree and locate:
   - package manager: `package-lock.json` (npm).
   - Next.js structure: `app/` (App Router).
   - existing lint/test commands in `package.json`.
   - any PLANS.md path.

2. Record findings in this section so a novice can understand what exists:
   - “This repo uses npm and Next.js App Router; API routes live at `app/api/.../route.ts`.”
   - “The main page is app/page.tsx” etc.

## Plan of Work

We will build a minimal poll system with:

1. Storage layer:
   - A tiny module that reads/writes JSON objects to KV keys.
   - Keys for `poll:active`, `poll:votes:<pollId>`, and `poll:history`.

2. Server domain functions:
   - Create/open poll.
   - Close poll (compute final aggregates and append to history).
   - Get current state (active poll + live aggregates + caller’s current vote).
   - Record vote (HSET-like update by anonId).
   - Compute aggregates (count, average, histogram) from stored votes.

3. HTTP API routes:
   - GET `/api/poll?anonId=...`
   - POST `/api/vote`
   - POST `/api/admin/open`
   - POST `/api/admin/close`

4. UI:
   - Attendee page at `/` with:
     - anonymous id generation persisted in localStorage
     - slider 0–10; changes throttled to 200ms
     - live results updated via polling (750ms)
     - history list of closed polls included in the `/api/poll` response (single endpoint for the UI)
   - Admin page at `/admin?key=...` with:
     - open poll question input and button
     - close poll button
     - live results + history
     - key gating via query param compared to env var, enforced server-side in admin routes

## Concrete Steps

All commands below are run from repo root.

### 1) Install and configure KV

We will use Vercel KV via `@vercel/kv`.

- Add dependency:
    npm install @vercel/kv

- Add env vars (development) in `.env.local`:
    ADMIN_KEY=some-long-random-string
    KV_REST_API_URL=...
    KV_REST_API_TOKEN=...

Implement a wrapper in `lib/kv.ts` so the rest of the code does not care about raw Redis commands. The wrapper should export:

- `kvGetJson<T>(key: string): Promise<T | null>`
- `kvSetJson<T>(key: string, value: T): Promise<void>`
- `kvDel(key: string): Promise<void>`
- `kvHSet(key: string, field: string, value: string): Promise<void>`
- `kvHGet(key: string, field: string): Promise<string | null>`
- `kvHGetAll(key: string): Promise<Record<string, string>>`
- `kvLPushJson<T>(key: string, value: T): Promise<void>`
- `kvLRangeJson<T>(key: string, start: number, stop: number): Promise<T[]>`

Use real Redis hash/list primitives via `@vercel/kv` (no emulation).

### 2) Create domain types and constants

Create `lib/pollTypes.ts`:

- `ActivePoll`
- `ClosedPollSummary`
- `PollState` response type
- constants:
  - `POLL_MIN = 0`
  - `POLL_MAX = 10`
  - key helpers:
    - `KEY_ACTIVE = "poll:active"`
    - `KEY_HISTORY = "poll:history"`
    - `keyVotes(pollId) => "poll:votes:" + pollId`

### 3) Implement poll domain logic

Create `lib/pollService.ts` with functions:

- `openPoll(question: string): Promise<ActivePoll>`
  - if there is an existing active poll, close it first (append to history, delete active key, delete its votes hash)
  - create id with `crypto.randomUUID()`
  - write the new active poll to `poll:active`

- `closePoll(): Promise<ClosedPollSummary | null>`
  - read active poll
  - if none, return null
  - compute aggregates from votes hash
  - mark poll closed by deleting the `poll:active` key
  - append summary to `poll:history`
  - delete `poll:votes:<pollId>` (we keep only the summary in history)

- `getState(anonId: string): Promise<PollState>`
  - read active poll
  - always include `history` (latest 20 closed polls, newest-first)
  - if none, return `{ poll: null, count: 0, avg: null, histogram: [0..], userVote: null, history }`
  - else:
    - read votes
    - compute aggregates
    - read this user’s vote via HGET
    - return full state including history

- `recordVote(anonId: string, pollId: string, value: number): Promise<void>`
  - validate active poll exists and ids match and poll open
  - clamp to integer 0..10
  - HSET into votes hash

- `computeAggregates(votes: Record<string, string>): { count: number; avg: number | null; histogram: number[] }`
  - parse ints
  - histogram length 11
  - compute average and round to 1 decimal for display

Also implement `listHistory(limit: number): Promise<ClosedPollSummary[]>` reading last N summaries from the list.

### 4) Implement API routes

- `app/api/poll/route.ts`
  - GET: requires query `anonId`
  - returns JSON from `getState(anonId)`

- `app/api/vote/route.ts`
  - POST body: `{ anonId: string, pollId: string, value: number }`
  - returns 200 `{ ok: true }` or 400 with `{ error: "..." }`

- `app/api/admin/open/route.ts`
  - POST body: `{ key: string, question: string }`
  - compare `key` to `process.env.ADMIN_KEY`
  - if ok, call `openPoll(question)` and return poll

- `app/api/admin/close/route.ts`
  - POST body: `{ key: string }`
  - compare key, call `closePoll()`, return summary

For error responses, keep them consistent and simple.

### 5) Implement attendee UI

Implement `app/page.tsx` with:

- On first load:
  - create `anonId` in localStorage if missing. Use `crypto.randomUUID()` and store it.
- Polling:
  - set interval 750ms to fetch `/api/poll?anonId=...`
  - store response state in React state
  - if poll is null, show “Waiting for next poll” plus history section
- Slider:
  - value 0..10 integer steps
  - on change, update local UI immediately, and throttle POST to `/api/vote` every 200ms
  - throttle implementation should be local and predictable:
    - Use a simple timer-based throttle that sends the most recent value.
- Live results:
  - show count, avg, and histogram (simple bar list). Keep it visually clear with minimal styling.
- History:
  - show list of closed polls with timestamp, question, avg, count, and optionally a small histogram.
  - source: use the `history` field from the `/api/poll` response (single endpoint for the UI).

### 6) Implement admin UI

Implement `app/admin/page.tsx` with:

- Read `key` from query param. Store it in component state.
- If missing key, render a short message: “Missing admin key.”
- Render:
  - input for question
  - “Open poll” button (POST `/api/admin/open`)
  - “Close poll” button (POST `/api/admin/close`)
  - current state and results (reuse the same results component as attendee page)
  - history list

Make the admin page projector-friendly: large text for question and avg/count.

### 7) Add validation tests (minimum viable)

This repo does not currently have a test runner configured. The user requested a minimal Node script (not Jest). Because the project code is TypeScript, add a lightweight TypeScript loader (`tsx`) so the script can import `lib/pollService.ts` directly.

Add a simple script in `package.json`:

- `npm run test:agg` that executes `node --import tsx scripts/test-agg.mjs`, calling `computeAggregates` with fixtures and asserting with `node:assert`.

Implement the script at `scripts/test-agg.mjs` and cover:

- empty votes => count 0, avg null, histogram all zeros
- known votes => correct histogram and average (rounded to 1 decimal)

### 8) Manual end-to-end validation script

Document a manual test procedure:

1. Start dev server:
     npm run dev
2. Open admin:
     http://localhost:3000/admin?key=YOUR_ADMIN_KEY
3. Open attendees in multiple tabs:
     http://localhost:3000/
4. Open a poll from admin.
5. Move sliders in each attendee tab and confirm:
   - count increases to number of distinct anonIds
   - average changes as expected
   - histogram bars change
6. Close poll and confirm:
   - attendee pages stop showing an active poll and show “Waiting for next poll”
   - history shows the closed poll summary (final frozen results)
7. Open a new poll and confirm it becomes the active poll and voting resets for the new poll.

Include a short expected observation snippet, e.g.:

   Expected: If two attendees set values to 0 and 10, count is 2, avg is 5.0, histogram[0]=1 and histogram[10]=1.

### 9) Vercel deploy readiness

Ensure:
- Admin routes check `process.env.ADMIN_KEY` on the server and reject mismatches.
- KV env vars are set in Vercel project settings.
- No reliance on filesystem writes for persistence.
- The app works in `next dev` locally.

## Validation and Acceptance

Acceptance is met when all of the following are true:

1. Running the app locally:
   - From repo root:
       npm run dev
     and visiting `http://localhost:3000/` loads an attendee page that shows “Waiting for next poll” and a history section.

2. Opening a poll:
   - Visiting `http://localhost:3000/admin?key=...` and opening a poll causes attendee pages to show the question and a 0–10 slider.

3. Voting updates live:
   - Moving the slider updates the voter’s own displayed value immediately.
   - Within ~1 second, the live count/average/histogram change on both attendee and admin pages.

4. Closing a poll freezes results and adds to history:
   - Clicking “Close poll” causes attendee pages to show “Waiting for next poll”, and the closed poll summary appears in history.
   - Starting a new poll does not overwrite prior history entries.

5. Basic aggregation correctness:
   - `npm run test:agg` passes.

## Idempotence and Recovery

- Re-running `npm install` is safe.
- Opening a new poll auto-closes any existing active poll (so it is preserved in history), then starts the new poll with a fresh vote set.
- If KV credentials are wrong, API routes should return a clear 500 error. Record the error and add a note to `Surprises & Discoveries` with the failing endpoint and message. Fix by updating `.env.local` and restarting the dev server.
- If admin key is wrong or missing, admin routes return 401 with `{ error: "unauthorized" }`. Fix by setting `ADMIN_KEY` and using the correct `?key=`.

## Artifacts and Notes

Example curl commands (optional for manual debugging):

  - Get state:
      curl "http://localhost:3000/api/poll?anonId=test-user"

  - Open poll:
      curl -X POST "http://localhost:3000/api/admin/open" \
        -H "Content-Type: application/json" \
        -d '{"key":"YOUR_ADMIN_KEY","question":"How engaged are you right now?"}'

  - Vote:
      curl -X POST "http://localhost:3000/api/vote" \
        -H "Content-Type: application/json" \
        -d '{"anonId":"test-user","pollId":"POLL_ID_FROM_OPEN","value":7}'

  - Close poll:
      curl -X POST "http://localhost:3000/api/admin/close" \
        -H "Content-Type: application/json" \
        -d '{"key":"YOUR_ADMIN_KEY"}'

## Interfaces and Dependencies

Dependencies:

- `@vercel/kv` for KV access from server routes.

Other dependencies:
- No id library. Use `crypto.randomUUID()` for poll ids.
- No charting libraries. Render histogram with basic div bars to keep bundle small and predictable.

Server-side interfaces that must exist:

In `lib/kv.ts`, define exported functions:

  - export async function kvGetJson<T>(key: string): Promise<T | null>
  - export async function kvSetJson<T>(key: string, value: T): Promise<void>
  - export async function kvDel(key: string): Promise<void>
  - export async function kvHSet(key: string, field: string, value: string): Promise<void>
  - export async function kvHGet(key: string, field: string): Promise<string | null>
  - export async function kvHGetAll(key: string): Promise<Record<string, string>>
  - export async function kvLPushJson<T>(key: string, value: T): Promise<void>
  - export async function kvLRangeJson<T>(key: string, start: number, stop: number): Promise<T[]>

In `lib/pollService.ts`, define exported functions:

  - export async function openPoll(question: string): Promise<ActivePoll>
  - export async function closePoll(): Promise<ClosedPollSummary | null>
  - export async function getState(anonId: string): Promise<PollState>
  - export async function recordVote(anonId: string, pollId: string, value: number): Promise<void>
  - export function computeAggregates(votes: Record<string, string>): { count: number; avg: number | null; histogram: number[] }
  - export async function listHistory(limit: number): Promise<ClosedPollSummary[]>

These signatures anchor the rest of the system and keep routes thin.
