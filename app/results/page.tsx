"use client";

import { useCallback, useEffect, useState } from "react";

import { PollHistory } from "@/components/PollHistory";
import { PollResults } from "@/components/PollResults";
import { POLL_MAX, POLL_MIN, type PollState } from "@/lib/pollTypes";

const POLL_INTERVAL_MS = 1000;

const emptyHistogram = () =>
  Array.from({ length: POLL_MAX - POLL_MIN + 1 }, () => 0);

export default function ResultsPage() {
  const [anonId, setAnonId] = useState<string | null>(null);
  const [state, setState] = useState<PollState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("resultsAnonId");
    if (stored) {
      setAnonId(stored);
      return;
    }
    const id = crypto.randomUUID();
    localStorage.setItem("resultsAnonId", id);
    setAnonId(id);
  }, []);

  const loadState = useCallback(async () => {
    if (!anonId) {
      return;
    }

    try {
      const response = await fetch(`/api/poll?anonId=${anonId}`);
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "failed to load poll state");
      }
      const payload = (await response.json()) as PollState;
      setState(payload);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      setError(message);
    }
  }, [anonId]);

  useEffect(() => {
    if (!anonId) {
      return;
    }
    loadState();
  }, [anonId, loadState]);

  useEffect(() => {
    if (!anonId || !state?.poll) {
      return;
    }

    let cancelled = false;
    const timer = setInterval(() => {
      if (cancelled) {
        return;
      }
      void loadState();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [anonId, state?.poll?.id, loadState]);

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
    <div className="relative min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <div className="pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rotate-6 rounded-[52px] bg-[var(--surface-strong)] opacity-70 animate-drift" />
      <div className="pointer-events-none absolute -top-10 left-12 h-44 w-44 -rotate-6 rounded-[44px] bg-[var(--mist)] opacity-60 animate-drift" />
      <div className="pointer-events-none absolute top-24 left-[-3rem] h-40 w-40 rotate-12 rounded-[40px] bg-[var(--surface-muted)] opacity-65 animate-drift" />
      <div className="pointer-events-none absolute top-40 right-24 h-28 w-28 rotate-12 rounded-[32px] bg-[var(--sun)] opacity-55 animate-drift" />
      <div className="pointer-events-none absolute bottom-20 right-[-2rem] h-36 w-36 -rotate-8 rounded-[36px] bg-[var(--surface-strong)] opacity-55 animate-drift" />
      <div className="pointer-events-none absolute bottom-24 right-24 h-32 w-32 rotate-6 rounded-[32px] bg-[var(--sage)] opacity-50 animate-drift" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-4rem] h-72 w-72 -rotate-3 rounded-[52px] bg-[var(--accent-soft)] opacity-60 animate-drift" />
      <div className="pointer-events-none absolute bottom-12 left-24 h-36 w-36 -rotate-12 rounded-[36px] bg-[var(--blush)] opacity-55 animate-drift" />
      <main className="relative mx-auto flex w-full max-w-none flex-col gap-6 px-6 py-4 md:px-10 md:py-6">
        <section className="flex items-start pt-2 md:pt-3">
          <h1 className="text-balance font-[var(--font-display)] text-4xl text-[var(--ink)] md:text-6xl lg:text-7xl">
            livepolls.co
          </h1>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

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
    </div>
  );
}
