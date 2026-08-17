import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // A session can outlive the user it points to (e.g. a database reset during
  // development regenerates user IDs). Writing a stale ID as a foreign key
  // crashes deep in a database call, so verify it here and force a clean
  // re-login instead of surfacing a raw constraint-violation error.
  const exists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!exists) {
    // signOut() would need to write a cookie, which Next.js only allows from a
    // Server Action or Route Handler, not mid-render here. Route through
    // /api/force-logout so the stale cookie actually gets cleared — redirecting
    // straight to /login without clearing it just bounces off the middleware's
    // isLoggedIn check and loops (ERR_TOO_MANY_REDIRECTS).
    redirect("/api/force-logout");
  }

  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  return user;
}
