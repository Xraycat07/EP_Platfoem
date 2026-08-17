import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { getCategoryContacts } from "@/lib/category-contacts";
import { STEP_GROUPS, groupKeyForStep } from "@/lib/workflow/definition";
import type { StepKey } from "@/lib/workflow/types";

export const CALENDAR_EVENT_TYPES = ["ASSESSMENT", "DELIVERY", "INSTALLATION", "MAINTENANCE"] as const;
export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export type CalendarEvent = {
  id: string;
  type: CalendarEventType;
  date: Date;
  workflowId: string;
  leadName: string;
  suburb: string;
  area: string | null;
  detail: string | null;
  assignedToName: string | null;
  assignedToEmail: string | null;
};

// Same scoping rule as the workflows list: a rep linked to a category as a
// contact only sees events for clients either assigned to them directly or
// currently sitting in one of their categories. Everyone else sees everything.
//
// Split from getCalendarEvents() so the public ICS feed route (authenticated
// by feed token, not session) can reuse the same scoping logic without going
// through requireUser().
export async function getCalendarEventsForUser(
  user: { email?: string | null; role: string }
): Promise<CalendarEvent[]> {
  const [workflows, categoryContacts] = await Promise.all([
    prisma.workflowInstance.findMany({
      where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
      select: {
        id: true,
        leadId: true,
        currentStep: true,
        lead: { select: { name: true, suburb: true, area: true } },
        assignedTo: { select: { name: true, email: true } },
        delivery: { select: { scheduledFor: true, items: true } },
        installation: { select: { scheduledFor: true } },
        maintenance: { select: { id: true, scheduledFor: true, planType: true } },
      },
    }),
    getCategoryContacts(),
  ]);

  const leadIds = workflows.map((w) => w.leadId);
  const assessments = await prisma.assessment.findMany({
    where: { leadId: { in: leadIds }, scheduledFor: { not: null } },
    select: { leadId: true, scheduledFor: true },
  });
  const assessmentByLeadId = new Map(assessments.map((a) => [a.leadId, a.scheduledFor]));

  const myEmail = user.email?.toLowerCase();
  const myCategoryKeys = myEmail
    ? STEP_GROUPS.filter((g) => categoryContacts[g.key]?.some((u) => u.email.toLowerCase() === myEmail)).map(
        (g) => g.key
      )
    : [];
  const isScopedRep = user.role === "REP" && myCategoryKeys.length > 0;

  const events: CalendarEvent[] = [];

  for (const w of workflows) {
    const inScope =
      !isScopedRep ||
      w.assignedTo?.email?.toLowerCase() === myEmail ||
      myCategoryKeys.includes(groupKeyForStep(w.currentStep as StepKey) ?? "");
    if (!inScope) continue;

    const base = {
      workflowId: w.id,
      leadName: w.lead.name,
      suburb: w.lead.suburb,
      area: w.lead.area,
      assignedToName: w.assignedTo?.name ?? null,
      assignedToEmail: w.assignedTo?.email ?? null,
    };

    const assessmentDate = assessmentByLeadId.get(w.leadId);
    if (assessmentDate) {
      events.push({ id: `assessment-${w.id}`, type: "ASSESSMENT", date: assessmentDate, detail: null, ...base });
    }
    if (w.delivery?.scheduledFor) {
      events.push({
        id: `delivery-${w.id}`,
        type: "DELIVERY",
        date: w.delivery.scheduledFor,
        detail: w.delivery.items,
        ...base,
      });
    }
    if (w.installation?.scheduledFor) {
      events.push({
        id: `installation-${w.id}`,
        type: "INSTALLATION",
        date: w.installation.scheduledFor,
        detail: null,
        ...base,
      });
    }
    for (const m of w.maintenance) {
      if (m.scheduledFor) {
        events.push({
          id: `maintenance-${m.id}`,
          type: "MAINTENANCE",
          date: m.scheduledFor,
          detail: m.planType,
          ...base,
        });
      }
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const user = await requireUser();
  return getCalendarEventsForUser(user);
}

function generateFeedToken() {
  return randomBytes(24).toString("base64url");
}

// Self-service only — a user can fetch or regenerate their own feed token,
// never someone else's. The token is the sole credential on the public ICS
// route (calendar apps poll it without a session), so it's generated lazily
// the first time a user asks for their subscribe link rather than at signup.
export async function getOrCreateFeedToken(): Promise<string> {
  const user = await requireUser();
  const existing = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { feedToken: true },
  });
  if (existing.feedToken) return existing.feedToken;

  const token = generateFeedToken();
  await prisma.user.update({ where: { id: user.id }, data: { feedToken: token } });
  return token;
}

// Invalidates the old link — any calendar app still polling it will start
// getting 404s. Used when a user suspects their link leaked.
export async function regenerateFeedToken(): Promise<string> {
  const user = await requireUser();
  const token = generateFeedToken();
  await prisma.user.update({ where: { id: user.id }, data: { feedToken: token } });
  return token;
}
