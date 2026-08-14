import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/require-user";
import { STEP_GROUPS } from "@/lib/workflow/definition";

export async function getCategoryContacts() {
  await requireUser();
  const rows = await prisma.categoryContact.findMany();
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.email]));
  return Object.fromEntries(STEP_GROUPS.map((g) => [g.key, byKey[g.key] ?? null])) as Record<
    string,
    string | null
  >;
}

export async function setCategoryContact(key: string, email: string | null) {
  await requireAdmin();
  return prisma.categoryContact.upsert({
    where: { key },
    create: { key, email },
    update: { email },
  });
}
