"use client";

import { useState } from "react";

export function ShareBar({ token, clientName }: { token: string; clientName: string }) {
  const [copied, setCopied] = useState(false);
  const relativeUrl = `/quote/${token}`;

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${relativeUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function shareViaWhatsApp() {
    const text = encodeURIComponent(
      `Hi, sharing my ELP solar proposal (${clientName}): ${window.location.origin}${relativeUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copyLink}
        className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal"
      >
        {copied ? "Link copied!" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={shareViaWhatsApp}
        className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal"
      >
        Share on WhatsApp
      </button>
    </div>
  );
}
