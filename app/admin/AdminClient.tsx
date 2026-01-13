"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PollHistory } from "@/components/PollHistory";
import { PollResults } from "@/components/PollResults";
import { type PollState } from "@/lib/pollTypes";

const POLL_INTERVAL_MS = 750;

export function AdminClient() {
  const searchParams = useSearchParams();
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [anonId, setAnonId] = useState<string | null>(null);
  const [state, setState] = useState<PollState | null>(null);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAdminKey(searchParams.get("key"));
  }, [searchParams]);

  useEffect(() => {
    const stored = localStorage.getItem("adminAnonId");
    if (stored) {
      setAnonId(stored);
      return;
    }
    const id = crypto.randomUUID();
    localStorage.setItem("adminAnonId", id);
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
    const timer = setInterval(loadState, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [anonId, loadState]);

  const poll = state?.poll ?? null;
  const histogram = state?.histogram ?? [];
  const count = state?.count ?? 0;
  const avg = state?.avg ?? null;
  const history = state?.history ?? [];

  const handleOpen = async () => {
    if (!adminKey) {
      setError("Missing admin key.");
      return;
    }
    const trimmed = question.trim();
    if (!trimmed) {
      setError("Question is required.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/admin/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: adminKey, question: trimmed }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "failed to open poll");
      }
      setQuestion("");
      await loadState();
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleClose = async () => {
    if (!adminKey) {
      setError("Missing admin key.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/admin/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: adminKey }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "failed to close poll");
      }
      await loadState();
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleClearAll = async () => {
    if (!adminKey) {
      setError("Missing admin key.");
      return;
    }
    if (!window.confirm("Clear all polls and history? This cannot be undone.")) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/admin/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: adminKey }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "failed to clear polls");
      }
      await loadState();
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const statusLabel = useMemo(() => {
    if (!poll) {
      return "No active poll";
    }
    return `Active: ${poll.question}`;
  }, [poll]);

  if (!adminKey) {
    return (
      <div className="min-h-screen bg-zinc-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-400">
            Admin console
          </p>
          <h1 className="text-3xl font-semibold">Missing admin key.</h1>
          <p className="text-zinc-400">
            Append <span className="font-semibold">?key=YOUR_ADMIN_KEY</span>
            to the URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="animate-rise space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-400">
            Admin console
          </p>
          <h1 className="text-balance text-4xl font-semibold md:text-6xl">
            {statusLabel}
          </h1>
          <p className="max-w-2xl text-zinc-400">
            Open or close the live poll. Results update continuously across all
            attendee screens.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <section className="animate-rise rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                New poll question
              </p>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="How energized is the room right now?"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/70"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleOpen}
                disabled={busy}
                className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-amber-300 disabled:opacity-60"
              >
                Open poll
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 disabled:opacity-60"
              >
                Close poll
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={busy}
                className="rounded-full border border-rose-400/60 px-6 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-300 disabled:opacity-60"
              >
                Clear all polls
              </button>
            </div>
          </div>
        </section>

        <PollResults
          count={count}
          avg={avg}
          histogram={histogram.length ? histogram : Array(11).fill(0)}
          title="Live results"
          large
        />

        <div className="text-zinc-200">
          <PollHistory history={history} />
        </div>
      </main>
    </div>
  );
}
