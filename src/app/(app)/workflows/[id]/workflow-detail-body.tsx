"use client";

import { useState, type ReactNode } from "react";
import { WorkflowTimeline } from "./workflow-timeline";
import { WorkflowHistoryTab, type CapturedData } from "./workflow-history-tab";
import type { StepKey, StepStatus } from "@/lib/workflow/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { CategoryContactAccount } from "@/lib/category-contacts";

type StepRow = {
  stepKey: string;
  status: StepStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  completedBy: { name: string; email: string } | null;
};

export function WorkflowDetailBody({
  workflowId,
  currentStep,
  steps,
  categoryContacts,
  captured,
  dict,
  overviewExtra,
  activityLog,
}: {
  workflowId: string;
  currentStep: StepKey;
  steps: StepRow[];
  categoryContacts: Record<string, CategoryContactAccount[]>;
  captured: CapturedData;
  dict: Dictionary;
  overviewExtra: ReactNode;
  activityLog: ReactNode;
}) {
  const t = dict.workflowDetail;
  const [tab, setTab] = useState<"overview" | "history">("overview");
  const [jumpToStep, setJumpToStep] = useState<{ step: StepKey; nonce: number } | null>(null);

  function handleStepClick(step: StepKey) {
    setJumpToStep({ step, nonce: Date.now() });
    setTab("history");
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-line">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          {t.overview}
        </TabButton>
        <TabButton active={tab === "history"} onClick={() => setTab("history")}>
          {t.history}
        </TabButton>
      </div>
      <div className="mt-6">
        <div className={tab === "overview" ? "flex flex-col gap-6" : "hidden"}>
          <WorkflowTimeline
            currentStep={currentStep}
            steps={steps}
            categoryContacts={categoryContacts}
            dict={dict}
            onStepClick={handleStepClick}
          />
          {overviewExtra}
        </div>
        <div className={tab === "history" ? "flex flex-col gap-6" : "hidden"}>
          <WorkflowHistoryTab
            workflowId={workflowId}
            steps={steps}
            captured={captured}
            dict={dict}
            jumpToStep={jumpToStep}
          />
          {activityLog}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-teal text-teal"
          : "border-transparent text-ink-soft hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
