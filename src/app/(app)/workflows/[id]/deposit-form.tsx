"use client";

import { useActionState } from "react";
import { recordDepositAction } from "../actions";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

export function DepositForm({ workflowId }: { workflowId: string }) {
  const boundAction = recordDepositAction.bind(null, workflowId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="amount" className={labelClass}>
            Amount (R)
          </label>
          <input id="amount" name="amount" type="number" step="1" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="paidAt" className={labelClass}>
            Paid on
          </label>
          <input id="paidAt" name="paidAt" type="date" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="reference" className={labelClass}>
            Reference
          </label>
          <input id="reference" name="reference" className={inputClass} />
        </div>
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
          {pending ? "Saving…" : "Record deposit & advance"}
        </button>
      </div>
    </form>
  );
}
