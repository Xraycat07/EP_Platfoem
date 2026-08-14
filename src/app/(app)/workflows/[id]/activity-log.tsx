import type { ActivityEntry } from "@/lib/workflow/engine";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function fmt(date: Date) {
  return new Date(date).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityLog({ entries, dict }: { entries: ActivityEntry[]; dict: Dictionary["workflowDetail"] }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{dict.fullHistory}</h2>
      <p className="mt-1 text-xs text-ink-soft">{dict.everyRecordedEvent}</p>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">{dict.nothingRecordedYet}</p>
      ) : (
        <div className="mt-4 flex flex-col divide-y divide-line">
          {entries.map((entry, i) => (
            <div key={i} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="sm:w-40 sm:shrink-0">
                <p className="text-xs font-mono text-ink-soft">{fmt(entry.at)}</p>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{entry.title}</p>
                {entry.comment && <p className="mt-0.5 text-ink-soft">{entry.comment}</p>}
              </div>
              {entry.actorName && (
                <div className="sm:w-52 sm:shrink-0 sm:text-right">
                  <p className="text-xs text-ink-soft">{entry.actorName}</p>
                  {entry.actorEmail && (
                    <a href={`mailto:${entry.actorEmail}`} className="text-xs text-teal hover:underline">
                      {entry.actorEmail}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
