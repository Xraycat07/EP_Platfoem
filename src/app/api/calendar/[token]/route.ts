import { prisma } from "@/lib/prisma";
import { getCalendarEventsForUser } from "@/lib/calendar";
import { buildIcsFeed } from "@/lib/ics";

// Public and unauthenticated by design — desktop/mobile calendar apps poll
// this URL on their own schedule with no session, so the feed token in the
// path *is* the credential. Keep this route out of proxy.ts's auth matcher.
export async function GET(_request: Request, { params }: RouteContext<"/api/calendar/[token]">) {
  const { token } = await params;

  const user = await prisma.user.findUnique({
    where: { feedToken: token },
    select: { name: true, email: true, role: true },
  });
  if (!user) {
    return new Response("Not found", { status: 404 });
  }

  const events = await getCalendarEventsForUser(user);
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const ics = buildIcsFeed(events, `ELP Platform — ${user.name}`, baseUrl);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="elp-platform.ics"',
      "Cache-Control": "private, max-age=1800",
    },
  });
}
