"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setCategoryContact } from "@/lib/category-contacts";

export type FormState = { error?: string } | undefined;

const schema = z.object({
  email: z.string().trim().email({ error: "Enter a valid email address." }).optional().or(z.literal("")),
});

export async function setCategoryContactAction(
  key: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = schema.safeParse({ email: formData.get("email") ?? "" });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  try {
    await setCategoryContact(key, parsed.data.email || null);
  } catch {
    return { error: "You don't have permission to change this." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/workflows");
}
