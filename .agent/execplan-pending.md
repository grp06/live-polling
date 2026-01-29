# Consolidate shared page shell and backdrop

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `.agent/PLANS.md` from the repository root and must be maintained in accordance with its requirements.

## Purpose / Big Picture

Unify the duplicated page shell and decorative background markup used by the attendee, results, and admin screens into a single shared component. After this change, engineers can update the page backdrop in one place, and all three screens retain the same visual presentation and behavior as before.

## Progress

- [x] (2026-01-29 03:57Z) ExecPlan drafted from repo analysis.
- [x] (2026-01-29 04:10Z) Add shared page shell component with backdrop variants and matching tests.
- [x] (2026-01-29 04:10Z) Replace duplicated backdrop markup in attendee, results, and admin views with the shared component.
- [ ] (2026-01-29 04:12Z) Run unit tests and manually verify pages render unchanged (completed: `npm test`; remaining: manual visual check in dev server).
- [x] (2026-01-29 04:20Z) Update `ARCHITECTURE.md` to document the shared `PageShell` component.

## Surprises & Discoveries

- Observation: The same eight background “shape” divs are duplicated in `app/page.tsx` and `app/results/page.tsx`, with a similar but slightly different set duplicated in `app/admin/AdminClient.tsx`.
  Evidence: See the repeated `animate-drift` blocks in those files.

## Decision Log

- Decision: Extract a shared `PageShell` component with explicit backdrop variants to preserve each page’s existing visuals while removing duplicated markup.
  Rationale: This removes large repeated UI blocks with a small blast radius and keeps visual behavior identical.
  Date/Author: 2026-01-29 / Codex

## Outcomes & Retrospective

No implementation has occurred yet.

## Context and Orientation

The app uses Next.js App Router with client components for the attendee page (`app/page.tsx`), results page (`app/results/page.tsx`), and admin UI (`app/admin/AdminClient.tsx`). These pages currently repeat a large block of decorative background markup: the outer page shell div and multiple absolutely positioned background shapes with `animate-drift`. The base CSS variables and animation classes live in `app/globals.css`. The admin screen renders two shells (one when the admin key is missing and one when it is present). This plan centralizes the shared shell/backdrop into a reusable component under `components/`, then updates those pages to use it without altering behavior.

Run Logs: Not provided in prompt.

## Plan of Work

First, add a new shared component in `components/PageShell.tsx` that renders the common outer wrapper and the decorative backdrop shapes. Use a `variant` prop to preserve the exact visual differences between the attendee/results pages and the admin page (including the “missing admin key” state). Keep the shape class lists identical to today by copying the existing class strings into the new component so no visual diffs are introduced. Next, add a focused unit test in `components/__tests__/PageShell.test.tsx` that renders each variant and asserts the expected number of `animate-drift` elements is present and that children render. Then update `app/page.tsx`, `app/results/page.tsx`, and both return branches in `app/admin/AdminClient.tsx` to wrap their existing content with the shared `PageShell` component and remove the duplicated backdrop markup. Leave `app/admin/page.tsx` as-is unless you decide it should also use the shared shell; if you change it, keep the fallback visual consistent with the current UI.

## Concrete Steps

Work from `/Users/georgepickett/live-polling`.

1) Add `components/PageShell.tsx` and define a `PageShell` component with this signature:

   - `type PageShellVariant = "default" | "admin" | "adminLite"`
   - `type PageShellProps = { variant?: PageShellVariant; children: React.ReactNode }`

   The component should render the existing outer wrapper div (`relative min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]`) and then render the backdrop shapes based on the variant. The `default` variant should use the exact eight shapes currently in `app/page.tsx` and `app/results/page.tsx`. The `admin` variant should use the exact eight shapes currently in the main admin view in `app/admin/AdminClient.tsx`. The `adminLite` variant should use the four shapes currently in the “Admin key required” view in `app/admin/AdminClient.tsx`. Finally, render `{children}` after the backdrop.

2) Add `components/__tests__/PageShell.test.tsx` that uses `renderToStaticMarkup` to render each variant. Assert that:

   - The `children` string renders for each variant.
   - The number of `animate-drift` occurrences matches the intended shape count for that variant (8 for `default`, 8 for `admin`, 4 for `adminLite`).

3) Update `app/page.tsx` to import `PageShell` and replace the outer `<div>` and backdrop `<div>` elements with `<PageShell variant="default"> ... </PageShell>`. The existing `<main>` and inner content should remain unchanged.

4) Update `app/results/page.tsx` similarly to use `<PageShell variant="default">` with no other content changes.

5) Update `app/admin/AdminClient.tsx` in both return branches:

   - When `!adminKey`, wrap the existing `<main>` with `<PageShell variant="adminLite">` and remove the duplicated backdrop divs.
   - For the main admin UI, wrap the existing `<main>` with `<PageShell variant="admin">` and remove the duplicated backdrop divs.

6) Run unit tests to confirm nothing regressed.

## Validation and Acceptance

Run `npm test` in `/Users/georgepickett/live-polling` and expect all Jest tests to pass, including the new `PageShell` test. Manually run `npm run dev` and verify in a browser that:

- `http://localhost:3000/` displays the same backdrop and layout as before.
- `http://localhost:3000/results` displays the same backdrop and layout as before.
- `http://localhost:3000/admin?key=YOUR_ADMIN_KEY` displays the same backdrop and layout as before, and the “Admin key required” view retains its smaller backdrop when no key is provided.

## Idempotence and Recovery

These changes are safe to reapply. If the visuals differ from the current UI, revert the affected page to its prior markup and re-copy the backdrop class lists into `components/PageShell.tsx` to restore parity.

## Artifacts and Notes

Include short before/after snippets of the page shell changes in your working notes or commit message so reviewers can confirm the markup was centralized without visual changes.

## Interfaces and Dependencies

The shared component must be exported from `components/PageShell.tsx` and imported directly by the page components. No new external dependencies are required. The component should not introduce new CSS; it should reuse existing class names and animations from `app/globals.css`.

Plan Change Log: Initial draft created on 2026-01-29.
