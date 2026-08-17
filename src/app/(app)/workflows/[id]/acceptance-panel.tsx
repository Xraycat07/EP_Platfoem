"use client";

import { useState, useTransition } from "react";
import { acceptQuoteManualAction } from "../actions";

type Quote = { id: string; shareToken: string; status: string; createdAt: Date };

export function AcceptancePanel({ workflowId, quotes }: { workflowId: string; quotes: Quote[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const latest = quotes[0];
  const canSubmit = comment.trim().length > 0;

  function accept(token: string) {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      try {
        await acceptQuoteManualAction(workflowId, token, comment);
        setConfirming(null);
        setComment("");
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
      {quotes.map((q) => {
        const isConfirming = confirming === q.shareToken;
        return (
          <div key={q.id} className="flex flex-col gap-2 rounded-md border border-line p-3">
            <div className="flex items-center justify-between">
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
                  onClick={() => {
                    setConfirming(isConfirming ? null : q.shareToken);
                    setComment("");
                    setError(null);
                  }}
                  className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  Mark accepted
                </button>
              )}
            </div>
            {isConfirming && (
              <div className="flex flex-col gap-2 rounded-md border border-line bg-surface-muted/50 p-3">
                <label className="text-xs font-medium text-ink-soft">Comment (required)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="How did the client confirm acceptance?"
                  className="rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending || !canSubmit}
                    onClick={() => accept(q.shareToken)}
                    className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {pending ? "Saving…" : "Confirm accepted"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="text-xs text-ink-soft hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {!latest && <p className="text-ink-soft">No quote sent yet.</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
