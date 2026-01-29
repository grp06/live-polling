"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ErrorBanner } from "@/components/ErrorBanner";
import { PageShell } from "@/components/PageShell";
import { fetchJson } from "@/lib/apiClient";
import { usePollState } from "@/lib/hooks/usePollState";
import { POLL_MAX, POLL_MIN } from "@/lib/pollTypes";

const POLL_INTERVAL_MS = 1000;
const VOTE_THROTTLE_MS = 200;
const DEFAULT_SLIDER = 5;

export default function Home() {
  const { anonId, state, error: pollError } = usePollState({
    storageKey: "anonId",
    pollIntervalMs: POLL_INTERVAL_MS,
  });
  const [error, setError] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(DEFAULT_SLIDER);
  const [choiceValue, setChoiceValue] = useState<number | null>(null);
  const pendingVoteRef = useRef<number | null>(null);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIdRef = useRef<string | null>(null);

  useEffect(() => {
    setError(pollError);
  }, [pollError]);

  useEffect(() => {
    if (!state?.poll) {
      pollIdRef.current = null;
      setSliderValue(DEFAULT_SLIDER);
      setChoiceValue(null);
      pendingVoteRef.current = null;
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
      return;
    }

    if (pollIdRef.current !== state.poll.id) {
      pollIdRef.current = state.poll.id;
      setSliderValue(
        state.poll.type === "slider"
          ? state.userVote ?? DEFAULT_SLIDER
          : DEFAULT_SLIDER
      );
      setChoiceValue(
        state.poll.type === "multiple_choice" ? state.userVote : null
      );
      pendingVoteRef.current = null;
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
    }
  }, [state?.poll, state?.userVote]);

  const poll = state?.poll ?? null;

  const submitVote = async (value: number) => {
    if (!poll || !anonId) {
      return;
    }

    try {
      await fetchJson(
        "/api/vote",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            anonId,
            pollId: poll.id,
            value,
          }),
        },
        { errorMessage: "failed to submit vote" }
      );
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      setError(message);
    }
  };

  const handleSliderVote = (value: number) => {
    if (!poll || !anonId) {
      return;
    }

    pendingVoteRef.current = value;

    if (throttleRef.current) {
      return;
    }

    throttleRef.current = setTimeout(() => {
      const pending = pendingVoteRef.current;
      throttleRef.current = null;
      if (pending === null) {
        return;
      }
      void submitVote(pending);
    }, VOTE_THROTTLE_MS);
  };

  const handleChoiceVote = (index: number) => {
    setChoiceValue(index);
    void submitVote(index);
  };

  const sliderLabel = useMemo(
    () => `${sliderValue} / ${POLL_MAX}`,
    [sliderValue]
  );

  return (
    <PageShell variant="default">
      <main className="relative mx-auto flex w-full max-w-none flex-col gap-10 px-6 py-14 md:px-10">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
            Anonymous live polling
          </p>
        </header>

        {error ? <ErrorBanner message={error} /> : null}

        <div className="grid gap-8">
          <section className="animate-rise rounded-[28px] border border-[var(--border)] bg-[var(--surface)] px-6 py-6 shadow-[0_1px_0_rgba(31,26,22,0.08)] md:px-8">
            {poll ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                    Active poll
                  </p>
                  <h2 className="mt-3 text-balance font-[var(--font-display)] text-3xl text-[var(--ink)] md:text-4xl">
                    {poll.question}
                  </h2>
                </div>
                {poll.type === "multiple_choice" ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(poll.options ?? []).map((option, index) => {
                        const isSelected = choiceValue === index;
                        return (
                          <button
                            key={`${option}-${index}`}
                            type="button"
                            onClick={() => handleChoiceVote(index)}
                            className={`rounded-2xl border px-4 py-3 text-left text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                              isSelected
                                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)] shadow-[0_1px_0_rgba(31,26,22,0.1)]"
                                : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--accent)]"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink-muted)]">
                      <span>Move the slider</span>
                      <span className="text-base font-semibold text-[var(--ink)]">
                        {sliderLabel}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={POLL_MIN}
                      max={POLL_MAX}
                      step={1}
                      value={sliderValue}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        setSliderValue(nextValue);
                        handleSliderVote(nextValue);
                      }}
                      className="slider-control w-full accent-[var(--accent)]"
                    />
                    <div className="flex justify-between text-xs text-[var(--ink-muted)]">
                      <span>{POLL_MIN}</span>
                      <span>{POLL_MAX}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                  No active poll
                </p>
                <h2 className="text-balance font-[var(--font-display)] text-3xl text-[var(--ink)]">
                  The host will open a poll shortly.
                </h2>
                <p className="text-sm text-[var(--ink-muted)]">
                  Waiting for the next poll to begin.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </PageShell>
  );
}
