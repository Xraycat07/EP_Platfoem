"use client";

import { useActionState } from "react";
import { setCategoryContactAction } from "./actions";

export function CategoryContactForm({
  categoryKey,
  email,
  saveLabel,
  savingLabel,
}: {
  categoryKey: string;
  email: string | null;
  saveLabel: string;
  savingLabel: string;
}) {
  const boundAction = setCategoryContactAction.bind(null, categoryKey);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="email"
        name="email"
        defaultValue={email ?? ""}
        placeholder="team@elp.co.za"
        className="w-56 rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? savingLabel : saveLabel}
      </button>
      {state?.error && <p className="w-full text-xs text-danger">{state.error}</p>}
    </form>
  );
}
