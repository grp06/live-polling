# Architecture

## 1. System Overview
- Purpose: Real-time live polling for meetups, with separate attendee, admin, and projector-style results views.
- Primary goals: low-latency state updates, simple admin control, anonymous voting, and clear aggregated results.
- Success criteria: attendees can vote and see live aggregates; admins can open/close/clear polls and load presets; results view shows active poll + history.
- Non-goals: user accounts, long-term analytics, complex moderation, or persistent user identity.

## 2. Architectural Style
- Style: Layered Next.js App Router with vertical slices (UI routes + API routes + domain services).
- Fit: UI and API live in the same codebase; simple domain logic centralized in `lib/` keeps duplication low while preserving straightforward routing.

## 3. Domain Model and Modules
- Poll domain (`lib/pollTypes.ts`, `lib/pollService.ts`): defines poll types, aggregates votes, manages active poll and history.
- Admin API (`app/api/admin/*`): authorizes with `ADMIN_KEY` and orchestrates poll actions.
- Attendee API (`app/api/poll`, `app/api/vote`): fetches state and records votes.
- Presets (`lib/prewrittenPolls.ts`, `data/prewritten-polls.json`): optional prewritten poll list loaded by admin UI.
- UI modules:
  - Attendee view (`app/page.tsx`)
  - Admin view (`app/admin`)
  - Results view (`app/results`)
  - Shared UI components (`components/`), including the `PageShell` backdrop wrapper used by attendee, admin, and results pages.

## 4. Directory Layout
- `app/`: Next.js App Router pages and API routes.
  - `app/api/`: server endpoints for polls, voting, admin actions.
  - `app/admin/`: admin UI.
  - `app/results/`: projector/results UI.
- `lib/`: domain logic, shared utilities, and hooks.
- `components/`: shared UI components.
  - `components/PageShell.tsx`: shared page shell and decorative backdrop variants for primary views.
- `data/`: prewritten poll JSON file.
- `tests/` and `app/__tests__`, `lib/__tests__`, `components/__tests__`: Jest test suites.

## 5. Data Flow and Boundaries
- Attendee state flow: UI (`app/page.tsx`) -> `usePollState` -> `GET /api/poll` -> `getState` -> Vercel KV.
- Voting flow: UI -> `POST /api/vote` -> `recordVote` -> Vercel KV.
- Admin flow: UI (`app/admin/AdminClient.tsx`) -> `POST /api/admin/open|close|clear` -> `pollService` -> Vercel KV.
- Preset flow: Admin UI -> `GET /api/admin/presets` -> `loadPrewrittenPolls` -> filesystem JSON.
- Boundary rule: API routes should be thin, delegating domain logic to `lib/pollService.ts` and related helpers.

## 6. Cross-Cutting Concerns
- Authn/authz: admin actions require `ADMIN_KEY`; enforced server-side via `app/api/admin/_utils.ts`.
- Logging: server routes log errors via `console.error` with route labels.
- Error handling: 400 for invalid input, 401 for unauthorized admin key, 500 for server failures.
- Configuration: environment variables in `.env.local` or deployment env; no hardcoded secrets.

## 7. Data and Integrations
- Primary datastore: Vercel KV via `@vercel/kv`.
  - Keys: `poll:active`, `poll:history`, `poll:votes:<pollId>`.
- Preset storage: `data/prewritten-polls.json` on filesystem.
- No external APIs beyond Vercel KV.

## 8. Deployment and Environments
- Runtime: Next.js App Router (Node runtime on Vercel or local dev server).
- Environments:
  - Local dev uses `.env.local` with `ADMIN_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`.
  - Production configured via Vercel environment variables.

## 9. Key Design Decisions
- Use Vercel KV for poll state and vote aggregation to avoid database setup and keep latency low.
- Keep poll domain logic in `lib/pollService.ts` to share between API routes and tests.
- Admin API uses a shared helper (`app/api/admin/_utils.ts`) for consistent auth and JSON parsing.
- Prewritten polls are file-backed to allow quick edits without DB schema changes.
- Shared `PageShell` keeps page backdrops consistent and reduces duplicated UI scaffolding across views.

## 10. Diagrams (Mermaid)

```mermaid
flowchart LR
  AdminUser[Admin] --> AdminUI[Admin UI]
  Attendee[Attendee] --> AttendeeUI[Attendee UI]
  Projector[Projector] --> ResultsUI[Results UI]
  AdminUI --> AdminAPI[/Admin API/]
  AttendeeUI --> PollAPI[/Poll API/]
  AttendeeUI --> VoteAPI[/Vote API/]
  ResultsUI --> PollAPI
  AdminAPI --> PollService[Poll Service]
  PollAPI --> PollService
  VoteAPI --> PollService
  PollService --> KV[(Vercel KV)]
  AdminAPI --> Presets[Prewritten Polls]
```

```mermaid
flowchart LR
  subgraph NextApp[Next.js App]
    AdminUI2[app/admin]
    AttendeeUI2[app/page]
    ResultsUI2[app/results]
    AdminAPI2[app/api/admin/*]
    PollAPI2[app/api/poll]
    VoteAPI2[app/api/vote]
    PollService2[lib/pollService.ts]
    PollTypes2[lib/pollTypes.ts]
    Presets2[lib/prewrittenPolls.ts]
    PageShell2[components/PageShell.tsx]
  end
  AdminUI2 --> AdminAPI2
  AttendeeUI2 --> PollAPI2
  AttendeeUI2 --> VoteAPI2
  ResultsUI2 --> PollAPI2
  AdminUI2 --> PageShell2
  AttendeeUI2 --> PageShell2
  ResultsUI2 --> PageShell2
  AdminAPI2 --> PollService2
  PollAPI2 --> PollService2
  VoteAPI2 --> PollService2
  PollService2 --> KV2[(Vercel KV)]
  AdminAPI2 --> Presets2
  Presets2 --> JSONFile[data/prewritten-polls.json]
```

## 11. Forbidden Patterns
- No direct KV access from UI components; always go through API routes.
- No client-side admin authorization; admin key must be enforced server-side.
- No filesystem writes for poll state.
- No ad-hoc schema changes without updating `lib/pollTypes.ts` and tests.

## 12. Open Questions
- Should admin actions be rate-limited or protected against replay?
- Should preset polls move from filesystem JSON to KV or a database?
- Do we need an explicit retention policy beyond the history limit?

## Quality Bar
- Strong defaults and explicit boundaries are required for new features.
- If a change adds a new poll type, update `lib/pollTypes.ts`, domain logic, API validation, UI, and tests together.
- Keep error messages stable where tests assert specific strings.
