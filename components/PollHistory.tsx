import type { ClosedPollSummary } from "@/lib/pollTypes";

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

type PollHistoryProps = {
  history: ClosedPollSummary[];
};

export function PollHistory({ history }: PollHistoryProps) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_0_rgba(31,26,22,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-[var(--font-display)] text-[var(--ink)]">
          Poll history
        </h3>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
          Last {history.length}
        </span>
      </div>
      {history.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          No closed polls yet. Close a poll to see history.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                Closed {formatTimestamp(item.closedAt)}
                {item.type === "multiple_choice" ? " · Multiple choice" : ""}
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--ink)]">
                {item.question}
              </p>
              {item.type === "multiple_choice" ? (
                <div className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
                  {item.options?.map((option, index) => (
                    <div key={`${option}-${index}`} className="flex gap-3">
                      <span className="min-w-[6rem] text-[var(--ink)]">
                        {option}
                      </span>
                      <span className="font-semibold text-[var(--ink)]">
                        {item.histogram[index] ?? 0}
                      </span>
                    </div>
                  ))}
                  <span className="text-xs uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                    {item.count} votes
                  </span>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]">
                  <span>
                    Avg {item.avg === null ? "—" : item.avg.toFixed(1)}
                  </span>
                  <span>{item.count} votes</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
