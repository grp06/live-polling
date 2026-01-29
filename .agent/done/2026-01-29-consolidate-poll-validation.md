# Consolidate poll validation helpers

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `.agent/PLANS.md` from the repository root and must be maintained in accordance with its requirements.

## Purpose / Big Picture

Reduce duplicated poll type and options validation by introducing a shared normalization helper and refactoring server-side poll creation and prewritten poll parsing to use it. After this change, poll type and option validation rules live in one place, keeping error messages consistent and reducing the chance of drift between runtime poll creation and prewritten poll presets.

## Progress

- [x] (2026-01-29 03:00Z) ExecPlan drafted from repo analysis.
- [x] (2026-01-29 03:20Z) Added failing Jest tests for the new poll validation helper.
- [x] (2026-01-29 03:40Z) Implemented shared validation helpers and refactored poll service and prewritten poll parsing to use them.
- [x] (2026-01-29 03:45Z) Ran Jest and confirmed existing error messages remain unchanged.

## Surprises & Discoveries

No surprises during implementation; error messages stayed consistent after refactor.

## Decision Log

- Decision: Add `lib/pollValidation.ts` with shared poll type and options normalization helpers, then reuse those helpers in `lib/pollService.ts` and `lib/prewrittenPolls.ts` (and optionally `app/api/admin/open/route.ts` for server-side input validation).
  Rationale: Poll type and options normalization is currently duplicated across the poll service and prewritten poll parser; a shared helper reduces divergence risk with a small blast radius and no user-visible changes.
  Date/Author: 2026-01-29 / Codex

## Outcomes & Retrospective

Poll type and options validation now lives in `lib/pollValidation.ts`, with `lib/pollService.ts` and `lib/prewrittenPolls.ts` sharing the helper while preserving existing error strings. Jest passes, including new validation tests.

## Context and Orientation

Poll validation logic is currently spread across multiple files. The poll service (`lib/pollService.ts`) validates poll types and normalizes options during `openPoll`. The prewritten poll parser (`lib/prewrittenPolls.ts`) repeats similar logic while also attaching index-specific error messages. The admin API open route (`app/api/admin/open/route.ts`) independently validates `type` and `options` before calling the poll service. This duplication increases the chance of subtle drift in validation rules or error messages. The goal is to centralize the core validation logic in a single helper while preserving the existing error messages that tests (and users) rely on.

Run Logs: Not provided in prompt.

## Plan of Work

Create a new helper module `lib/pollValidation.ts` that exposes two functions: one to validate and normalize poll types, and one to validate and normalize options arrays. The helpers should accept error message strings so existing messages in `pollService` and `prewrittenPolls` remain unchanged. Add Jest tests that exercise success and failure paths for the helper using the exact error messages currently thrown. Then refactor `lib/pollService.ts` and `lib/prewrittenPolls.ts` to use the shared helper, deleting their local normalization helpers. Keep the admin open route validation unchanged unless you can reuse the helper without changing response payloads.

## Concrete Steps

Work from `/Users/georgepickett/live-polling`.

First, add a new test file `lib/__tests__/pollValidation.test.ts` that covers:

- `requirePollType` returns `"slider"` and `"multiple_choice"` when valid, and throws the provided error message when invalid.
- `normalizeOptions` throws the provided missing/non-string/min-count messages for invalid inputs.
- `normalizeOptions` trims and filters whitespace-only options and returns a normalized array for valid input.

Use the exact error message strings currently used in `lib/pollService.ts` and `lib/prewrittenPolls.ts` so that existing behavior is preserved. Run `npm test` and confirm the new tests fail because `lib/pollValidation.ts` does not exist yet.

Next, implement `lib/pollValidation.ts` with these functions and signatures:

    export type OptionValidationMessages = {
      missing: string;
      nonString: string;
      minCount: string;
    };

    export function requirePollType(
      value: unknown,
      errorMessage: string
    ): "slider" | "multiple_choice";

    export function normalizeOptions(
      value: unknown,
      messages: OptionValidationMessages
    ): string[];

`requirePollType` should accept any input, return the poll type if it matches `"slider"` or `"multiple_choice"`, and throw `new Error(errorMessage)` otherwise. `normalizeOptions` should verify the value is an array of strings, trim each option, filter empty strings, ensure at least two options remain, and throw `new Error(...)` with the matching message when validation fails.

Then refactor `lib/pollService.ts` to import and use these helpers in place of the local `ensurePollType` and `normalizeOptions` functions. Preserve the existing error messages:

- poll type error: `"invalid poll type"`
- options missing: `"options are required"`
- options min count: `"at least two options are required"`
- options non-string: `"options must be strings"` (new but only triggered for invalid inputs; keep open route behavior consistent)

Refactor `lib/prewrittenPolls.ts` to use the helper functions with the existing indexed messages:

- poll type: `"prewritten poll at index ${index} has invalid poll type"`
- options missing: `"prewritten poll at index ${index}: options are required"`
- options non-string: `"prewritten poll at index ${index} options must be strings"`
- options min count: `"prewritten poll at index ${index}: at least two options are required"`

Remove the now-duplicated local helper functions in both modules. If you choose to refactor `app/api/admin/open/route.ts` to use the shared helper, ensure it still returns the exact same status codes and error payloads (`type must be slider or multiple_choice`, `options are required`, `options must be strings`, `at least two options are required`).

Finally, run `npm test` again and confirm all suites pass without changes to error messages.

## Validation and Acceptance

Run `npm test` from `/Users/georgepickett/live-polling` and expect all Jest tests to pass, including the new poll validation tests. Confirm that existing error strings remain unchanged by verifying:

- `lib/__tests__/prewrittenPolls.test.ts` still passes without modifications.
- Errors thrown by `openPoll` and prewritten poll parsing match the pre-refactor messages.

## Idempotence and Recovery

These changes are safe to repeat. If any error messages change unintentionally, revert the refactor for that call site and compare the helper logic to the previous inline validation to restore message parity.

## Artifacts and Notes

Capture a brief diff snippet showing the new helper and one refactored call site to document the consolidation.

## Interfaces and Dependencies

The helper module `lib/pollValidation.ts` should be pure and depend only on `lib/pollTypes.ts` types. Do not introduce new external dependencies. The exported interface should remain stable for both server-side poll service and prewritten poll parsing.

Plan Change Log: Initial draft created on 2026-01-29. Progress updated after adding failing tests on 2026-01-29. Progress and outcomes updated after implementation on 2026-01-29.
