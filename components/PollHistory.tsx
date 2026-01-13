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
    <section className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900">Poll history</h3>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Last {history.length}
        </span>
      </div>
      {history.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          No closed polls yet. Close a poll to see history.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-black/5 bg-white p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Closed {formatTimestamp(item.closedAt)}
                {item.type === "multiple_choice" ? " · Multiple choice" : ""}
              </p>
              <p className="mt-2 text-base font-semibold text-zinc-900">
                {item.question}
              </p>
              {item.type === "multiple_choice" ? (
                <div className="mt-3 space-y-2 text-sm text-zinc-600">
                  {item.options?.map((option, index) => (
                    <div key={`${option}-${index}`} className="flex gap-3">
                      <span className="min-w-[6rem]">{option}</span>
                      <span className="font-semibold text-zinc-800">
                        {item.histogram[index] ?? 0}
                      </span>
                    </div>
                  ))}
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                    {item.count} votes
                  </span>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-600">
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
