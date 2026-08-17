"use client";

import { useState, useTransition } from "react";
import { regenerateFeedTokenAction } from "./actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function SubscribePanel({
  token,
  baseUrl,
  dict,
}: {
  token: string;
  baseUrl: string;
  dict: Dictionary["calendarPage"]["subscribe"];
}) {
  const [currentToken, setCurrentToken] = useState(token);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  // baseUrl comes from the server (AUTH_URL) so this matches on both the
  // server-rendered HTML and the client — using window.location.origin here
  // instead would diverge from the SSR output and trigger a hydration mismatch.
  const feedUrl = `${baseUrl}/api/calendar/${currentToken}`;
  const webcalUrl = feedUrl.replace(/^https?:\/\//, "webcal://");

  async function copyLink() {
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function regenerate() {
    startTransition(async () => {
      const next = await regenerateFeedTokenAction();
      setCurrentToken(next);
      setConfirming(false);
    });
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{dict.title}</h2>
      <p className="mt-1 text-xs text-ink-soft">{dict.subtitle}</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          readOnly
          value={feedUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-md border border-line bg-surface-muted px-3 py-2 font-mono text-xs text-ink-soft outline-none"
        />
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal"
          >
            {copied ? dict.linkCopied : dict.copyLink}
          </button>
          <a
            href={webcalUrl}
            className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            {dict.openInApp}
          </a>
        </div>
      </div>

      <div className="mt-3">
        {confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-danger">{dict.regenerateWarning}</span>
            <button
              type="button"
              disabled={pending}
              onClick={regenerate}
              className="rounded-md bg-danger px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? dict.regenerating : dict.confirmRegenerate}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-xs text-ink-soft hover:text-foreground"
            >
              {dict.cancel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-xs font-medium text-ink-soft hover:text-danger"
          >
            {dict.regenerateLink}
          </button>
        )}
      </div>
    </div>
  );
}
