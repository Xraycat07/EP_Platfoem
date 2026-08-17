import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { STEP_KEYS, STEP_LABELS, type StepKey } from "./types";
import { nextStep, canReturnTo, STEP_ORDER, STEP_GROUPS, groupKeyForStep } from "./definition";
import { sendEmail } from "@/lib/email";

export {
  STEP_KEYS,
  STEP_LABELS,
  WORKFLOW_STATUSES,
  WORKFLOW_STATUS_LABELS,
  type StepKey,
  type WorkflowStatus,
  type StepStatus,
} from "./types";
export { STEP_ORDER, nextStep, canReturnTo, stepIndex } from "./definition";

const WORKFLOW_INCLUDE = {
  lead: true,
  assignedTo: { select: { id: true, name: true } },
  steps: {
    orderBy: { createdAt: "asc" as const },
    include: { completedBy: { select: { name: true, email: true } } },
  },
  documents: { orderBy: { createdAt: "desc" as const } },
  payments: { orderBy: { createdAt: "desc" as const } },
  delivery: true,
  installation: { include: { installedBy: { select: { name: true, email: true } } } },
  coc: true,
  maintenance: { orderBy: { createdAt: "desc" as const } },
  afterSales: { orderBy: { raisedAt: "desc" as const } },
  referrals: {
    orderBy: { createdAt: "desc" as const },
    include: { referredLead: { select: { id: true, name: true } } },
  },
  events: {
    orderBy: { createdAt: "desc" as const },
    include: { actor: { select: { name: true, email: true } } },
  },
};

async function fetchWorkflowData(id: string) {
  const workflow = await prisma.workflowInstance.findUnique({
    where: { id },
    include: WORKFLOW_INCLUDE,
  });
  if (!workflow) return null;

  const [assessment, quotes] = await Promise.all([
    prisma.assessment.findUnique({
      where: { leadId: workflow.leadId },
      include: { images: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.quote.findMany({
      where: { leadId: workflow.leadId },
      orderBy: { createdAt: "desc" },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  return { ...workflow, assessment, quotes };
}

export async function getWorkflow(id: string) {
  await requireUser();
  return fetchWorkflowData(id);
}

export async function listWorkflows(filter?: {
  status?: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  statusIn?: readonly ("ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED")[];
  currentStep?: StepKey;
  currentStepIn?: readonly StepKey[];
}) {
  await requireUser();
  return prisma.workflowInstance.findMany({
    where: {
      ...(filter?.status
        ? { status: filter.status }
        : filter?.statusIn
          ? { status: { in: [...filter.statusIn] } }
          : {}),
      ...(filter?.currentStep
        ? { currentStep: filter.currentStep }
        : filter?.currentStepIn
          ? { currentStep: { in: [...filter.currentStepIn] } }
          : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      lead: { select: { id: true, name: true, phone: true, suburb: true, area: true } },
      assignedTo: { select: { name: true, email: true } },
      steps: { select: { stepKey: true, status: true } },
    },
  });
}

export function progressPercent(workflow: { steps: { status: string }[] }) {
  const completed = workflow.steps.filter((s) => s.status === "COMPLETED").length;
  return Math.round((completed / STEP_ORDER.length) * 100);
}

export type ActivityEntry = {
  at: Date;
  title: string;
  actorName?: string;
  actorEmail?: string;
  comment?: string;
};

export function buildActivityLog(workflow: NonNullable<Awaited<ReturnType<typeof getWorkflow>>>): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const event of workflow.events) {
    entries.push({
      at: event.createdAt,
      title: event.message,
      actorName: event.actor?.name,
      actorEmail: event.actor?.email,
      comment: event.comment ?? undefined,
    });
  }

  for (const step of workflow.steps) {
    if (step.completedAt) {
      entries.push({
        at: step.completedAt,
        title: `${STEP_LABELS[step.stepKey as StepKey]} completed`,
        actorName: step.completedBy?.name,
        actorEmail: step.completedBy?.email,
        comment: step.notes ?? undefined,
      });
    }
  }

  for (const quote of workflow.quotes) {
    if (quote.sentAt) {
      entries.push({
        at: quote.sentAt,
        title: `Quote sent — ${quote.tiers.length} option${quote.tiers.length === 1 ? "" : "s"}`,
      });
    }
    if (quote.respondedAt) {
      entries.push({
        at: quote.respondedAt,
        title: `Quote ${quote.status === "ACCEPTED" ? "accepted" : "declined"} by client`,
      });
    }
  }

  for (const payment of workflow.payments) {
    entries.push({
      at: payment.paidAt ?? payment.createdAt,
      title: `${payment.type} payment — R${payment.amount.toLocaleString("en-ZA")}`,
      comment: payment.reference ?? undefined,
    });
  }

  if (workflow.delivery) {
    entries.push({
      at: workflow.delivery.updatedAt,
      title: workflow.delivery.deliveredAt ? "Delivery recorded as delivered" : "Delivery details updated",
      comment: workflow.delivery.notes ?? workflow.delivery.items ?? undefined,
    });
  }

  if (workflow.installation) {
    entries.push({
      at: workflow.installation.updatedAt,
      title: workflow.installation.completedAt ? "Installation recorded as complete" : "Installation details updated",
      actorName: workflow.installation.installedBy?.name,
      actorEmail: workflow.installation.installedBy?.email,
      comment: workflow.installation.notes ?? undefined,
    });
  }

  if (workflow.coc) {
    entries.push({
      at: workflow.coc.createdAt,
      title: `COC recorded${workflow.coc.certificateNo ? ` — ${workflow.coc.certificateNo}` : ""}`,
    });
  }

  for (const record of workflow.maintenance) {
    entries.push({
      at: record.performedAt ?? record.createdAt,
      title: `Maintenance — ${record.planType ?? "visit logged"}`,
      comment: record.notes ?? undefined,
    });
  }

  for (const ticket of workflow.afterSales) {
    entries.push({ at: ticket.raisedAt, title: `Ticket raised — ${ticket.subject}`, comment: ticket.notes ?? undefined });
    if (ticket.resolvedAt) {
      entries.push({ at: ticket.resolvedAt, title: `Ticket resolved — ${ticket.subject}` });
    }
  }

  for (const referral of workflow.referrals) {
    entries.push({
      at: referral.createdAt,
      title: `Referral logged — ${referral.contactName}`,
      comment: referral.notes ?? undefined,
    });
  }

  for (const doc of workflow.documents) {
    entries.push({
      at: doc.createdAt,
      title: `Document uploaded${doc.stepKey ? ` (${STEP_LABELS[doc.stepKey as StepKey]})` : ""}`,
      comment: doc.caption ?? undefined,
    });
  }

  return entries.sort((a, b) => b.at.getTime() - a.at.getTime());
}

async function logEvent(params: {
  workflowId: string;
  type: string;
  stepKey?: StepKey;
  message: string;
  comment?: string;
  actorId?: string | null;
}) {
  await prisma.workflowEvent.create({
    data: {
      workflowId: params.workflowId,
      type: params.type,
      stepKey: params.stepKey,
      message: params.message,
      comment: params.comment,
      actorId: params.actorId ?? null,
    },
  });
}

function initialSteps() {
  return STEP_KEYS.map((stepKey) => ({
    stepKey,
    status: stepKey === "LEAD_RECEIVED" ? ("IN_PROGRESS" as const) : ("PENDING" as const),
    startedAt: stepKey === "LEAD_RECEIVED" ? new Date() : null,
  }));
}

export async function createWorkflow(data: {
  name: string;
  phone: string;
  email?: string;
  idNumber?: string;
  altContactName?: string;
  altContactPhone?: string;
  suburb: string;
  area?: string;
  streetAddress?: string;
  postalCode?: string;
  province?: string;
  monthlyBill?: number;
  propertyType?: string;
  hasExistingSolar: boolean;
  objective?: string;
  source?: string;
  privyrId?: string;
}) {
  const user = await requireUser();
  const { privyrId, ...leadData } = data;
  const lead = await prisma.lead.create({
    data: {
      ...leadData,
      assignedRepId: user.id,
      workflow: {
        create: {
          privyrId,
          assignedToId: user.id,
          steps: { create: initialSteps() },
        },
      },
    },
    include: { workflow: true },
  });
  return lead.workflow!;
}

// When a workflow crosses into a new category, hand it to that category's
// contact — e.g. a job moving from Lead & Assessment into Sales gets
// reassigned to whoever is set up as the Sales contact. If a category has
// several linked accounts, the earliest-linked one is used as the primary.
async function assignCategoryRep(workflowId: string, leadId: string, categoryKey: string) {
  const contact = await prisma.categoryContact.findUnique({
    where: { key: categoryKey },
    include: { recipients: { orderBy: { createdAt: "asc" }, take: 1, select: { userId: true } } },
  });
  const repId = contact?.recipients[0]?.userId;
  if (!repId) return;

  await prisma.workflowInstance.update({ where: { id: workflowId }, data: { assignedToId: repId } });
  await prisma.lead.update({ where: { id: leadId }, data: { assignedRepId: repId } });
}

async function applyCompleteStep(
  workflowId: string,
  stepKey: StepKey,
  notes: string | undefined,
  completedById: string | null
) {
  const workflow = await prisma.workflowInstance.findUniqueOrThrow({ where: { id: workflowId } });
  if (workflow.currentStep !== stepKey) {
    throw new Error(`Cannot complete ${stepKey}: current step is ${workflow.currentStep}`);
  }

  await prisma.workflowStepInstance.update({
    where: { workflowId_stepKey: { workflowId, stepKey } },
    data: { status: "COMPLETED", completedAt: new Date(), completedById, notes },
  });

  const next = nextStep(stepKey);
  if (next) {
    await prisma.workflowStepInstance.update({
      where: { workflowId_stepKey: { workflowId, stepKey: next } },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
    await prisma.workflowInstance.update({
      where: { id: workflowId },
      data: { currentStep: next },
    });

    const finishedGroup = groupKeyForStep(stepKey);
    const nextGroup = groupKeyForStep(next);
    if (finishedGroup !== nextGroup && nextGroup) {
      // Never let a reassignment or notification failure break the actual step transition.
      try {
        await assignCategoryRep(workflowId, workflow.leadId, nextGroup);
      } catch (err) {
        console.error(`[assign] Failed to reassign rep for ${workflowId} into ${nextGroup}:`, err);
      }
      try {
        await notifyCategoryEmail(workflowId, next);
      } catch (err) {
        console.error(`[email] Failed to build/send category notification for ${workflowId}:`, err);
      }
    }
  } else {
    await prisma.workflowInstance.update({
      where: { id: workflowId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }
}

function fmtDate(date: Date) {
  return new Date(date).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function notifyCategoryEmail(workflowId: string, next: StepKey) {
  const group = STEP_GROUPS.find((g) => g.steps.includes(next));
  if (!group) return;

  const contact = await prisma.categoryContact.findUnique({
    where: { key: group.key },
    include: { recipients: { include: { user: { select: { email: true } } } } },
  });
  const recipientEmails = contact?.recipients.map((r) => r.user.email) ?? [];
  if (recipientEmails.length === 0) return;

  const data = await fetchWorkflowData(workflowId);
  if (!data) return;

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const { lead } = data;

  const clientInfo = [
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Suburb: ${lead.suburb}${lead.area ? ` (${lead.area})` : ""}`,
    lead.monthlyBill ? `Monthly bill: R${lead.monthlyBill.toLocaleString("en-ZA")}` : null,
    lead.propertyType ? `Property type: ${lead.propertyType}` : null,
    `Existing solar: ${lead.hasExistingSolar ? "Yes" : "No"}`,
    lead.objective ? `Objective: ${lead.objective}` : null,
    lead.source ? `Source: ${lead.source}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const auditTrail = buildActivityLog(data)
    .map((e) => {
      const who = e.actorName ? ` — ${e.actorName}${e.actorEmail ? ` (${e.actorEmail})` : ""}` : "";
      const comment = e.comment ? `\n    "${e.comment}"` : "";
      return `[${fmtDate(e.at)}] ${e.title}${who}${comment}`;
    })
    .join("\n");

  const documentLinks = [
    ...data.documents.map((d) => `${d.caption ?? "Document"}: ${baseUrl}${d.url}`),
    ...(data.assessment?.images.map((img) => `${img.caption ?? "Assessment photo"}: ${baseUrl}${img.url}`) ?? []),
  ];

  await sendEmail({
    to: recipientEmails.join(", "),
    subject: `${lead.name} moved into ${group.label}`,
    text: [
      `${lead.name} (${lead.suburb}${lead.area ? `, ${lead.area}` : ""}) has entered the ${group.label} stage.`,
      `Next step: ${STEP_LABELS[next]}.`,
      `View this job: ${baseUrl}/workflows/${workflowId}`,
      "",
      "--- Client info ---",
      clientInfo,
      "",
      "--- Audit trail ---",
      auditTrail || "No history recorded yet.",
      "",
      "--- Documents ---",
      documentLinks.length > 0 ? documentLinks.join("\n") : "No documents uploaded yet.",
    ].join("\n"),
  });
}

export async function completeStep(workflowId: string, stepKey: StepKey, notes?: string) {
  const user = await requireUser();
  await applyCompleteStep(workflowId, stepKey, notes, user.id);
}

// Used only by the public (unauthenticated) quote-response page when a customer
// accepts a quote directly, advancing the ACCEPTANCE step without a rep session.
export async function completeStepAsSystem(workflowId: string, stepKey: StepKey, notes?: string) {
  await applyCompleteStep(workflowId, stepKey, notes, null);
}

export async function returnToStep(workflowId: string, stepKey: StepKey, comment?: string) {
  const user = await requireUser();
  const workflow = await prisma.workflowInstance.findUniqueOrThrow({ where: { id: workflowId } });
  if (!canReturnTo(workflow.currentStep as StepKey, stepKey)) {
    throw new Error(`Cannot skip forward from ${workflow.currentStep} to ${stepKey}`);
  }

  const targetIndex = STEP_ORDER.indexOf(stepKey);
  const laterSteps = STEP_ORDER.slice(targetIndex + 1);

  await prisma.workflowStepInstance.upsert({
    where: { workflowId_stepKey: { workflowId, stepKey } },
    update: { status: "IN_PROGRESS", completedAt: null },
    create: { workflowId, stepKey, status: "IN_PROGRESS", startedAt: new Date() },
  });
  // Steps after the one we're rewinding to are no longer reached — reset them so the
  // timeline and "can't skip forward" check stay consistent with the actual current step.
  if (laterSteps.length > 0) {
    await prisma.workflowStepInstance.updateMany({
      where: { workflowId, stepKey: { in: laterSteps } },
      data: { status: "PENDING", startedAt: null, completedAt: null, completedById: null },
    });
  }
  await prisma.workflowInstance.update({
    where: { id: workflowId },
    data: { currentStep: stepKey, status: "ACTIVE", completedAt: null },
  });

  const fromGroup = groupKeyForStep(workflow.currentStep as StepKey);
  const toGroup = groupKeyForStep(stepKey);
  if (fromGroup !== toGroup && toGroup) {
    try {
      await assignCategoryRep(workflowId, workflow.leadId, toGroup);
    } catch (err) {
      console.error(`[assign] Failed to reassign rep for ${workflowId} into ${toGroup}:`, err);
    }
  }

  await logEvent({
    workflowId,
    type: "STEP_RETURNED",
    stepKey,
    message: `Returned to ${STEP_LABELS[stepKey]}`,
    comment,
    actorId: user.id,
  });
}

export async function holdWorkflow(workflowId: string, comment?: string) {
  const user = await requireUser();
  await prisma.workflowInstance.update({ where: { id: workflowId }, data: { status: "ON_HOLD" } });
  await logEvent({ workflowId, type: "HOLD", message: "Put on hold", comment, actorId: user.id });
}

export async function resumeWorkflow(workflowId: string, comment?: string) {
  const user = await requireUser();
  await prisma.workflowInstance.update({ where: { id: workflowId }, data: { status: "ACTIVE" } });
  await logEvent({ workflowId, type: "RESUME", message: "Resumed", comment, actorId: user.id });
}

export async function cancelWorkflow(workflowId: string, reason?: string) {
  const user = await requireUser();
  await prisma.workflowInstance.update({
    where: { id: workflowId },
    data: {
      status: "CANCELLED",
      completedAt: new Date(),
      metadata: reason ? { cancelReason: reason } : undefined,
    },
  });
  await logEvent({ workflowId, type: "CANCEL", message: "Workflow cancelled", comment: reason, actorId: user.id });
}

export async function getStatusCounts() {
  await requireUser();
  const rows = await prisma.workflowInstance.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = { ACTIVE: 0, ON_HOLD: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const row of rows) {
    counts[row.status as keyof typeof counts] = row._count._all;
  }
  return counts;
}

// A workflow sits at exactly one step at a time, so `positions[step]` is how
// many active/on-hold clients are currently at that step — i.e. where each
// client actually is right now.
//
// `categories[group]` is scoped to that same idea: only clients whose
// currentStep falls inside this category count toward it. A client who has
// already moved on to a later category no longer counts here — with
// multiple clients spread across different categories, each category should
// only reflect the people actually working through it right now.
export async function getPipelineCompletion() {
  await requireUser();
  const positions = Object.fromEntries(STEP_KEYS.map((s) => [s, 0])) as Record<StepKey, number>;
  const categories = Object.fromEntries(STEP_GROUPS.map((g) => [g.key, 0])) as Record<string, number>;

  const workflows = await prisma.workflowInstance.findMany({
    where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
    select: { currentStep: true, steps: { select: { stepKey: true, status: true } } },
  });

  for (const w of workflows) {
    positions[w.currentStep as StepKey] += 1;
  }

  for (const group of STEP_GROUPS) {
    const inCategory = workflows.filter((w) => (group.steps as StepKey[]).includes(w.currentStep as StepKey));
    if (inCategory.length === 0) continue;

    const completedSlots = inCategory.reduce((sum, w) => {
      const completedSteps = new Set(w.steps.filter((s) => s.status === "COMPLETED").map((s) => s.stepKey));
      return sum + group.steps.filter((s) => completedSteps.has(s)).length;
    }, 0);
    categories[group.key] = Math.round((completedSlots / (inCategory.length * group.steps.length)) * 100);
  }
  return { positions, categories };
}
