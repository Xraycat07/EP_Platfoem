import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { completeStepAsSystem } from "@/lib/workflow/engine";

export async function updateLeadDetails(
  leadId: string,
  data: {
    name?: string;
    phone?: string;
    email?: string | null;
    idNumber?: string | null;
    altContactName?: string | null;
    altContactPhone?: string | null;
    suburb?: string;
    area?: string | null;
    streetAddress?: string | null;
    postalCode?: string | null;
    province?: string | null;
  }
) {
  await requireUser();
  return prisma.lead.update({ where: { id: leadId }, data });
}

export async function upsertAssessment(
  leadId: string,
  data: {
    scheduledFor?: Date | null;
    eskomSupply?: string;
    dbBoard?: string;
    roofType?: string;
    roofOrientation?: string;
    availablePanelSpace?: string;
    existingElectrical?: string;
    essentialLoads?: string;
    backupRequirements?: string;
    recommendedInverterKva?: number;
    recommendedBatteryKwh?: number;
    recommendedPanelKw?: number;
    futureExpansion?: string;
    notes?: string;
  }
) {
  await requireUser();
  return prisma.assessment.upsert({
    where: { leadId },
    create: { leadId, ...data },
    update: data,
  });
}

export async function addAssessmentImages(
  assessmentId: string,
  images: { url: string; caption?: string }[]
) {
  await requireUser();
  return prisma.image.createMany({
    data: images.map((img) => ({ assessmentId, ...img })),
  });
}

export async function deleteAssessmentImage(imageId: string) {
  await requireUser();
  return prisma.image.delete({ where: { id: imageId } });
}

export async function createQuote(
  leadId: string,
  tiers: {
    name: string;
    tagline?: string;
    panelKw: number;
    inverterKva: number;
    batteryKwh: number;
    estMonthlyProductionKwh?: number;
    backupDescription?: string;
    price: number;
    warrantyYears?: number;
    isRecommended?: boolean;
    sortOrder: number;
  }[]
) {
  await requireUser();
  return prisma.quote.create({
    data: {
      leadId,
      status: "SENT",
      sentAt: new Date(),
      tiers: { create: tiers },
    },
  });
}

export async function getQuoteByToken(token: string) {
  return prisma.quote.findUnique({
    where: { shareToken: token },
    include: {
      tiers: { orderBy: { sortOrder: "asc" } },
      lead: { select: { id: true, name: true, suburb: true, workflow: { select: { id: true } } } },
    },
  });
}

export async function respondToQuote(token: string, status: "ACCEPTED" | "DECLINED", notes?: string) {
  const quote = await prisma.quote.update({
    where: { shareToken: token },
    data: { status, respondedAt: new Date() },
    include: { lead: { select: { workflow: { select: { id: true, currentStep: true } } } } },
  });
  const workflow = quote.lead.workflow;
  if (status === "ACCEPTED" && workflow?.currentStep === "ACCEPTANCE") {
    await completeStepAsSystem(workflow.id, "ACCEPTANCE", notes);
  }
  return quote;
}
