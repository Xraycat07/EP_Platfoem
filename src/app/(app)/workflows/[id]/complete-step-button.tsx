"use client";

import { useState, useTransition } from "react";
import { completeStepAction } from "../actions";
import type { StepKey } from "@/lib/workflow/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function CompleteStepButton({
  workflowId,
  stepKey,
  label,
  dict,
}: {
  workflowId: string;
  stepKey: StepKey;
  label: string;
  dict: Dictionary["workflowDetail"];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const canSubmit = comment.trim().length > 0;

  function handleClick() {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      try {
        await completeStepAction(workflowId, stepKey, comment);
      } catch (e) {
        setError(e instanceof Error ? e.message : dict.couldntAdvance);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <label className="text-xs font-medium text-ink-soft">{dict.commentRequired}</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder={dict.whatHappenedPlaceholder}
        className="w-full max-w-md rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
      />
      <button
        type="button"
        disabled={pending || !canSubmit}
        onClick={handleClick}
        className="w-fit rounded-md bg-amber px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? dict.saving : label}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
