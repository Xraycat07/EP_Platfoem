"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { saveAssessmentImage, saveWorkflowDocument, UploadError } from "@/lib/storage";
import {
  upsertAssessment,
  addAssessmentImages,
  deleteAssessmentImage,
  createQuote,
  respondToQuote,
  updateLeadDetails,
} from "@/lib/leads";
import * as engine from "@/lib/workflow/engine";
import type { StepKey } from "@/lib/workflow/types";
import { recordPayment } from "@/lib/deposit";
import { upsertDelivery } from "@/lib/delivery";
import { upsertInstallation } from "@/lib/installation";
import { upsertCoc } from "@/lib/coc";
import { logMaintenance } from "@/lib/maintenance";
import { createTicket, resolveTicket } from "@/lib/after-sales";
import { logReferral, startWorkflowFromReferral } from "@/lib/referrals";

export type FormState = { error?: string } | undefined;

function revalidateWorkflow(workflowId: string) {
  revalidatePath("/workflows");
  revalidatePath(`/workflows/${workflowId}`);
  revalidatePath("/dashboard");
}

async function completeIfCurrent(workflowId: string, stepKey: StepKey, notes: string) {
  const workflow = await prisma.workflowInstance.findUniqueOrThrow({ where: { id: workflowId } });
  if (workflow.currentStep === stepKey) {
    await engine.completeStep(workflowId, stepKey, notes);
  }
}

const notesField = z.string().trim().min(1, { error: "Notes are required to advance this step." });

// ---------- Create workflow ----------

const leadSchema = z.object({
  name: z.string().trim().min(2, { error: "Enter the client's name." }),
  phone: z.string().trim().min(6, { error: "Enter a contact number." }),
  email: z.string().trim().email({ error: "Enter a valid email address." }).optional(),
  idNumber: z.string().trim().optional(),
  altContactName: z.string().trim().optional(),
  altContactPhone: z.string().trim().optional(),
  suburb: z.string().trim().min(2, { error: "Enter the suburb." }),
  area: z.string().trim().optional(),
  streetAddress: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  province: z.string().trim().optional(),
  monthlyBill: z.coerce.number().int().nonnegative().optional(),
  propertyType: z.string().trim().optional(),
  hasExistingSolar: z.coerce.boolean().optional(),
  objective: z.string().trim().optional(),
  source: z.string().trim().optional(),
  privyrId: z.string().trim().optional(),
});

export async function createWorkflowAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    idNumber: formData.get("idNumber") || undefined,
    altContactName: formData.get("altContactName") || undefined,
    altContactPhone: formData.get("altContactPhone") || undefined,
    suburb: formData.get("suburb"),
    area: formData.get("area") || undefined,
    streetAddress: formData.get("streetAddress") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    province: formData.get("province") || undefined,
    monthlyBill: formData.get("monthlyBill") || undefined,
    propertyType: formData.get("propertyType") || undefined,
    hasExistingSolar: formData.get("hasExistingSolar") === "on",
    objective: formData.get("objective") || undefined,
    source: formData.get("source") || undefined,
    privyrId: formData.get("privyrId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const workflow = await engine.createWorkflow({
    ...parsed.data,
    hasExistingSolar: parsed.data.hasExistingSolar ?? false,
  });

  revalidatePath("/workflows");
  revalidatePath("/dashboard");
  redirect(`/workflows/${workflow.id}`);
}

// ---------- Edit lead details ----------

const leadDetailsSchema = z.object({
  name: z.string().trim().min(2, { error: "Enter the client's name." }),
  phone: z.string().trim().min(6, { error: "Enter a contact number." }),
  email: z.string().trim().email({ error: "Enter a valid email address." }).optional().or(z.literal("")),
  idNumber: z.string().trim().optional(),
  altContactName: z.string().trim().optional(),
  altContactPhone: z.string().trim().optional(),
  suburb: z.string().trim().min(2, { error: "Enter the suburb." }),
  area: z.string().trim().optional(),
  streetAddress: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  province: z.string().trim().optional(),
});

export type LeadDetailsState = { error?: string; success?: boolean } | undefined;

export async function updateLeadDetailsAction(
  leadId: string,
  workflowId: string,
  _prevState: LeadDetailsState,
  formData: FormData
): Promise<LeadDetailsState> {
  await requireUser();
  const parsed = leadDetailsSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    idNumber: formData.get("idNumber") || undefined,
    altContactName: formData.get("altContactName") || undefined,
    altContactPhone: formData.get("altContactPhone") || undefined,
    suburb: formData.get("suburb"),
    area: formData.get("area") || undefined,
    streetAddress: formData.get("streetAddress") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    province: formData.get("province") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the client details." };
  }

  const { email, ...rest } = parsed.data;
  await updateLeadDetails(leadId, { ...rest, email: email || null });
  revalidateWorkflow(workflowId);
  return { success: true };
}

// ---------- Transition actions ----------

export async function completeStepAction(workflowId: string, stepKey: StepKey, comment: string) {
  if (!comment.trim()) throw new Error("Add a comment before advancing this step.");
  await engine.completeStep(workflowId, stepKey, comment.trim());
  revalidateWorkflow(workflowId);
}

export async function returnToStepAction(workflowId: string, stepKey: StepKey, comment: string) {
  if (!comment.trim()) throw new Error("Add a comment explaining why you're returning to this step.");
  await engine.returnToStep(workflowId, stepKey, comment.trim());
  revalidateWorkflow(workflowId);
}

export async function holdAction(workflowId: string, comment?: string) {
  await engine.holdWorkflow(workflowId, comment);
  revalidateWorkflow(workflowId);
}

export async function resumeAction(workflowId: string, comment?: string) {
  await engine.resumeWorkflow(workflowId, comment);
  revalidateWorkflow(workflowId);
}

export async function cancelAction(workflowId: string, reason?: string) {
  await engine.cancelWorkflow(workflowId, reason);
  revalidateWorkflow(workflowId);
}

export async function acceptQuoteManualAction(workflowId: string, token: string, comment: string) {
  if (!comment.trim()) throw new Error("Add a comment before marking this quote accepted.");
  await requireUser();
  await respondToQuote(token, "ACCEPTED", comment.trim());
  revalidateWorkflow(workflowId);
}

// ---------- Assessment ----------

const assessmentSchema = z.object({
  scheduledFor: z.string().optional(),
  eskomSupply: z.string().trim().optional(),
  dbBoard: z.string().trim().optional(),
  roofType: z.string().trim().optional(),
  roofOrientation: z.string().trim().optional(),
  availablePanelSpace: z.string().trim().optional(),
  existingElectrical: z.string().trim().optional(),
  essentialLoads: z.string().trim().optional(),
  backupRequirements: z.string().trim().optional(),
  recommendedInverterKva: z.coerce.number().positive().optional(),
  recommendedBatteryKwh: z.coerce.number().positive().optional(),
  recommendedPanelKw: z.coerce.number().positive().optional(),
  futureExpansion: z.string().trim().optional(),
  notes: notesField,
});

export async function saveAssessmentAction(
  workflowId: string,
  leadId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = assessmentSchema.safeParse({
    scheduledFor: raw.scheduledFor || undefined,
    eskomSupply: raw.eskomSupply || undefined,
    dbBoard: raw.dbBoard || undefined,
    roofType: raw.roofType || undefined,
    roofOrientation: raw.roofOrientation || undefined,
    availablePanelSpace: raw.availablePanelSpace || undefined,
    existingElectrical: raw.existingElectrical || undefined,
    essentialLoads: raw.essentialLoads || undefined,
    backupRequirements: raw.backupRequirements || undefined,
    recommendedInverterKva: raw.recommendedInverterKva || undefined,
    recommendedBatteryKwh: raw.recommendedBatteryKwh || undefined,
    recommendedPanelKw: raw.recommendedPanelKw || undefined,
    futureExpansion: raw.futureExpansion || undefined,
    notes: raw.notes || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the assessment fields." };
  }

  const { scheduledFor, ...rest } = parsed.data;
  await upsertAssessment(leadId, {
    ...rest,
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
  });
  await completeIfCurrent(workflowId, "ASSESSMENT", parsed.data.notes);
  revalidateWorkflow(workflowId);
}

export async function uploadAssessmentImagesAction(
  assessmentId: string,
  workflowId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Choose at least one photo." };

  const saved: { url: string }[] = [];
  for (const file of files) {
    try {
      saved.push(await saveAssessmentImage(assessmentId, file));
    } catch (e) {
      if (e instanceof UploadError) return { error: e.message };
      throw e;
    }
  }

  await addAssessmentImages(assessmentId, saved);
  revalidatePath(`/workflows/${workflowId}`);
  return { error: undefined };
}

export async function deleteAssessmentImageAction(imageId: string, workflowId: string) {
  await requireUser();
  await deleteAssessmentImage(imageId);
  revalidatePath(`/workflows/${workflowId}`);
}

// ---------- Quotation ----------

const tierSchema = z.object({
  name: z.string().trim().min(1),
  tagline: z.string().trim().optional(),
  panelKw: z.coerce.number().positive(),
  inverterKva: z.coerce.number().positive(),
  batteryKwh: z.coerce.number().positive(),
  estMonthlyProductionKwh: z.coerce.number().nonnegative().optional(),
  backupDescription: z.string().trim().optional(),
  price: z.coerce.number().int().positive(),
  warrantyYears: z.coerce.number().int().nonnegative().optional(),
  isRecommended: z.boolean().optional(),
});

export async function createQuoteAction(
  workflowId: string,
  leadId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const notesParsed = notesField.safeParse(formData.get("notes"));
  if (!notesParsed.success) {
    return { error: notesParsed.error.issues[0]?.message ?? "Notes are required to send this quote." };
  }

  const tierNames = ["essential", "independence", "premium"] as const;
  const tiers = [];

  for (const [index, key] of tierNames.entries()) {
    const price = formData.get(`${key}-price`);
    if (!price) continue;

    const parsed = tierSchema.safeParse({
      name: formData.get(`${key}-name`),
      tagline: formData.get(`${key}-tagline`) || undefined,
      panelKw: formData.get(`${key}-panelKw`),
      inverterKva: formData.get(`${key}-inverterKva`),
      batteryKwh: formData.get(`${key}-batteryKwh`),
      estMonthlyProductionKwh: formData.get(`${key}-production`) || undefined,
      backupDescription: formData.get(`${key}-backup`) || undefined,
      price,
      warrantyYears: formData.get(`${key}-warranty`) || undefined,
      isRecommended: formData.get("recommended") === key,
    });

    if (!parsed.success) {
      return {
        error: `Check the ${key} tier: ${parsed.error.issues[0]?.message ?? "invalid value"}`,
      };
    }
    tiers.push({ ...parsed.data, sortOrder: index + 1 });
  }

  if (tiers.length === 0) return { error: "Fill in at least one package tier." };

  await createQuote(leadId, tiers);
  await completeIfCurrent(workflowId, "QUOTATION", notesParsed.data);
  revalidateWorkflow(workflowId);
  redirect(`/workflows/${workflowId}`);
}

// ---------- Deposit ----------

const depositSchema = z.object({
  amount: z.coerce.number().int().positive(),
  reference: z.string().trim().optional(),
  paidAt: z.string().optional(),
  notes: notesField,
});

export async function recordDepositAction(
  workflowId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const parsed = depositSchema.safeParse({
    amount: formData.get("amount"),
    reference: formData.get("reference") || undefined,
    paidAt: formData.get("paidAt") || undefined,
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the deposit fields." };
  }
  const { paidAt, notes, ...rest } = parsed.data;
  await recordPayment(workflowId, {
    type: "DEPOSIT",
    ...rest,
    paidAt: paidAt ? new Date(paidAt) : new Date(),
  });
  await completeIfCurrent(workflowId, "DEPOSIT", notes);
  revalidateWorkflow(workflowId);
}

// ---------- Delivery ----------

const deliverySchema = z.object({
  scheduledFor: z.string().optional(),
  deliveredAt: z.string().optional(),
  items: z.string().trim().optional(),
  notes: notesField,
});

export async function saveDeliveryAction(
  workflowId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const parsed = deliverySchema.safeParse({
    scheduledFor: formData.get("scheduledFor") || undefined,
    deliveredAt: formData.get("deliveredAt") || undefined,
    items: formData.get("items") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the delivery fields." };
  }
  const { scheduledFor, deliveredAt, ...rest } = parsed.data;
  await upsertDelivery(workflowId, {
    ...rest,
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    deliveredAt: deliveredAt ? new Date(deliveredAt) : null,
  });
  await completeIfCurrent(workflowId, "DELIVERY", parsed.data.notes);
  revalidateWorkflow(workflowId);
}

// ---------- Installation ----------

const installationSchema = z.object({
  scheduledFor: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  installedById: z.string().trim().optional(),
  notes: notesField,
});

export async function saveInstallationAction(
  workflowId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const parsed = installationSchema.safeParse({
    scheduledFor: formData.get("scheduledFor") || undefined,
    startedAt: formData.get("startedAt") || undefined,
    completedAt: formData.get("completedAt") || undefined,
    installedById: formData.get("installedById") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the installation fields." };
  }
  const { scheduledFor, startedAt, completedAt, ...rest } = parsed.data;
  await upsertInstallation(workflowId, {
    ...rest,
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    startedAt: startedAt ? new Date(startedAt) : null,
    completedAt: completedAt ? new Date(completedAt) : null,
  });
  await completeIfCurrent(workflowId, "INSTALLATION", parsed.data.notes);
  revalidateWorkflow(workflowId);
}

// ---------- COC ----------

const cocSchema = z.object({
  certificateNo: z.string().trim().optional(),
  issuedAt: z.string().optional(),
  issuedBy: z.string().trim().optional(),
  notes: notesField,
});

export async function saveCocAction(
  workflowId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const parsed = cocSchema.safeParse({
    certificateNo: formData.get("certificateNo") || undefined,
    issuedAt: formData.get("issuedAt") || undefined,
    issuedBy: formData.get("issuedBy") || undefined,
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the COC fields." };
  }
  const { issuedAt, notes, ...rest } = parsed.data;
  await upsertCoc(workflowId, { ...rest, issuedAt: issuedAt ? new Date(issuedAt) : null });
  await completeIfCurrent(workflowId, "COC", notes);
  revalidateWorkflow(workflowId);
}

// ---------- Maintenance ----------

const maintenanceSchema = z.object({
  planType: z.string().trim().optional(),
  scheduledFor: z.string().optional(),
  performedAt: z.string().optional(),
  notes: notesField,
});

export async function logMaintenanceAction(
  workflowId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const parsed = maintenanceSchema.safeParse({
    planType: formData.get("planType") || undefined,
    scheduledFor: formData.get("scheduledFor") || undefined,
    performedAt: formData.get("performedAt") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the maintenance fields." };
  }
  const { scheduledFor, performedAt, ...rest } = parsed.data;
  await logMaintenance(workflowId, {
    ...rest,
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    performedAt: performedAt ? new Date(performedAt) : null,
  });
  await completeIfCurrent(workflowId, "MAINTENANCE_SETUP", parsed.data.notes);
  revalidateWorkflow(workflowId);
}

// ---------- After-sales ----------

const ticketSchema = z.object({
  subject: z.string().trim().min(2, { error: "Describe the issue." }),
  notes: notesField,
});

export async function createTicketAction(
  workflowId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const parsed = ticketSchema.safeParse({
    subject: formData.get("subject"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the ticket fields." };
  }
  await createTicket(workflowId, parsed.data);
  await completeIfCurrent(workflowId, "AFTER_SALES", parsed.data.notes);
  revalidateWorkflow(workflowId);
}

export async function resolveTicketAction(ticketId: string, workflowId: string) {
  await requireUser();
  await resolveTicket(ticketId);
  revalidateWorkflow(workflowId);
}

// ---------- Referrals ----------

const referralSchema = z.object({
  contactName: z.string().trim().min(2, { error: "Enter the referral's name." }),
  contactPhone: z.string().trim().optional(),
  notes: notesField,
});

export async function logReferralAction(
  workflowId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const parsed = referralSchema.safeParse({
    contactName: formData.get("contactName"),
    contactPhone: formData.get("contactPhone") || undefined,
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the referral fields." };
  }
  await logReferral(workflowId, parsed.data);
  await completeIfCurrent(workflowId, "REFERRALS", parsed.data.notes);
  revalidateWorkflow(workflowId);
}

const convertReferralSchema = z.object({
  suburb: z.string().trim().min(2, { error: "Enter the suburb." }),
  area: z.string().trim().optional(),
  monthlyBill: z.coerce.number().int().nonnegative().optional(),
  propertyType: z.string().trim().optional(),
  hasExistingSolar: z.coerce.boolean().optional(),
  objective: z.string().trim().optional(),
});

export async function startWorkflowFromReferralAction(
  referralId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const parsed = convertReferralSchema.safeParse({
    suburb: formData.get("suburb"),
    area: formData.get("area") || undefined,
    monthlyBill: formData.get("monthlyBill") || undefined,
    propertyType: formData.get("propertyType") || undefined,
    hasExistingSolar: formData.get("hasExistingSolar") === "on",
    objective: formData.get("objective") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const workflow = await startWorkflowFromReferral(referralId, {
    ...parsed.data,
    hasExistingSolar: parsed.data.hasExistingSolar ?? false,
  });
  revalidatePath("/workflows");
  revalidatePath("/dashboard");
  redirect(`/workflows/${workflow.id}`);
}

// ---------- Documents ----------

export async function uploadWorkflowDocumentAction(
  workflowId: string,
  stepKey: StepKey | null,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();
  const files = formData.getAll("documents").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Choose at least one file." };

  for (const file of files) {
    try {
      const { url } = await saveWorkflowDocument(workflowId, file);
      await prisma.workflowDocument.create({ data: { workflowId, stepKey: stepKey ?? undefined, url } });
    } catch (e) {
      if (e instanceof UploadError) return { error: e.message };
      throw e;
    }
  }

  revalidatePath(`/workflows/${workflowId}`);
  return { error: undefined };
}

export async function deleteWorkflowDocumentAction(documentId: string, workflowId: string) {
  await requireUser();
  await prisma.workflowDocument.delete({ where: { id: documentId } });
  revalidatePath(`/workflows/${workflowId}`);
}
