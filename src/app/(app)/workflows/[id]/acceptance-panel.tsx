"use client";

import { useState, useTransition } from "react";
import { acceptQuoteManualAction } from "../actions";

type Quote = { id: string; shareToken: string; status: string; createdAt: Date };

export function AcceptancePanel({ workflowId, quotes }: { workflowId: string; quotes: Quote[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const latest = quotes[0];

  function accept(token: string) {
    setError(null);
    startTransition(async () => {
      try {
        await acceptQuoteManualAction(workflowId, token);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't mark this quote accepted.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-ink-soft">
        Acceptance normally happens when the client clicks Accept on their share link. If they confirmed
        verbally or via WhatsApp instead, you can mark it accepted manually below.
      </p>
      {quotes.map((q) => (
        <div key={q.id} className="flex items-center justify-between rounded-md border border-line p-3">
          <div>
            <p className="font-medium text-foreground">
              Quote sent{" "}
              {new Date(q.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
            </p>
            <p className="text-xs text-ink-soft">{q.status}</p>
          </div>
          {q.status === "SENT" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => accept(q.shareToken)}
              className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              Mark accepted
            </button>
          )}
        </div>
      ))}
      {!latest && <p className="text-ink-soft">No quote sent yet.</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
