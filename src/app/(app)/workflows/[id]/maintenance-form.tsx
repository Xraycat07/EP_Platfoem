"use client";

import { useActionState } from "react";
import { logMaintenanceAction } from "../actions";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

export function MaintenanceForm({ workflowId }: { workflowId: string }) {
  const boundAction = logMaintenanceAction.bind(null, workflowId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="planType" className={labelClass}>
            Plan type
          </label>
          <input id="planType" name="planType" placeholder="e.g. Annual check" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="scheduledFor" className={labelClass}>
            Scheduled for
          </label>
          <input id="scheduledFor" name="scheduledFor" type="date" className={inputClass} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea id="notes" name="notes" rows={2} className={inputClass} />
      </div>

      {state?.error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Log maintenance"}
        </button>
      </div>
    </form>
  );
}
