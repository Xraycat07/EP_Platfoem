"use client";

import { useActionState } from "react";
import { saveCocAction } from "../actions";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

type Coc = { certificateNo: string | null; issuedAt: Date | null; issuedBy: string | null } | null;

export function CocForm({ workflowId, coc }: { workflowId: string; coc: Coc }) {
  const boundAction = saveCocAction.bind(null, workflowId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="certificateNo" className={labelClass}>
            Certificate no.
          </label>
          <input
            id="certificateNo"
            name="certificateNo"
            defaultValue={coc?.certificateNo ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="issuedAt" className={labelClass}>
            Issued on
          </label>
          <input
            id="issuedAt"
            name="issuedAt"
            type="date"
            defaultValue={coc?.issuedAt ? new Date(coc.issuedAt).toISOString().slice(0, 10) : ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="issuedBy" className={labelClass}>
            Issued by
          </label>
          <input id="issuedBy" name="issuedBy" defaultValue={coc?.issuedBy ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Notes (required)
        </label>
        <textarea id="notes" name="notes" rows={2} required className={inputClass} />
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
