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
      pendingVoteRef.current = null;
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
      return;
    }

    if (pollIdRef.current !== state.poll.id) {
      pollIdRef.current = state.poll.id;
      setSliderValue(state.userVote ?? DEFAULT_SLIDER);
      pendingVoteRef.current = null;
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
    }
  }, [state?.poll, state?.userVote]);

  const histogram = state?.histogram ?? emptyHistogram();
  const count = state?.count ?? 0;
  const avg = state?.avg ?? null;
  const history = state?.history ?? [];
  const poll = state?.poll ?? null;

  const handleVote = (value: number) => {
    if (!poll || !anonId) {
      return;
    }

    pendingVoteRef.current = value;

    if (throttleRef.current) {
      return;
    }

    throttleRef.current = setTimeout(async () => {
      const pending = pendingVoteRef.current;
      throttleRef.current = null;
      if (pending === null) {
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
            value: pending,
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
    }, VOTE_THROTTLE_MS);
  };

  const sliderLabel = useMemo(
    () => `${sliderValue} / ${POLL_MAX}`,
    [sliderValue]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-white to-sky-50 text-zinc-900">
      <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl animate-glow" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl animate-glow" />
      <main className="relative mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="animate-rise space-y-3">
          <h1 className="text-balance text-4xl font-semibold text-zinc-900 md:text-5xl">
            Vote anonymously. Results update live.
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            Move the slider to vote. Updates refresh automatically.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="animate-rise rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur">
          {poll ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Active poll
                </p>
                <h2 className="mt-2 text-balance text-3xl font-semibold text-zinc-900">
                  {poll.question}
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>Move the slider</span>
                  <span className="text-base font-semibold text-zinc-900">
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
                    handleVote(nextValue);
                  }}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{POLL_MIN}</span>
                  <span>{POLL_MAX}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                No active poll
              </p>
              <h2 className="text-2xl font-semibold text-zinc-900">
                Waiting for the next poll.
              </h2>
              <p className="text-sm text-zinc-500">
                Stay on this tab. Results appear when the host opens a poll.
              </p>
            </div>
          )}
        </section>

        <PollResults count={count} avg={avg} histogram={histogram} />

        <PollHistory history={history} />
      </main>
    </div>
  );
}
