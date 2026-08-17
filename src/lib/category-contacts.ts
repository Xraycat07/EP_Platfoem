import "server-only";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/require-user";
import { STEP_GROUPS } from "@/lib/workflow/definition";

export type CategoryContactAccount = { id: string; name: string; email: string };

export async function getCategoryContacts(): Promise<Record<string, CategoryContactAccount[]>> {
  await requireUser();
  const rows = await prisma.categoryContact.findMany({
    include: { recipients: { include: { user: { select: { id: true, name: true, email: true } } } } },
  });
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.recipients.map((rec) => rec.user)]));
  return Object.fromEntries(STEP_GROUPS.map((g) => [g.key, byKey[g.key] ?? []])) as Record<
    string,
    CategoryContactAccount[]
  >;
}

// Replaces the full set of recipients for a category with `userIds` — an
// empty array clears the category's contacts entirely.
export async function setCategoryContactRecipients(key: string, userIds: string[]) {
  await requireAdmin();
  const contact = await prisma.categoryContact.upsert({
    where: { key },
    create: { key },
    update: {},
  });
  await prisma.categoryContactRecipient.deleteMany({ where: { categoryContactId: contact.id } });
  if (userIds.length > 0) {
    await prisma.categoryContactRecipient.createMany({
      data: userIds.map((userId) => ({ categoryContactId: contact.id, userId })),
    });
  }
  return contact;
}

// Adds one user to a category's existing recipients without disturbing
// anyone already there — used when a new account is created with a category
// picked at the same time, rather than replacing the whole set.
export async function addCategoryContactRecipient(key: string, userId: string) {
  await requireAdmin();
  const contact = await prisma.categoryContact.upsert({
    where: { key },
    create: { key },
    update: {},
  });
  await prisma.categoryContactRecipient.upsert({
    where: { categoryContactId_userId: { categoryContactId: contact.id, userId } },
    create: { categoryContactId: contact.id, userId },
    update: {},
  });
}
