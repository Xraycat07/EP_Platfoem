"use server";

import { revalidatePath } from "next/cache";
import { respondToQuote } from "@/lib/leads";

export async function acceptQuoteAction(token: string) {
  await respondToQuote(token, "ACCEPTED");
  revalidatePath(`/quote/${token}`);
}

export async function declineQuoteAction(token: string) {
  await respondToQuote(token, "DECLINED");
  revalidatePath(`/quote/${token}`);
}
