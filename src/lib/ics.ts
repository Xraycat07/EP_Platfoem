import "server-only";
import type { CalendarEvent, CalendarEventType } from "@/lib/calendar";

const TYPE_TITLES: Record<CalendarEventType, string> = {
  ASSESSMENT: "Assessment",
  DELIVERY: "Delivery",
  INSTALLATION: "Installation",
  MAINTENANCE: "Maintenance visit",
};

// Long lines must be folded at 75 octets per RFC 5545 — a continuation line
// starts with a single space, which readers strip back out on unfolding.
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toDateStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// All the scheduled dates behind this feed (assessment/delivery/installation/
// maintenance) are captured via a plain <input type="date">, with no time of
// day — so these render as all-day events (VALUE=DATE) rather than
// DATE-TIME, which sidesteps timezone conversion entirely.
function toAllDayDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function buildIcsFeed(events: CalendarEvent[], calendarName: string, baseUrl: string): string {
  const now = toDateStamp(new Date());

  const vevents = events.map((event) => {
    const date = new Date(event.date);
    const summary = `${TYPE_TITLES[event.type]} — ${event.leadName}`;
    const descriptionParts = [
      `${event.suburb}${event.area ? `, ${event.area}` : ""}`,
      event.assignedToName ? `Rep: ${event.assignedToName}` : null,
      event.detail,
    ].filter((p): p is string => !!p);

    const lines = [
      "BEGIN:VEVENT",
      `UID:${event.id}@elp-platform`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${toAllDayDate(date)}`,
      `DTEND;VALUE=DATE:${toAllDayDate(addDays(date, 1))}`,
      `SUMMARY:${escapeText(summary)}`,
    ];
    if (descriptionParts.length > 0) {
      lines.push(`DESCRIPTION:${escapeText(descriptionParts.join("\\n"))}`);
    }
    lines.push(`URL:${baseUrl}/workflows/${event.workflowId}`);
    lines.push("END:VEVENT");
    return lines.map(foldLine).join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ELP Platform//Calendar Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeText(calendarName)}`),
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...vevents,
    "END:VCALENDAR",
  ].join("\r\n");
}
