import { STEP_GROUPS, nextStep } from "@/lib/workflow/definition";
import type { StepKey, StepStatus } from "@/lib/workflow/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { CategoryContactAccount } from "@/lib/category-contacts";

type StepRow = {
  stepKey: string;
  status: StepStatus;
};

export function WorkflowTimeline({
  currentStep,
  steps,
  categoryContacts,
  dict,
  onStepClick,
}: {
  currentStep: StepKey;
  steps: StepRow[];
  categoryContacts: Record<string, CategoryContactAccount[]>;
  dict: Dictionary;
  onStepClick?: (step: StepKey) => void;
}) {
  const t = dict.workflowDetail;
  const byKey = Object.fromEntries(steps.map((s) => [s.stepKey, s])) as Record<StepKey, StepRow>;
  const upcoming = nextStep(currentStep);

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold text-foreground">{t.timeline}</h2>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {STEP_GROUPS.map((group) => (
          <div key={group.key} className="flex flex-wrap items-center gap-1.5">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
              {dict.stepGroups[group.key as keyof typeof dict.stepGroups]}
            </span>
            {group.steps.map((key) => {
              const isCurrent = key === currentStep;
              const isDone = byKey[key]?.status === "COMPLETED";
              const pillClass = `rounded-full px-2 py-0.5 text-[11px] font-medium ${
                isCurrent
                  ? "bg-amber text-white"
                  : isDone
                    ? "bg-teal-soft text-teal transition hover:opacity-75"
                    : "bg-surface-muted text-ink-soft"
              }`;
              if (isDone && onStepClick) {
                return (
                  <button key={key} type="button" onClick={() => onStepClick(key)} className={pillClass}>
                    {dict.stepLabels[key as StepKey]}
                  </button>
                );
              }
              return (
                <span key={key} className={pillClass}>
                  {dict.stepLabels[key as StepKey]}
                </span>
              );
            })}
            {categoryContacts[group.key]?.length > 0 && (
              <a
                href={`mailto:${categoryContacts[group.key].map((u) => u.email).join(",")}`}
                className="text-[11px] font-mono text-teal hover:underline"
              >
                {categoryContacts[group.key].map((u) => u.name).join(", ")}
              </a>
            )}
          </div>
        ))}
      </div>

      <p className="mt-2.5 text-xs text-ink-soft">
        {t.youAreOn} <span className="font-medium text-foreground">{dict.stepLabels[currentStep]}</span>.
        {upcoming
          ? ` ${t.completingItMoves} ${dict.stepLabels[upcoming]} ${t.useButtonInPanel}`
          : ` ${t.lastStep}`}
      </p>
    </div>
  );
}
