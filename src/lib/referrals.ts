import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { createWorkflow } from "@/lib/workflow/engine";

export async function logReferral(
  workflowId: string,
  data: { contactName: string; contactPhone?: string; notes?: string }
) {
  await requireUser();
  return prisma.referral.create({ data: { workflowId, ...data } });
}

export async function startWorkflowFromReferral(
  referralId: string,
  data: {
    suburb: string;
    area?: string;
    monthlyBill?: number;
    propertyType?: string;
    hasExistingSolar: boolean;
    objective?: string;
  }
) {
  await requireUser();
  const referral = await prisma.referral.findUniqueOrThrow({
    where: { id: referralId },
    include: { workflow: { include: { lead: { select: { name: true } } } } },
  });
  const workflow = await createWorkflow({
    name: referral.contactName,
    phone: referral.contactPhone ?? "",
    suburb: data.suburb,
    area: data.area,
    monthlyBill: data.monthlyBill,
    propertyType: data.propertyType,
    hasExistingSolar: data.hasExistingSolar,
    objective: data.objective,
    source: `Referral from ${referral.workflow.lead.name}`,
  });
  await prisma.referral.update({
    where: { id: referralId },
    data: { referredLeadId: workflow.leadId },
  });
  return workflow;
}
