"use client";

import { useActionState, useTransition } from "react";
import { createTicketAction, resolveTicketAction } from "../actions";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  raisedAt: Date;
  resolvedAt: Date | null;
  notes: string | null;
};

export function AfterSalesPanel({ workflowId, tickets }: { workflowId: string; tickets: Ticket[] }) {
  const boundAction = createTicketAction.bind(null, workflowId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const [resolving, startResolve] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {tickets.length > 0 && (
        <div className="flex flex-col divide-y divide-line">
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className={t.status === "RESOLVED" ? "text-ink-soft line-through" : "text-foreground"}>
                  {t.subject}
                </p>
                <p className="text-xs text-ink-soft">
                  Raised {new Date(t.raisedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                </p>
              </div>
              {t.status !== "RESOLVED" && (
                <button
                  type="button"
                  disabled={resolving}
                  onClick={() => startResolve(() => resolveTicketAction(t.id, workflowId))}
                  className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal disabled:opacity-60"
                >
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="subject" className={labelClass}>
            Raise a ticket
          </label>
          <input id="subject" name="subject" placeholder="Subject" required className={inputClass} />
        </div>
        <textarea name="notes" rows={2} placeholder="Notes (required)" required className={inputClass} />
        {state?.error && (
          <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Raise ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
