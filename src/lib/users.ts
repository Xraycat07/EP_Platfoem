import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-user";

export async function listUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createLogin(data: { name: string; email: string; password: string; role: "ADMIN" | "REP" }) {
  await requireAdmin();
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role },
  });
}

// `password` is optional — omit it to leave the account's current password untouched.
export async function updateLogin(
  userId: string,
  data: { name: string; email: string; role: "ADMIN" | "REP"; password?: string }
) {
  await requireAdmin();
  const { password, ...rest } = data;
  return prisma.user.update({
    where: { id: userId },
    data: { ...rest, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) },
  });
}
