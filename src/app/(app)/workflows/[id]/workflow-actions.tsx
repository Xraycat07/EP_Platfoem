"use client";

import { useState, useTransition } from "react";
import { holdAction, resumeAction, cancelAction } from "../actions";
import type { WorkflowStatus } from "@/lib/workflow/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function CommentForm({
  pending,
  confirmLabel,
  placeholder,
  backLabel,
  onConfirm,
  onBack,
}: {
  pending: boolean;
  confirmLabel: string;
  placeholder: string;
  backLabel: string;
  onConfirm: (comment?: string) => void;
  onBack: () => void;
}) {
  const [comment, setComment] = useState("");
  return (
    <div className="flex items-center gap-1.5">
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-line bg-surface px-2 py-1.5 text-xs outline-none focus:border-amber"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => onConfirm(comment.trim() || undefined)}
        className="rounded-md bg-amber px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {confirmLabel}
      </button>
      <button type="button" onClick={onBack} className="text-xs text-ink-soft hover:text-foreground">
        {backLabel}
      </button>
    </div>
  );
}

export function WorkflowActions({
  workflowId,
  status,
  dict,
}: {
  workflowId: string;
  status: WorkflowStatus;
  dict: Dictionary["workflowDetail"];
}) {
  const [pending, startTransition] = useTransition();
  const [openForm, setOpenForm] = useState<"cancel" | "hold" | "resume" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === "COMPLETED" || status === "CANCELLED") return null;

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        setOpenForm(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : dict.actionFailed);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === "ON_HOLD" ? (
          openForm === "resume" ? (
            <CommentForm
              pending={pending}
              confirmLabel={dict.confirmResume}
              placeholder={dict.commentOptional}
              backLabel={dict.back}
              onConfirm={(comment) => run(() => resumeAction(workflowId, comment))}
              onBack={() => setOpenForm(null)}
            />
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setOpenForm("resume")}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal disabled:opacity-60"
            >
              {dict.resume}
            </button>
          )
        ) : openForm === "hold" ? (
          <CommentForm
            pending={pending}
            confirmLabel={dict.confirmHold}
            placeholder={dict.commentOptional}
            backLabel={dict.back}
            onConfirm={(comment) => run(() => holdAction(workflowId, comment))}
            onBack={() => setOpenForm(null)}
          />
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setOpenForm("hold")}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-amber hover:text-amber disabled:opacity-60"
          >
            {dict.putOnHold}
          </button>
        )}

        {openForm === "cancel" ? (
          <CommentForm
            pending={pending}
            confirmLabel={dict.confirmCancel}
            placeholder={dict.commentOptional}
            backLabel={dict.back}
            onConfirm={(comment) => run(() => cancelAction(workflowId, comment))}
            onBack={() => setOpenForm(null)}
          />
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setOpenForm("cancel")}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-danger hover:text-danger disabled:opacity-60"
          >
            {dict.cancelWorkflow}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
