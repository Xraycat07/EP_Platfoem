"use client";

import { useActionState } from "react";
import { saveInstallationAction } from "../actions";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

type Installation = {
  scheduledFor: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  installedById: string | null;
  notes: string | null;
} | null;

function toDateInput(d: Date | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export function InstallationForm({
  workflowId,
  installation,
  users,
}: {
  workflowId: string;
  installation: Installation;
  users: { id: string; name: string }[];
}) {
  const boundAction = saveInstallationAction.bind(null, workflowId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="scheduledFor" className={labelClass}>
            Scheduled for
          </label>
          <input
            id="scheduledFor"
            name="scheduledFor"
            type="date"
            defaultValue={toDateInput(installation?.scheduledFor ?? null)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="startedAt" className={labelClass}>
            Started
          </label>
          <input
            id="startedAt"
            name="startedAt"
            type="date"
            defaultValue={toDateInput(installation?.startedAt ?? null)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="completedAt" className={labelClass}>
            Completed
          </label>
          <input
            id="completedAt"
            name="completedAt"
            type="date"
            defaultValue={toDateInput(installation?.completedAt ?? null)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="installedById" className={labelClass}>
          Installed by
        </label>
        <select
          id="installedById"
          name="installedById"
          defaultValue={installation?.installedById ?? ""}
          className={inputClass}
        >
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea id="notes" name="notes" rows={2} defaultValue={installation?.notes ?? ""} className={inputClass} />
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
