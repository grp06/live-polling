"use client";

import { ErrorBanner } from "@/components/ErrorBanner";
import { PageShell } from "@/components/PageShell";
import { PollHistory } from "@/components/PollHistory";
import { PollResults } from "@/components/PollResults";
import { usePollState } from "@/lib/hooks/usePollState";
import { POLL_MAX, POLL_MIN } from "@/lib/pollTypes";

const POLL_INTERVAL_MS = 1000;

const emptyHistogram = () =>
  Array.from({ length: POLL_MAX - POLL_MIN + 1 }, () => 0);

export default function ResultsPage() {
  const { state, error } = usePollState({
    storageKey: "resultsAnonId",
    pollIntervalMs: POLL_INTERVAL_MS,
  });

  const histogram = state?.histogram ?? [];
  const count = state?.count ?? 0;
  const avg = state?.avg ?? null;
  const history = state?.history ?? [];
  const poll = state?.poll ?? null;
  const sliderHistogram =
    poll?.type === "slider" && histogram.length === 0
      ? emptyHistogram()
      : histogram;

  return (
    <PageShell variant="default">
      <main className="relative mx-auto flex w-full max-w-none flex-col gap-6 px-6 py-4 md:px-10 md:py-6">
        <section className="flex items-start pt-2 md:pt-3">
          <h1 className="text-balance font-[var(--font-display)] text-4xl text-[var(--ink)] md:text-6xl lg:text-7xl">
            livepolls.co
          </h1>
        </section>

        {error ? <ErrorBanner message={error} /> : null}

        <section className="flex items-start pt-3 md:pt-4">
          <div className="w-full animate-rise rounded-[28px] border border-[var(--border)] bg-[var(--surface)] px-5 py-5 shadow-[0_1px_0_rgba(31,26,22,0.08)] md:px-8 md:py-8">
            {poll ? (
              <div className="space-y-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                  Active poll
                </p>
                <h2 className="text-balance font-[var(--font-display)] text-2xl text-[var(--ink)] md:text-4xl lg:text-5xl">
                  {poll.question}
                </h2>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                  No active poll
                </p>
                <h2 className="text-balance font-[var(--font-display)] text-2xl text-[var(--ink)] md:text-4xl lg:text-5xl">
                  Waiting for the next poll.
                </h2>
              </div>
            )}
          </div>
        </section>

        <section className="flex items-start">
          <div className="w-full">
              <PollResults
                count={count}
                avg={avg}
                histogram={poll?.type === "slider" ? sliderHistogram : histogram}
                pollType={poll?.type ?? null}
                options={poll?.options}
                title="Live results"
                large
                compact
              />
          </div>
        </section>

        <PollHistory history={history} />
      </main>
    </PageShell>
  );
}
