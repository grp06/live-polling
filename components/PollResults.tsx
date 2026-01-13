import { POLL_MAX, POLL_MIN, type PollType } from "@/lib/pollTypes";

type PollResultsProps = {
  count: number;
  avg: number | null;
  histogram: number[];
  pollType: PollType | null;
  options?: string[];
  title?: string;
  large?: boolean;
};

export function PollResults({
  count,
  avg,
  histogram,
  pollType,
  options,
  title,
  large = false,
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
          <div className="mt-6 space-y-3">
            {options.map((option, index) => {
              const value = histogram[index] ?? 0;
              const width = `${Math.max(6, (value / max) * 100)}%`;
              return (
                <div
                  key={`${option}-${index}`}
                  className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_3.5rem]"
                >
                  <span
                    className={`break-words font-medium text-[var(--ink)] md:pr-2 ${choiceTextClass}`}
                  >
                    {option}
                  </span>
                  <div
                    className={`${choiceBarClass} w-full rounded-full border border-[var(--border)] bg-[var(--surface-muted)]`}
                  >
                    <div
                      className={`${choiceBarClass} rounded-full bg-[var(--accent)] transition-[width] duration-500`}
                      style={{ width }}
                    />
                  </div>
                  <span
                    className={`text-right font-semibold text-[var(--ink)] ${choiceValueClass}`}
                  >
                    {value}
                  </span>
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
  const barHeightClass = large ? "h-64 md:h-[28rem]" : "h-36";

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
              large ? "text-3xl md:text-5xl" : "text-2xl"
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
