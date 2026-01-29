"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ErrorBanner } from "@/components/ErrorBanner";
import { PageShell } from "@/components/PageShell";
import { fetchJson } from "@/lib/apiClient";
import { usePollState } from "@/lib/hooks/usePollState";
import { type PrewrittenPoll } from "@/lib/pollTypes";

export function AdminClient() {
  const searchParams = useSearchParams();
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const { state, error: pollError, refresh } = usePollState({
    storageKey: "adminAnonId",
  });
  const [question, setQuestion] = useState("");
  const [pollType, setPollType] = useState<"slider" | "multiple_choice">(
    "slider"
  );
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [presets, setPresets] = useState<PrewrittenPoll[]>([]);
  const [presetsError, setPresetsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAdminKey(searchParams.get("key"));
  }, [searchParams]);

  useEffect(() => {
    setError(pollError);
  }, [pollError]);

  useEffect(() => {
    if (!adminKey) {
      setPresets([]);
      setPresetsError(null);
      return;
    }

    let cancelled = false;

    const loadPresets = async () => {
      try {
        const payload = await fetchJson<{ polls?: PrewrittenPoll[] }>(
          `/api/admin/presets?key=${encodeURIComponent(adminKey)}`,
          undefined,
          { errorMessage: "failed to load presets" }
        );
        if (!Array.isArray(payload.polls)) {
          throw new Error("invalid presets response");
        }
        if (!cancelled) {
          setPresets(payload.polls);
          setPresetsError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "unknown error";
          setPresetsError(message);
        }
      }
    };

    loadPresets();

    return () => {
      cancelled = true;
    };
  }, [adminKey]);

  const poll = state?.poll ?? null;

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
    if (pollType === "multiple_choice") {
      const normalized = options
        .map((option) => option.trim())
        .filter((option) => option.length > 0);
      if (normalized.length < 2) {
        setError("At least two options are required.");
        return;
      }
    }

    setBusy(true);
    try {
      await fetchJson(
        "/api/admin/open",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: adminKey,
            question: trimmed,
            type: pollType,
            options:
              pollType === "multiple_choice"
                ? options.map((option) => option.trim())
                : undefined,
          }),
        },
        { errorMessage: "failed to open poll" }
      );
      setQuestion("");
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handlePresetSelect = (preset: PrewrittenPoll) => {
    if (poll) {
      return;
    }
    setQuestion(preset.question);
    setPollType(preset.type);
    if (preset.type === "multiple_choice") {
      if (!preset.options) {
        setError("Preset options are missing.");
        return;
      }
      setOptions([...preset.options]);
    } else {
      setOptions(["", ""]);
    }
    setError(null);
  };

  const handleClose = async () => {
    if (!adminKey) {
      setError("Missing admin key.");
      return;
    }

    setBusy(true);
    try {
      await fetchJson(
        "/api/admin/close",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key: adminKey }),
        },
        { errorMessage: "failed to close poll" }
      );
      await refresh();
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
      await fetchJson(
        "/api/admin/clear",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key: adminKey }),
        },
        { errorMessage: "failed to clear polls" }
      );
      await refresh();
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
  const presetsDisabled = Boolean(poll);

  if (!adminKey) {
    return (
      <PageShell variant="adminLite">
        <main className="relative mx-auto max-w-3xl space-y-4 px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--ink-muted)]">
            Admin studio
          </p>
          <h1 className="text-balance font-[var(--font-display)] text-3xl text-[var(--ink)]">
            Admin key required.
          </h1>
          <p className="text-[var(--ink-muted)]">
            Add <span className="font-semibold">?key=YOUR_ADMIN_KEY</span>.
          </p>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell variant="admin">
      <main className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 md:px-10">
        <header className="animate-rise space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--ink-muted)]">
            Admin studio
          </p>
          <h1 className="text-balance font-[var(--font-display)] text-4xl text-[var(--ink)] md:text-5xl">
            {statusLabel}
          </h1>
          <p className="max-w-2xl text-sm text-[var(--ink-muted)]">
            Open, close, and reset polls while attendees watch live updates.
          </p>
        </header>

        {error ? <ErrorBanner message={error} /> : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="animate-rise rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_0_rgba(31,26,22,0.08)] md:p-8">
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                  New poll question
                </p>
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="How energized is the room right now?"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-base text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                  Poll type
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setPollType("slider")}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      pollType === "slider"
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                        : "border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)]"
                    }`}
                  >
                    Slider
                  </button>
                  <button
                    type="button"
                    onClick={() => setPollType("multiple_choice")}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      pollType === "multiple_choice"
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]"
                        : "border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)]"
                    }`}
                  >
                    Multiple choice
                  </button>
                </div>
              </div>

              {pollType === "multiple_choice" ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                    Options
                  </p>
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div
                        key={`option-${index}`}
                        className="flex items-center gap-2"
                      >
                        <input
                          value={option}
                          onChange={(event) => {
                            const next = [...options];
                            next[index] = event.target.value;
                            setOptions(next);
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        />
                        {options.length > 2 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setOptions(options.filter((_, i) => i !== index))
                            }
                            className="rounded-full border border-[var(--border)] px-3 py-2 text-xs text-[var(--ink-muted)] hover:border-[var(--accent)]"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOptions([...options, ""])}
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink)] transition hover:border-[var(--accent)]"
                  >
                    Add option
                  </button>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleOpen}
                  disabled={busy}
                  className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
                >
                  Open poll
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={busy}
                  className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] disabled:opacity-60"
                >
                  Close poll
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={busy}
                  className="rounded-full border border-[#c97b6a] bg-[#f8e9e5] px-6 py-3 text-sm font-semibold text-[#a14a3b] transition hover:border-[#b56555] disabled:opacity-60"
                >
                  Clear all polls
                </button>
              </div>
            </div>
          </section>
        </div>

        <section className="animate-rise rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_0_rgba(31,26,22,0.08)] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                Preset polls
              </p>
              <h2 className="mt-2 text-balance font-[var(--font-display)] text-2xl text-[var(--ink)] md:text-3xl">
                Prewritten questions
              </h2>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
              {presets.length} presets
            </span>
          </div>

          {presetsError ? (
            <p className="mt-4 text-sm text-rose-700">{presetsError}</p>
          ) : null}

          {presets.length === 0 && !presetsError ? (
            <p className="mt-4 text-sm text-[var(--ink-muted)]">
              Add entries to data/prewritten-polls.json to see presets here.
            </p>
          ) : null}

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {presets.map((preset) => {
              const label =
                preset.type === "multiple_choice" ? "Multiple choice" : "Slider";
              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={presetsDisabled || busy}
                  onClick={() => handlePresetSelect(preset)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    presetsDisabled || busy
                      ? "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--ink-muted)] opacity-70"
                      : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--accent)]"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                    {label}
                  </div>
                  <div className="mt-2 text-base font-semibold text-[var(--ink)]">
                    {preset.question}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-[var(--ink-muted)]">
            {presetsDisabled
              ? "Close the active poll to load a preset."
              : "Tap a preset to populate the form."}
          </p>
        </section>
      </main>
    </PageShell>
  );
}
