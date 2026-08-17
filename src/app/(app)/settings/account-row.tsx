"use client";

import { useActionState, useState } from "react";
import { updateLoginAction } from "./actions";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", REP: "Rep" };

export function AccountRow({
  user,
  dict,
}: {
  user: { id: string; name: string; email: string; role: string };
  dict: {
    name: string;
    email: string;
    password: string;
    role: string;
    edit: string;
    cancel: string;
    save: string;
    saving: string;
    leavePasswordBlank: string;
    accountUpdated: string;
  };
}) {
  const [editing, setEditing] = useState(false);
  const boundAction = updateLoginAction.bind(null, user.id);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
        <div>
          <p className="font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-ink-soft">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-soft">
            {ROLE_LABEL[user.role] ?? user.role}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-teal hover:underline"
          >
            {dict.edit}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3">
      <form action={formAction} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor={`edit-name-${user.id}`} className={labelClass}>
              {dict.name}
            </label>
            <input id={`edit-name-${user.id}`} name="name" defaultValue={user.name} required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`edit-email-${user.id}`} className={labelClass}>
              {dict.email}
            </label>
            <input
              id={`edit-email-${user.id}`}
              name="email"
              type="email"
              defaultValue={user.email}
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`edit-role-${user.id}`} className={labelClass}>
              {dict.role}
            </label>
            <select id={`edit-role-${user.id}`} name="role" defaultValue={user.role} className={inputClass}>
              <option value="REP">Rep</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`edit-password-${user.id}`} className={labelClass}>
              {dict.password}
            </label>
            <input
              id={`edit-password-${user.id}`}
              name="password"
              type="password"
              minLength={8}
              placeholder={dict.leavePasswordBlank}
              className={inputClass}
            />
          </div>
        </div>

        {state?.error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
        {state?.success && (
          <p className="rounded-md bg-teal-soft px-3 py-2 text-sm text-teal">{dict.accountUpdated}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-danger hover:text-danger"
          >
            {dict.cancel}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? dict.saving : dict.save}
          </button>
        </div>
      </form>
    </div>
  );
}
