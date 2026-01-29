# Consolidate error banners into a shared component

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `.agent/PLANS.md` from the repository root and must be maintained in accordance with its requirements.

## Purpose / Big Picture

Remove duplicated error banner markup across attendee, results, and admin pages by centralizing it into a shared component. After this change, updating error presentation happens in one place while the UI looks identical on all three screens.

## Progress

- [x] (2026-01-29 04:29Z) ExecPlan drafted from repo analysis.
- [x] (2026-01-29 04:31Z) Add failing unit test for the new shared error banner component.
- [x] (2026-01-29 04:32Z) Implement `components/ErrorBanner.tsx` with the existing markup and styling.
- [x] (2026-01-29 04:32Z) Replace error banner markup in attendee, results, and admin pages with the shared component.
- [x] (2026-01-29 04:32Z) Run Jest and verify error banners still render correctly.

## Surprises & Discoveries

No surprises yet.

## Decision Log

- Decision: Extract the repeated error banner markup into `components/ErrorBanner.tsx` and reuse it in `app/page.tsx`, `app/results/page.tsx`, and `app/admin/AdminClient.tsx`.
  Rationale: The same banner markup appears in three places, and a shared component reduces duplication without changing UI behavior.
  Date/Author: 2026-01-29 / Codex

## Outcomes & Retrospective

Added a shared `ErrorBanner` component and replaced the inline banner markup in attendee, results, and admin pages. Jest passes, and the banner styling is now centrally managed while preserving the existing class list and behavior.

## Context and Orientation

The attendee page (`app/page.tsx`), results page (`app/results/page.tsx`), and admin page (`app/admin/AdminClient.tsx`) each render the same error banner markup when an error string is present. The markup is the same `div` with `rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700`, and each one renders the error string as its content. This duplication can be consolidated into a shared component under `components/` without any visual changes.

Run Logs: Not provided in prompt.

## Plan of Work

Create a new shared component `components/ErrorBanner.tsx` that accepts a `message` string and renders the exact banner markup used today. Add a unit test in `components/__tests__/ErrorBanner.test.ts` that renders the component with a sample message and asserts the HTML includes the message and the expected class names. Then replace the inline error banner markup in `app/page.tsx`, `app/results/page.tsx`, and `app/admin/AdminClient.tsx` with the new component. Keep the conditional rendering logic the same, so the banner only appears when the error string is present. Finally, run Jest to ensure the new test passes and no existing tests regress.

## Concrete Steps

Work from `/Users/georgepickett/live-polling`.

First, add a failing test in `components/__tests__/ErrorBanner.test.ts` using `renderToStaticMarkup`. The test should render `<ErrorBanner message="Oops" />` and assert that the output contains `Oops` and the shared class string `rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700`. Run:

  npm test

Expect a failure because `components/ErrorBanner.tsx` does not exist yet.

Next, add `components/ErrorBanner.tsx` with a simple component:

- Props: `{ message: string }`
- Render the same banner markup currently used in the three pages.

Then update:

- `app/page.tsx`: replace the inline error banner `div` with `<ErrorBanner message={error} />` when `error` is truthy.
- `app/results/page.tsx`: same replacement.
- `app/admin/AdminClient.tsx`: same replacement for the main `error` banner.

Finally, rerun:

  npm test

## Validation and Acceptance

Run `npm test` and expect all Jest tests to pass, including the new `ErrorBanner` test. Start the dev server with `npm run dev`, trigger a visible error state in each screen (for example, by breaking the API URL or forcing a failed fetch), and confirm the error banner matches the existing styling on attendee, results, and admin pages.

## Idempotence and Recovery

These changes are safe to repeat. If the banner looks different from before, replace the component markup with the exact previous `div` class list and re-run tests.

## Artifacts and Notes

Capture a short diff showing the new `components/ErrorBanner.tsx` and one updated page to document the consolidation.

## Interfaces and Dependencies

The new component should be exported as:

  export function ErrorBanner({ message }: { message: string }): JSX.Element

It should not introduce new dependencies and should reuse the existing class names exactly.

Plan Change Log: Initial draft created on 2026-01-29.
Plan Change Log: Marked failing test addition complete after adding ErrorBanner test (2026-01-29).
Plan Change Log: Marked implementation, replacement, and Jest validation steps complete (2026-01-29).
