import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function upsertCoc(
  workflowId: string,
  data: { certificateNo?: string; issuedAt?: Date | null; issuedBy?: string; documentUrl?: string }
) {
  await requireUser();
  return prisma.coc.upsert({
    where: { workflowId },
    create: { workflowId, ...data },
    update: data,
  });
}
