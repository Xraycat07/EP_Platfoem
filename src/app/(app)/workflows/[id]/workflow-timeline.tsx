"use client";

import { useState, useTransition } from "react";
import { returnToStepAction } from "../actions";
import { STEP_ORDER, STEP_GROUPS, nextStep } from "@/lib/workflow/definition";
import type { StepKey, StepStatus } from "@/lib/workflow/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type StepRow = {
  stepKey: string;
  status: StepStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  completedBy: { name: string; email: string } | null;
};

function fmt(date: Date | null) {
  return date
    ? new Date(date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
    : "—";
}

export function WorkflowTimeline({
  workflowId,
  currentStep,
  steps,
  categoryContacts,
  dict,
}: {
  workflowId: string;
  currentStep: StepKey;
  steps: StepRow[];
  categoryContacts: Record<string, string | null>;
  dict: Dictionary;
}) {
  const t = dict.workflowDetail;
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState<StepKey | null>(null);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();
  const byKey = Object.fromEntries(steps.map((s) => [s.stepKey, s])) as Record<StepKey, StepRow>;
  const completedSteps = STEP_ORDER.filter((key) => byKey[key]?.status === "COMPLETED");
  const upcoming = nextStep(currentStep);

  const canReturn = comment.trim().length > 0;

  function handleReturn(target: StepKey) {
    if (!canReturn) return;
    setError(null);
    startTransition(async () => {
      try {
        await returnToStepAction(workflowId, target, comment);
        setReturning(null);
        setComment("");
      } catch (e) {
        setError(e instanceof Error ? e.message : t.couldntReturn);
      }
    });
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{t.timeline}</h2>
      <div className="mt-4 flex flex-col gap-3">
        {STEP_GROUPS.map((group) => (
          <div key={group.key}>
            <p className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
              {dict.stepGroups[group.key as keyof typeof dict.stepGroups]}
              {categoryContacts[group.key] && (
                <a
                  href={`mailto:${categoryContacts[group.key]}`}
                  className="font-mono font-normal normal-case tracking-normal text-teal hover:underline"
                >
                  {categoryContacts[group.key]}
                </a>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.steps.map((key) => {
                const isCurrent = key === currentStep;
                const isDone = byKey[key]?.status === "COMPLETED";
                return (
                  <span
                    key={key}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      isCurrent
                        ? "bg-amber text-white"
                        : isDone
                          ? "bg-teal-soft text-teal"
                          : "bg-surface-muted text-ink-soft"
                    }`}
                  >
                    {dict.stepLabels[key as StepKey]}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-ink-soft">
        {t.youAreOn} <span className="font-medium text-foreground">{dict.stepLabels[currentStep]}</span>.
        {upcoming
          ? ` ${t.completingItMoves} ${dict.stepLabels[upcoming]} ${t.useButtonInPanel}`
          : ` ${t.lastStep}`}
      </p>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t.history}</h3>
        {completedSteps.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">{t.noStepsCompleted}</p>
        ) : (
          <div className="mt-2 flex flex-col divide-y divide-line">
            {completedSteps.map((key) => {
              const step = byKey[key];
              const isReturning = returning === key;
              return (
                <div key={key} className="py-2.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{dict.stepLabels[key]}</p>
                      <p className="text-xs text-ink-soft">
                        {t.completed} {fmt(step.completedAt)}
                        {step.completedBy && (
                          <>
                            {" "}
                            {t.completedBy}{" "}
                            <a href={`mailto:${step.completedBy.email}`} className="text-teal hover:underline">
                              {step.completedBy.name} ({step.completedBy.email})
                            </a>
                          </>
                        )}
                        {step.notes ? ` — ${step.notes}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setReturning(isReturning ? null : key);
                        setComment("");
                        setError(null);
                      }}
                      className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-amber hover:text-amber disabled:opacity-60"
                    >
                      {t.returnToThisStep}
                    </button>
                  </div>
                  {isReturning && (
                    <div className="mt-2 flex flex-col gap-2 rounded-md border border-line bg-surface-muted/50 p-3">
                      <label className="text-xs font-medium text-ink-soft">{t.returnReasonLabel}</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        placeholder={t.returnReasonPlaceholder}
                        className="rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-amber focus:ring-2 focus:ring-amber/20"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={pending || !canReturn}
                          onClick={() => handleReturn(key)}
                          className="rounded-md bg-amber px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          {pending ? t.returning : t.confirmReturn}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReturning(null)}
                          className="text-xs text-ink-soft hover:text-foreground"
                        >
                          {t.cancel}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
