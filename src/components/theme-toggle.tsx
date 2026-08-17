"use client";

import { useTransition } from "react";
import { setThemeAction } from "@/lib/theme/actions";
import type { Theme } from "@/lib/theme/get-theme";

export function ThemeToggle({ theme }: { theme: Theme }) {
  const [pending, startTransition] = useTransition();

  function choose(next: Theme) {
    if (next === theme || pending) return;
    startTransition(() => setThemeAction(next));
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-line p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => choose("light")}
        disabled={pending}
        className={`rounded px-2 py-1 transition ${
          theme === "light" ? "bg-teal text-white" : "text-ink-soft hover:text-foreground"
        }`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => choose("dark")}
        disabled={pending}
        className={`rounded px-2 py-1 transition ${
          theme === "dark" ? "bg-teal text-white" : "text-ink-soft hover:text-foreground"
        }`}
      >
        Dark
      </button>
    </div>
  );
}
