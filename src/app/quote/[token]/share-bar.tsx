"use client";

import { useEffect, useState } from "react";

export function ShareBar({ token, clientName }: { token: string; clientName: string }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(`/quote/${token}`);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/quote/${token}`);
  }, [token]);

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const shareText = encodeURIComponent(
    `Hi, sharing my EP solar proposal (${clientName}): ${shareUrl}`
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copyLink}
        className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal"
      >
        {copied ? "Link copied!" : "Copy link"}
      </button>
      <a
        href={`https://wa.me/?text=${shareText}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal"
      >
        Share on WhatsApp
      </a>
    </div>
  );
}
