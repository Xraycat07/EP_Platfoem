"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { returnToStepAction } from "../actions";
import { STEP_ORDER } from "@/lib/workflow/definition";
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

export type CapturedData = {
  lead: { source: string | null; objective: string | null };
  assessment: {
    scheduledFor: Date | null;
    eskomSupply: string | null;
    dbBoard: string | null;
    roofType: string | null;
    roofOrientation: string | null;
    availablePanelSpace: string | null;
    existingElectrical: string | null;
    essentialLoads: string | null;
    backupRequirements: string | null;
    recommendedInverterKva: number | null;
    recommendedBatteryKwh: number | null;
    recommendedPanelKw: number | null;
    futureExpansion: string | null;
    imageCount: number;
  } | null;
  quotes: { id: string; status: string; createdAt: Date; tiers: { name: string; price: number }[] }[];
  payments: { id: string; type: string; amount: number; reference: string | null; paidAt: Date | null }[];
  delivery: { scheduledFor: Date | null; deliveredAt: Date | null; items: string | null } | null;
  installation: {
    scheduledFor: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
    installedBy: { name: string } | null;
  } | null;
  coc: { certificateNo: string | null; issuedAt: Date | null; issuedBy: string | null } | null;
  maintenance: { id: string; planType: string | null; scheduledFor: Date | null }[];
  afterSales: { id: string; subject: string; status: string }[];
  referrals: { id: string; contactName: string; contactPhone: string | null }[];
};

function fmt(date: Date | null) {
  return date
    ? new Date(date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
    : "—";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-ink-soft">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function StepDetails({ stepKey, data }: { stepKey: StepKey; data: CapturedData }) {
  const empty = <p className="text-xs text-ink-soft">Nothing captured at this stage.</p>;

  switch (stepKey) {
    case "LEAD_RECEIVED":
      if (!data.lead.source && !data.lead.objective) return empty;
      return (
        <div className="flex flex-col gap-1.5">
          {data.lead.source && <DetailRow label="Source" value={data.lead.source} />}
          {data.lead.objective && <DetailRow label="Objective" value={data.lead.objective} />}
        </div>
      );

    case "ASSESSMENT": {
      const a = data.assessment;
      if (!a) return empty;
      return (
        <div className="grid gap-1.5 sm:grid-cols-2">
          <DetailRow label="Assessment date" value={fmt(a.scheduledFor)} />
          <DetailRow label="Eskom / municipal supply" value={a.eskomSupply ?? "—"} />
          <DetailRow label="DB board" value={a.dbBoard ?? "—"} />
          <DetailRow label="Roof type" value={a.roofType ?? "—"} />
          <DetailRow label="Roof orientation" value={a.roofOrientation ?? "—"} />
          <DetailRow label="Available panel space" value={a.availablePanelSpace ?? "—"} />
          <DetailRow label="Existing electrical" value={a.existingElectrical ?? "—"} />
          <DetailRow label="Essential loads" value={a.essentialLoads ?? "—"} />
          <DetailRow label="Backup requirements" value={a.backupRequirements ?? "—"} />
          <DetailRow label="Inverter" value={a.recommendedInverterKva ? `${a.recommendedInverterKva} kVA` : "—"} />
          <DetailRow label="Battery" value={a.recommendedBatteryKwh ? `${a.recommendedBatteryKwh} kWh` : "—"} />
          <DetailRow label="Panels" value={a.recommendedPanelKw ? `${a.recommendedPanelKw} kW` : "—"} />
          <DetailRow label="Future expansion" value={a.futureExpansion ?? "—"} />
          <DetailRow label="Site photos" value={String(a.imageCount)} />
        </div>
      );
    }

    case "QUOTATION":
      if (data.quotes.length === 0) return empty;
      return (
        <div className="flex flex-col gap-2">
          {data.quotes.map((q) => (
            <div key={q.id}>
              <DetailRow label={`Quote · ${fmt(q.createdAt)}`} value={q.status} />
              <p className="mt-0.5 text-xs text-ink-soft">
                {q.tiers.map((t) => `${t.name} R${t.price.toLocaleString("en-ZA")}`).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      );

    case "ACCEPTANCE": {
      const accepted = data.quotes.find((q) => q.status === "ACCEPTED");
      if (!accepted) return empty;
      return <DetailRow label="Accepted quote" value={`Sent ${fmt(accepted.createdAt)}`} />;
    }

    case "DEPOSIT": {
      const deposits = data.payments.filter((p) => p.type === "DEPOSIT");
      if (deposits.length === 0) return empty;
      return (
        <div className="flex flex-col gap-2">
          {deposits.map((p) => (
            <div key={p.id} className="grid gap-1.5 sm:grid-cols-3">
              <DetailRow label="Amount" value={`R${p.amount.toLocaleString("en-ZA")}`} />
              <DetailRow label="Paid on" value={fmt(p.paidAt)} />
              <DetailRow label="Reference" value={p.reference ?? "—"} />
            </div>
          ))}
        </div>
      );
    }

    case "DELIVERY": {
      const d = data.delivery;
      if (!d) return empty;
      return (
        <div className="grid gap-1.5 sm:grid-cols-2">
          <DetailRow label="Scheduled for" value={fmt(d.scheduledFor)} />
          <DetailRow label="Delivered on" value={fmt(d.deliveredAt)} />
          <DetailRow label="Items delivered" value={d.items ?? "—"} />
        </div>
      );
    }

    case "INSTALLATION": {
      const i = data.installation;
      if (!i) return empty;
      return (
        <div className="grid gap-1.5 sm:grid-cols-2">
          <DetailRow label="Scheduled for" value={fmt(i.scheduledFor)} />
          <DetailRow label="Started" value={fmt(i.startedAt)} />
          <DetailRow label="Completed" value={fmt(i.completedAt)} />
          <DetailRow label="Installed by" value={i.installedBy?.name ?? "Unassigned"} />
        </div>
      );
    }

    case "COC": {
      const c = data.coc;
      if (!c) return empty;
      return (
        <div className="grid gap-1.5 sm:grid-cols-3">
          <DetailRow label="Certificate no." value={c.certificateNo ?? "—"} />
          <DetailRow label="Issued on" value={fmt(c.issuedAt)} />
          <DetailRow label="Issued by" value={c.issuedBy ?? "—"} />
        </div>
      );
    }

    case "MAINTENANCE_SETUP": {
      const setup = data.maintenance[data.maintenance.length - 1];
      if (!setup) return empty;
      return (
        <div className="grid gap-1.5 sm:grid-cols-2">
          <DetailRow label="Plan type" value={setup.planType ?? "—"} />
          <DetailRow label="Scheduled for" value={fmt(setup.scheduledFor)} />
        </div>
      );
    }

    case "AFTER_SALES":
      if (data.afterSales.length === 0) return empty;
      return (
        <div className="flex flex-col gap-1.5">
          {data.afterSales.map((tk) => (
            <DetailRow key={tk.id} label={tk.subject} value={tk.status} />
          ))}
        </div>
      );

    case "REFERRALS":
      if (data.referrals.length === 0) return empty;
      return (
        <div className="flex flex-col gap-1.5">
          {data.referrals.map((r) => (
            <DetailRow key={r.id} label={r.contactName} value={r.contactPhone ?? "—"} />
          ))}
        </div>
      );

    default:
      return empty;
  }
}

export function WorkflowHistoryTab({
  workflowId,
  steps,
  captured,
  dict,
  jumpToStep,
}: {
  workflowId: string;
  steps: StepRow[];
  captured: CapturedData;
  dict: Dictionary;
  jumpToStep?: { step: StepKey; nonce: number } | null;
}) {
  const t = dict.workflowDetail;
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState<StepKey | null>(null);
  const [expanded, setExpanded] = useState<StepKey | null>(null);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();
  const byKey = Object.fromEntries(steps.map((s) => [s.stepKey, s])) as Record<StepKey, StepRow>;
  const completedSteps = STEP_ORDER.filter((key) => byKey[key]?.status === "COMPLETED");
  const rowRefs = useRef<Partial<Record<StepKey, HTMLDivElement | null>>>({});

  // Expand the target row as soon as a new jump request comes in — this runs
  // during render (React's recommended way to adjust state from a changed
  // prop, storing the previously-seen value in state rather than a ref)
  // instead of an effect, which would cause an extra render pass.
  const [seenJump, setSeenJump] = useState(jumpToStep);
  if (jumpToStep !== seenJump) {
    setSeenJump(jumpToStep);
    if (jumpToStep) setExpanded(jumpToStep.step);
  }

  useEffect(() => {
    if (!jumpToStep) return;
    rowRefs.current[jumpToStep.step]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [jumpToStep]);

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
      <h2 className="text-sm font-semibold text-foreground">{t.history}</h2>
      {completedSteps.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">{t.noStepsCompleted}</p>
      ) : (
        <div className="mt-2 flex flex-col divide-y divide-line">
          {completedSteps.map((key) => {
            const step = byKey[key];
            const isReturning = returning === key;
            const isExpanded = expanded === key;
            return (
              <div key={key} ref={(el) => { rowRefs.current[key] = el; }} className="py-2.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : key)}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-foreground hover:text-teal">
                      <span className="mr-1 inline-block w-3 text-ink-soft">{isExpanded ? "▾" : "▸"}</span>
                      {dict.stepLabels[key]}
                    </p>
                    <p className="ml-4 text-xs text-ink-soft">
                      {t.completed} {fmt(step.completedAt)}
                      {step.completedBy && (
                        <>
                          {" "}
                          {t.completedBy}{" "}
                          <a
                            href={`mailto:${step.completedBy.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-teal hover:underline"
                          >
                            {step.completedBy.name} ({step.completedBy.email})
                          </a>
                        </>
                      )}
                      {step.notes ? ` — ${step.notes}` : ""}
                    </p>
                  </button>
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
                {isExpanded && (
                  <div className="mt-2 ml-4 rounded-md border border-line bg-surface-muted/40 p-3">
                    <StepDetails stepKey={key} data={captured} />
                  </div>
                )}
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
  );
}
