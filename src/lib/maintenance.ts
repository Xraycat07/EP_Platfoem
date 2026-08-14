import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function logMaintenance(
  workflowId: string,
  data: { planType?: string; scheduledFor?: Date | null; performedAt?: Date | null; notes?: string }
) {
  await requireUser();
  return prisma.maintenanceRecord.create({ data: { workflowId, ...data } });
}
