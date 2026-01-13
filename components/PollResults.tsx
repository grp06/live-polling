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
  if (!pollType) {
    return (
      <section className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {title ?? "Live results"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
          No active poll.
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Results will appear here once voting opens.
        </p>
      </section>
    );
  }

  if (pollType === "multiple_choice") {
    const max = Math.max(1, ...histogram);
    return (
      <section className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {title ?? "Live results"}
            </p>
            <h2
              className={`text-balance font-semibold text-zinc-900 ${
                large ? "text-3xl md:text-5xl" : "text-2xl"
              }`}
            >
              Responses
            </h2>
          </div>
          <div className="rounded-2xl bg-zinc-900 px-4 py-2 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">
              Votes
            </p>
            <p className="text-2xl font-semibold">{count}</p>
          </div>
        </div>
        {options && options.length > 0 ? (
          <div className="mt-6 space-y-3">
            {options.map((option, index) => {
              const value = histogram[index] ?? 0;
              const width = `${Math.max(4, (value / max) * 100)}%`;
              return (
                <div
                  key={`${option}-${index}`}
                  className="flex items-center gap-3"
                >
                  <span className="min-w-[6rem] text-sm font-medium text-zinc-600">
                    {option}
                  </span>
                  <div className="h-3 flex-1 rounded-full bg-zinc-100">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"
                      style={{ width }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-zinc-700">
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">No options configured.</p>
        )}
      </section>
    );
  }

  const max = Math.max(1, ...histogram);
  const avgLabel = avg === null ? "—" : avg.toFixed(1);

  return (
    <section className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {title ?? "Live results"}
          </p>
          <h2
            className={`text-balance font-semibold text-zinc-900 ${
              large ? "text-3xl md:text-5xl" : "text-2xl"
            }`}
          >
            Average {avgLabel}
          </h2>
        </div>
        <div className="rounded-2xl bg-zinc-900 px-4 py-2 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">
            Votes
          </p>
          <p className="text-2xl font-semibold">{count}</p>
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
              <span className="text-xs font-semibold text-zinc-700">
                {value}
              </span>
              <div className="flex h-40 w-full items-end rounded-2xl bg-zinc-100/80 px-1">
                <div
                  className="w-full rounded-xl bg-gradient-to-t from-amber-400 via-orange-400 to-rose-400"
                  style={{ height }}
                />
              </div>
              <span className="text-xs text-zinc-500">{score}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        Scale {POLL_MIN} to {POLL_MAX}
      </p>
    </section>
  );
}
