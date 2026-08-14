"use client";

import { useTransition } from "react";
import { setLocaleAction } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LanguageToggle({ locale }: { locale: Locale }) {
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale || pending) return;
    startTransition(() => setLocaleAction(next));
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-line p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => choose("en")}
        disabled={pending}
        className={`rounded px-2 py-1 transition ${
          locale === "en" ? "bg-teal text-white" : "text-ink-soft hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => choose("af")}
        disabled={pending}
        className={`rounded px-2 py-1 transition ${
          locale === "af" ? "bg-teal text-white" : "text-ink-soft hover:text-foreground"
        }`}
      >
        AF
      </button>
    </div>
  );
}
