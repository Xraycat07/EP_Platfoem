"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { setCategoryContactRecipients, addCategoryContactRecipient } from "@/lib/category-contacts";
import { createLogin, updateLogin } from "@/lib/users";
import { STEP_GROUPS } from "@/lib/workflow/definition";

export type FormState = { error?: string; success?: boolean } | undefined;

export async function setCategoryContactAction(
  key: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userIds = formData.getAll("userIds").filter((v): v is string => typeof v === "string" && v.length > 0);

  try {
    await setCategoryContactRecipients(key, userIds);
  } catch {
    return { error: "You don't have permission to change this." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/workflows");
  return { success: true };
}

const categoryKeys = STEP_GROUPS.map((g) => g.key) as [string, ...string[]];

const loginSchema = z.object({
  name: z.string().trim().min(2, { error: "Enter a name." }),
  email: z.string().trim().email({ error: "Enter a valid email address." }),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
  role: z.enum(["ADMIN", "REP"], { error: "Choose a role." }),
  categoryKey: z.enum(categoryKeys).optional().or(z.literal("")),
});

export type CreateLoginState = { error?: string; success?: boolean } | undefined;

export async function createLoginAction(
  _prevState: CreateLoginState,
  formData: FormData
): Promise<CreateLoginState> {
  const parsed = loginSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    categoryKey: formData.get("categoryKey") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { categoryKey, ...loginData } = parsed.data;
  try {
    const user = await createLogin(loginData);
    if (categoryKey) {
      await addCategoryContactRecipient(categoryKey, user.id);
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "An account with that email already exists." };
    }
    return { error: "Couldn't create the account." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/workflows");
  return { success: true };
}

const updateLoginSchema = z.object({
  name: z.string().trim().min(2, { error: "Enter a name." }),
  email: z.string().trim().email({ error: "Enter a valid email address." }),
  role: z.enum(["ADMIN", "REP"], { error: "Choose a role." }),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }).optional().or(z.literal("")),
});

export type UpdateLoginState = { error?: string; success?: boolean } | undefined;

export async function updateLoginAction(
  userId: string,
  _prevState: UpdateLoginState,
  formData: FormData
): Promise<UpdateLoginState> {
  const parsed = updateLoginSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { password, ...rest } = parsed.data;
  try {
    await updateLogin(userId, { ...rest, password: password || undefined });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Another account already uses that email." };
    }
    return { error: "Couldn't update the account." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/workflows");
  return { success: true };
}
