import { POLL_MAX, POLL_MIN, type PollType } from "@/lib/pollTypes";

type PollResultsProps = {
  count: number;
  avg: number | null;
  histogram: number[];
  pollType: PollType | null;
  options?: string[];
  title?: string;
  large?: boolean;
  compact?: boolean;
};

export function PollResults({
  count,
  avg,
  histogram,
  pollType,
  options,
  title,
  large = false,
  compact = false,
}: PollResultsProps) {
  const labelClass = large
    ? "text-sm font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]"
    : "text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]";
  const voteCountClass = large ? "text-4xl" : "text-2xl";
  const choiceTextClass = large ? "text-lg md:text-xl" : "text-sm";
  const choiceValueClass = large ? "text-lg md:text-xl" : "text-sm";
  const choiceBarClass = large ? "h-4" : "h-2.5";
  const sliderValueClass = large ? "text-sm md:text-base" : "text-xs";
  const sliderCountClass = large ? "text-sm md:text-base" : "text-xs";
  if (!pollType) {
    return (
      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_0_rgba(31,26,22,0.08)]">
        <p className={labelClass}>
          {title ?? "Live results"}
        </p>
        <h2 className="mt-3 text-balance font-[var(--font-display)] text-2xl text-[var(--ink)]">
          No active poll.
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Results will appear here once voting opens.
        </p>
      </section>
    );
  }

  if (pollType === "multiple_choice") {
    const max = Math.max(1, ...histogram);
    const total = histogram.reduce((sum, value) => sum + value, 0);
    const leaderIndex = histogram.findIndex((value) => value === max);
    const lowVotes = count < 3;
    return (
      <section
        className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_0_rgba(31,26,22,0.08)]"
        data-result="multiple_choice"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className={labelClass}>
              {title ?? "Live results"}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Votes
            </p>
            <p className={`font-semibold text-[var(--ink)] ${voteCountClass}`}>
              {count}
            </p>
          </div>
        </div>
        {options && options.length > 0 ? (
          <div className="mt-6 space-y-4">
            {options.map((option, index) => {
              const value = histogram[index] ?? 0;
              const percent = total > 0 ? Math.round((value / total) * 100) : 0;
              const width =
                value === 0 ? "0%" : `${Math.max(2, (value / max) * 100)}%`;
              const isLeader = index === leaderIndex && max > 0;
              return (
                <div
                  key={`${option}-${index}`}
                  className={`grid items-center gap-4 rounded-2xl px-3 py-2 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_5rem] ${
                    index % 2 === 0 ? "bg-[rgba(31,26,22,0.03)]" : ""
                  } ${isLeader ? "ring-1 ring-[var(--accent-soft)]" : ""}`}
                >
                  <div className="flex flex-col gap-1 md:pr-2">
                    <span
                      className={`break-words ${
                        isLeader
                          ? "font-semibold text-[var(--ink)]"
                          : "font-medium text-[var(--ink-muted)]"
                      } ${isLeader ? "text-xl md:text-2xl" : choiceTextClass}`}
                    >
                      {option}
                    </span>
                  </div>
                  <div
                    className={`${choiceBarClass} w-full rounded-full border border-[var(--border)] bg-[var(--surface-muted)] ${
                      lowVotes ? "opacity-60" : ""
                    } ${isLeader ? "shadow-[0_0_0_6px_rgba(218,122,60,0.14)]" : ""}`}
                  >
                    <div
                      className={`${choiceBarClass} rounded-full bg-[var(--accent)] transition-[width] duration-500 ${
                        isLeader ? "" : "opacity-70"
                      }`}
                      style={{ width }}
                    />
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-semibold text-[var(--ink)] ${
                        isLeader ? "text-xl md:text-2xl" : choiceValueClass
                      }`}
                    >
                      {percent}%
                    </span>
                    <span
                      className={`block text-xs text-[var(--ink-muted)] ${
                        isLeader ? "text-sm" : ""
                      }`}
                      title={`${value} vote${value === 1 ? "" : "s"}`}
                    >
                      {value} vote{value === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            No options configured.
          </p>
        )}
      </section>
    );
  }

  const max = Math.max(1, ...histogram);
  const avgLabel = avg === null ? "—" : avg.toFixed(1);
  const barHeightClass = large
    ? compact
      ? "h-48 md:h-[20rem]"
      : "h-72 md:h-[32rem]"
    : "h-40";

  return (
    <section
      className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_0_rgba(31,26,22,0.08)]"
      data-result="slider"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className={labelClass}>
            {title ?? "Live results"}
          </p>
          <h2
            className={`text-balance font-[var(--font-display)] text-[var(--ink)] ${
              large ? (compact ? "text-2xl md:text-4xl" : "text-3xl md:text-5xl") : "text-2xl"
            }`}
          >
            Average {avgLabel}
          </h2>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
            Votes
          </p>
          <p className={`font-semibold text-[var(--ink)] ${voteCountClass}`}>
            {count}
          </p>
        </div>
      </div>
      <div
        className="mt-6 grid w-full grid-cols-11 gap-2"
        data-orientation="vertical"
      >
        {histogram.map((value, index) => {
          const score = POLL_MIN + index;
          const height = `${Math.max(6, (value / max) * 100)}%`;
          return (
            <div key={score} className="flex w-full flex-col items-center gap-2">
              <span className={`font-semibold text-[var(--ink)] ${sliderCountClass}`}>
                {value}
              </span>
              <div
                className={`flex w-full items-end rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-1 ${barHeightClass}`}
              >
                <div
                  className="w-full rounded-xl bg-[var(--accent)] transition-[height] duration-500"
                  style={{ height }}
                />
              </div>
              <span className={`text-[var(--ink-muted)] ${sliderValueClass}`}>
                {score}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
