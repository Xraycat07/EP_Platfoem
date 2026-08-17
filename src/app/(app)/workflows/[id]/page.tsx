import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getWorkflow, buildActivityLog } from "@/lib/workflow/engine";
import { getCategoryContacts } from "@/lib/category-contacts";
import { getDictionary } from "@/lib/i18n/get-locale";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groupKeyForStep } from "@/lib/workflow/definition";
import type { WorkflowStatus } from "@/lib/workflow/types";
import { WorkflowActions } from "./workflow-actions";
import { LeadDetailsForm } from "./lead-details-form";
import { WorkflowDetailBody } from "./workflow-detail-body";
import { AssessmentForm } from "./assessment-form";
import { ImageUploader } from "./image-uploader";
import { QuoteCard } from "./quote-card";
import { AcceptancePanel } from "./acceptance-panel";
import { DepositForm } from "./deposit-form";
import { DeliveryForm } from "./delivery-form";
import { InstallationForm } from "./installation-form";
import { CocForm } from "./coc-form";
import { MaintenanceForm } from "./maintenance-form";
import { AfterSalesPanel } from "./after-sales-panel";
import { ReferralPanel } from "./referral-panel";
import { DocumentGallery } from "./document-gallery";
import { CompleteStepButton } from "./complete-step-button";
import { ActivityLog } from "./activity-log";
import { BackLink } from "@/components/back-link";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-teal-soft text-teal",
  ON_HOLD: "bg-amber-soft text-amber",
  COMPLETED: "bg-surface-muted text-ink-soft",
  CANCELLED: "bg-danger-soft text-danger",
};

export default async function WorkflowDetailPage(props: PageProps<"/workflows/[id]">) {
  const { id } = await props.params;
  const workflow = await getWorkflow(id);
  if (!workflow) notFound();

  const [users, categoryContacts, { dict }, session] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getCategoryContacts(),
    getDictionary(),
    auth(),
  ]);
  const t = dict.workflowDetail;

  const myEmail = session?.user?.email?.toLowerCase();
  const currentCategoryKey = groupKeyForStep(workflow.currentStep);
  const myLinkedAccount =
    myEmail && currentCategoryKey
      ? categoryContacts[currentCategoryKey]?.find((u) => u.email.toLowerCase() === myEmail)
      : undefined;
  const currentCategoryLabel = currentCategoryKey
    ? dict.stepGroups[currentCategoryKey as keyof typeof dict.stepGroups]
    : undefined;

  const captured = {
    lead: { source: workflow.lead.source, objective: workflow.lead.objective },
    assessment: workflow.assessment
      ? {
          scheduledFor: workflow.assessment.scheduledFor,
          eskomSupply: workflow.assessment.eskomSupply,
          dbBoard: workflow.assessment.dbBoard,
          roofType: workflow.assessment.roofType,
          roofOrientation: workflow.assessment.roofOrientation,
          availablePanelSpace: workflow.assessment.availablePanelSpace,
          existingElectrical: workflow.assessment.existingElectrical,
          essentialLoads: workflow.assessment.essentialLoads,
          backupRequirements: workflow.assessment.backupRequirements,
          recommendedInverterKva: workflow.assessment.recommendedInverterKva,
          recommendedBatteryKwh: workflow.assessment.recommendedBatteryKwh,
          recommendedPanelKw: workflow.assessment.recommendedPanelKw,
          futureExpansion: workflow.assessment.futureExpansion,
          imageCount: workflow.assessment.images.length,
        }
      : null,
    quotes: workflow.quotes.map((q) => ({
      id: q.id,
      status: q.status,
      createdAt: q.createdAt,
      tiers: q.tiers.map((tier) => ({ name: tier.name, price: tier.price })),
    })),
    payments: workflow.payments,
    delivery: workflow.delivery,
    installation: workflow.installation,
    coc: workflow.coc,
    maintenance: workflow.maintenance,
    afterSales: workflow.afterSales,
    referrals: workflow.referrals,
  };

  return (
    <div className="flex flex-col gap-8">
      {myLinkedAccount && currentCategoryLabel && (
        <div className="rounded-lg border border-teal bg-teal-soft p-3">
          <p className="text-sm font-medium text-teal">
            {t.youAreTheContact.replace("{category}", currentCategoryLabel)}
            <span className="ml-2 font-mono text-xs">({myLinkedAccount.email})</span>
          </p>
        </div>
      )}
      <div>
        <BackLink href="/workflows" label={t.backToWorkflows} />
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-ink-soft">
              {workflow.lead.area ?? t.workflowFallback}
            </p>
            <h1 className="text-2xl font-bold text-foreground">{workflow.lead.name}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {workflow.lead.phone} · {workflow.lead.suburb}
              {workflow.assignedTo ? ` · ${workflow.assignedTo.name}` : ""}
            </p>
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[workflow.status] ?? ""}`}
            >
              {dict.statusLabels[workflow.status as WorkflowStatus]}
            </span>
          </div>
          <WorkflowActions workflowId={workflow.id} status={workflow.status} dict={t} />
        </div>
      </div>

      <WorkflowDetailBody
        workflowId={workflow.id}
        currentStep={workflow.currentStep}
        steps={workflow.steps}
        categoryContacts={categoryContacts}
        captured={captured}
        dict={dict}
        overviewExtra={
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 lg:col-span-1">
                <h2 className="text-sm font-semibold text-foreground">{t.leadDetails}</h2>
                <dl className="flex flex-col gap-3 text-sm">
                  <Row
                    label={t.monthlyBill}
                    value={
                      workflow.lead.monthlyBill ? `R${workflow.lead.monthlyBill.toLocaleString("en-ZA")}` : "—"
                    }
                  />
                  <Row label={t.propertyType} value={workflow.lead.propertyType ?? "—"} />
                  <Row label={t.existingSolar} value={workflow.lead.hasExistingSolar ? t.yes : t.no} />
                  <Row label={t.objective} value={workflow.lead.objective ?? "—"} />
                  <Row label={t.source} value={workflow.lead.source ?? "—"} />
                  <Row label={t.currentStep} value={dict.stepLabels[workflow.currentStep]} />
                </dl>

                <div className="border-t border-line pt-4">
                  <LeadDetailsForm lead={workflow.lead} workflowId={workflow.id} dict={t} />
                </div>

                <div className="border-t border-line pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t.documents}</h3>
                  <div className="mt-2">
                    <DocumentGallery
                      workflowId={workflow.id}
                      stepKey={workflow.currentStep}
                      documents={workflow.documents}
                      dict={t}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 lg:col-span-2">
                <section className="rounded-lg border border-line bg-surface p-5">
                  <h2 className="text-sm font-semibold text-foreground">{dict.stepLabels[workflow.currentStep]}</h2>

                  <div className="mt-4">
                    {workflow.currentStep === "LEAD_RECEIVED" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm text-ink-soft">{t.confirmEnquiry}</p>
                        <CompleteStepButton
                          workflowId={workflow.id}
                          stepKey="LEAD_RECEIVED"
                          label={t.confirmAndAdvance}
                          dict={t}
                        />
                      </div>
                    )}

                    {workflow.currentStep === "ASSESSMENT" && (
                      <div className="flex flex-col gap-6">
                        <AssessmentForm
                          workflowId={workflow.id}
                          leadId={workflow.leadId}
                          assessment={workflow.assessment}
                        />
                        {workflow.assessment && (
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                              {t.sitePhotos}
                            </h3>
                            <div className="mt-2">
                              <ImageUploader
                                workflowId={workflow.id}
                                assessmentId={workflow.assessment.id}
                                images={workflow.assessment.images}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {workflow.currentStep === "QUOTATION" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm text-ink-soft">{t.buildQuoteInstructions}</p>
                        <Link
                          href={`/workflows/${workflow.id}/quote/new`}
                          className="w-fit rounded-md bg-amber px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                          {workflow.quotes.length === 0 ? t.buildAQuote : t.addAnotherQuote}
                        </Link>
                      </div>
                    )}

                    {workflow.currentStep === "ACCEPTANCE" && (
                      <AcceptancePanel workflowId={workflow.id} quotes={workflow.quotes} />
                    )}

                    {workflow.currentStep === "DEPOSIT" && <DepositForm workflowId={workflow.id} />}

                    {workflow.currentStep === "DELIVERY" && (
                      <DeliveryForm workflowId={workflow.id} delivery={workflow.delivery} />
                    )}

                    {workflow.currentStep === "INSTALLATION" && (
                      <InstallationForm workflowId={workflow.id} installation={workflow.installation} users={users} />
                    )}

                    {workflow.currentStep === "COC" && <CocForm workflowId={workflow.id} coc={workflow.coc} />}

                    {workflow.currentStep === "MAINTENANCE_SETUP" && <MaintenanceForm workflowId={workflow.id} />}

                    {workflow.currentStep === "AFTER_SALES" && (
                      <AfterSalesPanel workflowId={workflow.id} tickets={workflow.afterSales} />
                    )}

                    {workflow.currentStep === "REFERRALS" && (
                      <ReferralPanel workflowId={workflow.id} referrals={workflow.referrals} />
                    )}
                  </div>
                </section>

                <section className="rounded-lg border border-line bg-surface p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground">{t.quotes}</h2>
                    <Link
                      href={`/workflows/${workflow.id}/quote/new`}
                      className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-amber hover:text-amber"
                    >
                      {workflow.quotes.length === 0 ? t.buildAQuote : t.newQuote}
                    </Link>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {workflow.quotes.length === 0 && <p className="text-sm text-ink-soft">{t.noQuoteSent}</p>}
                    {workflow.quotes.map((quote) => (
                      <QuoteCard
                        key={quote.id}
                        shareToken={quote.shareToken}
                        status={quote.status}
                        createdAt={new Date(quote.createdAt).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        tierCount={quote.tiers.length}
                        totalFrom={quote.tiers.length ? Math.min(...quote.tiers.map((tier) => tier.price)) : 0}
                      />
                    ))}
                  </div>
                </section>

                {workflow.maintenance.length > 0 && (
                  <section className="rounded-lg border border-line bg-surface p-5">
                    <h2 className="text-sm font-semibold text-foreground">{t.maintenanceHistory}</h2>
                    <div className="mt-4 flex flex-col divide-y divide-line text-sm">
                      {workflow.maintenance.map((m) => (
                        <div key={m.id} className="py-2.5">
                          <p className="font-medium text-foreground">{m.planType ?? t.maintenanceVisit}</p>
                          <p className="text-xs text-ink-soft">
                            {m.performedAt
                              ? `${t.performed} ${new Date(m.performedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`
                              : m.scheduledFor
                                ? `${t.scheduled} ${new Date(m.scheduledFor).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`
                                : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {workflow.payments.length > 0 && (
                  <section className="rounded-lg border border-line bg-surface p-5">
                    <h2 className="text-sm font-semibold text-foreground">{t.payments}</h2>
                    <div className="mt-4 flex flex-col divide-y divide-line text-sm">
                      {workflow.payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-2.5">
                          <span className="text-foreground">{p.type}</span>
                          <span className="font-mono tabular-nums text-foreground">
                            R{p.amount.toLocaleString("en-ZA")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </>
        }
        activityLog={<ActivityLog entries={buildActivityLog(workflow)} dict={t} />}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
