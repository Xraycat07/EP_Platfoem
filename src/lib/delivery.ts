import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function upsertDelivery(
  workflowId: string,
  data: { scheduledFor?: Date | null; deliveredAt?: Date | null; items?: string; notes?: string }
) {
  await requireUser();
  return prisma.delivery.upsert({
    where: { workflowId },
    create: { workflowId, ...data },
    update: data,
  });
}
