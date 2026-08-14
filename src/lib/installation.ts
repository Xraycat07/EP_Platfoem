import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function upsertInstallation(
  workflowId: string,
  data: {
    scheduledFor?: Date | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
    installedById?: string;
    notes?: string;
  }
) {
  await requireUser();
  return prisma.installation.upsert({
    where: { workflowId },
    create: { workflowId, ...data },
    update: data,
  });
}
