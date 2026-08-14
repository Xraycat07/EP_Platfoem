"use client";

import { useActionState } from "react";
import { saveDeliveryAction } from "../actions";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

type Delivery = {
  scheduledFor: Date | null;
  deliveredAt: Date | null;
  items: string | null;
  notes: string | null;
} | null;

function toDateInput(d: Date | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export function DeliveryForm({ workflowId, delivery }: { workflowId: string; delivery: Delivery }) {
  const boundAction = saveDeliveryAction.bind(null, workflowId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="scheduledFor" className={labelClass}>
            Scheduled for
          </label>
          <input
            id="scheduledFor"
            name="scheduledFor"
            type="date"
            defaultValue={toDateInput(delivery?.scheduledFor ?? null)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="deliveredAt" className={labelClass}>
            Delivered on
          </label>
          <input
            id="deliveredAt"
            name="deliveredAt"
            type="date"
            defaultValue={toDateInput(delivery?.deliveredAt ?? null)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="items" className={labelClass}>
          Items delivered
        </label>
        <textarea id="items" name="items" rows={2} defaultValue={delivery?.items ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea id="notes" name="notes" rows={2} defaultValue={delivery?.notes ?? ""} className={inputClass} />
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
          {pending ? "Saving…" : "Save & advance"}
        </button>
      </div>
    </form>
  );
}
