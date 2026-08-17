"use server";

import { regenerateFeedToken } from "@/lib/calendar";

export async function regenerateFeedTokenAction(): Promise<string> {
  return regenerateFeedToken();
}
