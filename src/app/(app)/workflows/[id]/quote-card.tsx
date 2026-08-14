"use client";

import { useEffect, useState } from "react";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-surface-muted text-ink-soft",
  SENT: "bg-amber-soft text-amber",
  ACCEPTED: "bg-teal-soft text-teal",
  DECLINED: "bg-danger-soft text-danger",
};

export function QuoteCard({
  shareToken,
  status,
  createdAt,
  tierCount,
  totalFrom,
}: {
  shareToken: string;
  status: string;
  createdAt: string;
  tierCount: number;
  totalFrom: number;
}) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(`/quote/${shareToken}`);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/quote/${shareToken}`);
  }, [shareToken]);

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const waText = encodeURIComponent(
    `Hi, here's your EP solar proposal: ${shareUrl}`
  );

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Quote · {tierCount} option{tierCount === 1 ? "" : "s"} from R{totalFrom.toLocaleString("en-ZA")}
          </p>
          <p className="text-xs text-ink-soft">{createdAt}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[status] ?? ""}`}>
          {status}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={`/quote/${shareToken}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal"
        >
          View quote
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal"
        >
          {copied ? "Link copied!" : "Copy share link"}
        </button>
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal"
        >
          Share via WhatsApp
        </a>
      </div>
    </div>
  );
}
