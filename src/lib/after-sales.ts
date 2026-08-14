import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function createTicket(workflowId: string, data: { subject: string; notes?: string }) {
  await requireUser();
  return prisma.afterSalesTicket.create({ data: { workflowId, ...data } });
}

export async function resolveTicket(ticketId: string) {
  await requireUser();
  return prisma.afterSalesTicket.update({
    where: { id: ticketId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
}
