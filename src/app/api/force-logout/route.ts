import { signOut } from "@/lib/auth";

// Clears a stale session cookie (e.g. pointing at a deleted user) and sends
// the browser to /login. Needs to run in a Route Handler, not mid-render,
// because signOut() writes a cookie — see requireUser().
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
