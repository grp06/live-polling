"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PollHistory } from "@/components/PollHistory";
import { PollResults } from "@/components/PollResults";
import { POLL_MAX, POLL_MIN, type PollState } from "@/lib/pollTypes";

const POLL_INTERVAL_MS = 750;
const VOTE_THROTTLE_MS = 200;
const DEFAULT_SLIDER = 5;

const emptyHistogram = () =>
  Array.from({ length: POLL_MAX - POLL_MIN + 1 }, () => 0);

export default function Home() {
  const [anonId, setAnonId] = useState<string | null>(null);
  const [state, setState] = useState<PollState | null>(null);
  const [sliderValue, setSliderValue] = useState(DEFAULT_SLIDER);
  const [choiceValue, setChoiceValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingVoteRef = useRef<number | null>(null);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIdRef = useRef<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("anonId");
    if (stored) {
      setAnonId(stored);
      return;
    }
    const id = crypto.randomUUID();
    localStorage.setItem("anonId", id);
    setAnonId(id);
  }, []);

  useEffect(() => {
    if (!anonId) {
      return;
    }

    let cancelled = false;

    const loadState = async () => {
      try {
        const response = await fetch(`/api/poll?anonId=${anonId}`);
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "failed to load poll state");
        }
        const payload = (await response.json()) as PollState;
        if (!cancelled) {
          setState(payload);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "unknown error";
          setError(message);
        }
      }
    };

    loadState();
    const timer = setInterval(loadState, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [anonId]);

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

  const histogram = state?.histogram ?? [];
  const count = state?.count ?? 0;
  const avg = state?.avg ?? null;
  const history = state?.history ?? [];
  const poll = state?.poll ?? null;
  const sliderHistogram =
    poll?.type === "slider" && histogram.length === 0
      ? emptyHistogram()
      : histogram;

  const submitVote = async (value: number) => {
    if (!poll || !anonId) {
      return;
    }

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonId,
          pollId: poll.id,
          value,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "failed to submit vote");
      }
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
    <div className="relative min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <div className="pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rotate-6 rounded-[52px] bg-[var(--surface-strong)] opacity-70 animate-drift" />
      <div className="pointer-events-none absolute -top-10 left-12 h-44 w-44 -rotate-6 rounded-[44px] bg-[var(--mist)] opacity-60 animate-drift" />
      <div className="pointer-events-none absolute top-24 left-[-3rem] h-40 w-40 rotate-12 rounded-[40px] bg-[var(--surface-muted)] opacity-65 animate-drift" />
      <div className="pointer-events-none absolute top-40 right-24 h-28 w-28 rotate-12 rounded-[32px] bg-[var(--sun)] opacity-55 animate-drift" />
      <div className="pointer-events-none absolute bottom-20 right-[-2rem] h-36 w-36 -rotate-8 rounded-[36px] bg-[var(--surface-strong)] opacity-55 animate-drift" />
      <div className="pointer-events-none absolute bottom-24 right-24 h-32 w-32 rotate-6 rounded-[32px] bg-[var(--sage)] opacity-50 animate-drift" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-4rem] h-72 w-72 -rotate-3 rounded-[52px] bg-[var(--accent-soft)] opacity-60 animate-drift" />
      <div className="pointer-events-none absolute bottom-12 left-24 h-36 w-36 -rotate-12 rounded-[36px] bg-[var(--blush)] opacity-55 animate-drift" />
      <main className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 md:px-10">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
            Anonymous live polling
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
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
                    <div className="text-sm text-[var(--ink-muted)]">
                      Select one option
                    </div>
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
                      className="w-full accent-[var(--accent)]"
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
                  Keep this tab open and you will see the question as soon as it
                  goes live.
                </p>
              </div>
            )}
          </section>

          <PollResults
            count={count}
            avg={avg}
            histogram={poll?.type === "slider" ? sliderHistogram : histogram}
            pollType={poll?.type ?? null}
            options={poll?.options}
          />
        </div>

        <PollHistory history={history} />
      </main>
    </div>
  );
}
