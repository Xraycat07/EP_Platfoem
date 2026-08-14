"use client";

import { useTransition } from "react";
import { acceptQuoteAction, declineQuoteAction } from "./actions";

export function RespondButtons({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => acceptQuoteAction(token))}
        className="rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        Accept this proposal
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => declineQuoteAction(token))}
        className="rounded-md border border-line px-5 py-2.5 text-sm font-medium text-ink-soft transition hover:border-danger hover:text-danger disabled:opacity-60"
      >
        Not right now
      </button>
    </div>
  );
}
