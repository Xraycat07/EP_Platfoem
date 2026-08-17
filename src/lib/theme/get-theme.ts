import "server-only";
import { cookies } from "next/headers";

export type Theme = "light" | "dark";

export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  return store.get("theme")?.value === "dark" ? "dark" : "light";
}
