"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { setCategoryContactAction } from "./actions";

export function CategoryContactForm({
  categoryKey,
  selectedUserIds,
  accounts,
  saveLabel,
  savingLabel,
  savedLabel,
  currentlyLinkedLabel,
  noneLinkedLabel,
  selectAccountsLabel,
}: {
  categoryKey: string;
  selectedUserIds: string[];
  accounts: { id: string; name: string; email: string }[];
  saveLabel: string;
  savingLabel: string;
  savedLabel: string;
  currentlyLinkedLabel: string;
  noneLinkedLabel: string;
  selectAccountsLabel: string;
}) {
  const boundAction = setCategoryContactAction.bind(null, categoryKey);
  const [state, formAction, pending] = useActionState(boundAction, undefined);
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedUserIds));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const linkedEmails = accounts.filter((a) => checked.has(a.id)).map((a) => a.email);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <p className="text-[11px] text-ink-soft">
        {linkedEmails.length > 0 ? (
          <>
            {currentlyLinkedLabel}: <span className="font-mono text-teal">{linkedEmails.join(", ")}</span>
          </>
        ) : (
          noneLinkedLabel
        )}
      </p>
      <div className="flex flex-wrap items-start gap-2">
        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-64 items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-1.5 text-left text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
          >
            <span className="truncate text-foreground">
              {checked.size > 0 ? `${checked.size} — ${selectAccountsLabel}` : selectAccountsLabel}
            </span>
            <span className="shrink-0 text-ink-soft">{open ? "▴" : "▾"}</span>
          </button>
          {/* Checkboxes stay mounted even while closed — the form needs them present in
              the DOM at submit time. A submit-button click closes the dropdown (via the
              outside-click handler) *before* the browser reads form data, so unmounting
              them here would silently drop every selection, including ones already saved. */}
          <div
            className={`absolute z-10 mt-1 max-h-56 w-64 overflow-y-auto rounded-md border border-line bg-surface shadow-lg ${
              open ? "" : "hidden"
            }`}
          >
            {accounts.map((account) => (
              <label
                key={account.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-muted"
              >
                <input
                  type="checkbox"
                  name="userIds"
                  value={account.id}
                  checked={checked.has(account.id)}
                  onChange={() => toggle(account.id)}
                  className="shrink-0 rounded border-line accent-teal"
                />
                <span className="truncate text-foreground">
                  {account.name} <span className="text-ink-soft">({account.email})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? savingLabel : saveLabel}
        </button>
      </div>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      {state?.success && !state?.error && <p className="text-xs text-teal">{savedLabel}</p>}
    </form>
  );
}
