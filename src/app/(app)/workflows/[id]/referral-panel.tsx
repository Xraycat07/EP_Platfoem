"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { logReferralAction, startWorkflowFromReferralAction } from "../actions";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

type ReferralRow = {
  id: string;
  contactName: string;
  contactPhone: string | null;
  notes: string | null;
  referredLeadId: string | null;
  referredLead: { id: string; name: string } | null;
};

export function ReferralPanel({ workflowId, referrals }: { workflowId: string; referrals: ReferralRow[] }) {
  const boundAction = logReferralAction.bind(null, workflowId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const [converting, setConverting] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {referrals.length > 0 && (
        <div className="flex flex-col divide-y divide-line">
          {referrals.map((r) => (
            <div key={r.id} className="py-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{r.contactName}</p>
                  {r.contactPhone && <p className="text-xs text-ink-soft">{r.contactPhone}</p>}
                </div>
                {r.referredLead ? (
                  <Link href={`/workflows/${r.referredLead.id}`} className="text-xs text-teal hover:underline">
                    View workflow →
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConverting(converting === r.id ? null : r.id)}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-amber hover:text-amber"
                  >
                    Start workflow
                  </button>
                )}
              </div>
              {converting === r.id && (
                <div className="mt-3 rounded-md border border-line bg-surface-muted/50 p-3">
                  <ConvertForm referralId={r.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="contactName" className={labelClass}>
              Referral name
            </label>
            <input id="contactName" name="contactName" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="contactPhone" className={labelClass}>
              Phone
            </label>
            <input id="contactPhone" name="contactPhone" className={inputClass} />
          </div>
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
            {pending ? "Saving…" : "Log referral"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConvertForm({ referralId }: { referralId: string }) {
  const boundAction = startWorkflowFromReferralAction.bind(null, referralId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="suburb" className={labelClass}>
            Suburb
          </label>
          <input id="suburb" name="suburb" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="area" className={labelClass}>
            Area
          </label>
          <input id="area" name="area" className={inputClass} />
        </div>
      </div>
      {state?.error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-amber px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create workflow"}
        </button>
      </div>
    </form>
  );
}
