import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function recordPayment(
  workflowId: string,
  data: { type: "DEPOSIT" | "FINAL" | "OTHER"; amount: number; reference?: string; paidAt?: Date }
) {
  await requireUser();
  return prisma.payment.create({ data: { workflowId, ...data } });
}
