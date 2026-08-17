import Link from "next/link";
import { getCalendarEvents, getOrCreateFeedToken, type CalendarEvent, type CalendarEventType } from "@/lib/calendar";
import { getDictionary } from "@/lib/i18n/get-locale";
import { AutoRefresh } from "@/components/auto-refresh";
import { SubscribePanel } from "./subscribe-panel";

const TYPE_STYLE: Record<CalendarEventType, { dot: string; chip: string }> = {
  ASSESSMENT: { dot: "bg-teal", chip: "bg-teal-soft text-teal" },
  DELIVERY: { dot: "bg-amber", chip: "bg-amber-soft text-amber" },
  INSTALLATION: { dot: "bg-foreground", chip: "bg-surface-muted text-foreground" },
  MAINTENANCE: { dot: "bg-danger", chip: "bg-danger-soft text-danger" },
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isSameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b);
}

function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  // Grid starts on the Monday on/before the 1st — Sunday is day 0, so Monday-first
  // offset is (weekday + 6) % 7 days to walk back.
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}

function fmtDay(date: Date) {
  return date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

export default async function CalendarPage(props: PageProps<"/calendar">) {
  const searchParams = await props.searchParams;
  const yearParam = Array.isArray(searchParams.year) ? searchParams.year[0] : searchParams.year;
  const monthParam = Array.isArray(searchParams.month) ? searchParams.month[0] : searchParams.month;

  const today = new Date();
  const year = Number.isFinite(Number(yearParam)) && yearParam ? Number(yearParam) : today.getFullYear();
  // Month in the URL is 1-indexed for readability; Date's month is 0-indexed internally.
  const month =
    Number.isFinite(Number(monthParam)) && monthParam ? Math.min(11, Math.max(0, Number(monthParam) - 1)) : today.getMonth();

  const [events, feedToken, { dict }] = await Promise.all([getCalendarEvents(), getOrCreateFeedToken(), getDictionary()]);
  const t = dict.calendarPage;

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  const days = buildMonthGrid(year, month);

  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dateKey(new Date(event.date));
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  }

  function monthHref(y: number, m: number) {
    // m is 0-indexed here — normalize into a valid year/month before writing 1-indexed to the URL.
    const normalized = new Date(y, m, 1);
    return `/calendar?year=${normalized.getFullYear()}&month=${normalized.getMonth() + 1}`;
  }

  const upcoming = events.filter((e) => new Date(e.date).getTime() >= new Date(today.toDateString()).getTime()).slice(0, 8);

  const typeLabels: Record<CalendarEventType, string> = {
    ASSESSMENT: t.assessment,
    DELIVERY: t.delivery,
    INSTALLATION: t.installation,
    MAINTENANCE: t.maintenance,
  };

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={monthHref(year, month - 1)}
            className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-teal hover:text-foreground"
          >
            ← {t.previous}
          </Link>
          <Link
            href={monthHref(today.getFullYear(), today.getMonth())}
            className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-teal hover:text-foreground"
          >
            {t.today}
          </Link>
          <Link
            href={monthHref(year, month + 1)}
            className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-teal hover:text-foreground"
          >
            {t.next} →
          </Link>
        </div>
      </div>

      <SubscribePanel token={feedToken} baseUrl={process.env.AUTH_URL ?? "http://localhost:3000"} dict={t.subscribe} />

      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
        <div className="flex flex-wrap items-center gap-3">
          {CALENDAR_EVENT_TYPE_ORDER.map((type) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-ink-soft">
              <span className={`h-2 w-2 rounded-full ${TYPE_STYLE[type].dot}`} />
              {typeLabels[type]}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <div className="grid min-w-[700px] grid-cols-7 border-b border-line text-center text-xs font-medium uppercase tracking-wide text-ink-soft">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="border-r border-line px-2 py-2 last:border-r-0">
              {label}
            </div>
          ))}
        </div>
        <div className="grid min-w-[700px] grid-cols-7">
          {days.map((day) => {
            const inMonth = day.getMonth() === month;
            const dayEvents = eventsByDay.get(dateKey(day)) ?? [];
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[110px] border-b border-r border-line p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0 ${
                  inMonth ? "bg-surface" : "bg-surface-muted/40"
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-amber font-semibold text-white"
                      : inMonth
                        ? "text-foreground"
                        : "text-ink-soft/60"
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 flex flex-col gap-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <Link
                      key={event.id}
                      href={`/workflows/${event.workflowId}`}
                      className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium transition hover:opacity-80 ${TYPE_STYLE[event.type].chip}`}
                      title={`${typeLabels[event.type]} — ${event.leadName}`}
                    >
                      {event.leadName}
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="px-1.5 text-[11px] text-ink-soft">
                      +{dayEvents.length - 3} {t.more}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">{t.upcoming}</h2>
        <div className="mt-4 flex flex-col divide-y divide-line">
          {upcoming.map((event) => (
            <Link
              key={event.id}
              href={`/workflows/${event.workflowId}`}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm transition hover:bg-surface-muted/60"
            >
              <div>
                <p className="font-medium text-foreground">{event.leadName}</p>
                <p className="text-xs text-ink-soft">
                  {event.suburb}
                  {event.area ? ` · ${event.area}` : ""}
                  {event.assignedToName ? ` · ${event.assignedToName}` : ""}
                  {event.detail ? ` · ${event.detail}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">{fmtDay(new Date(event.date))}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_STYLE[event.type].chip}`}>
                  {typeLabels[event.type]}
                </span>
              </div>
            </Link>
          ))}
          {upcoming.length === 0 && <p className="py-4 text-sm text-ink-soft">{t.noUpcoming}</p>}
        </div>
      </div>
    </div>
  );
}

const CALENDAR_EVENT_TYPE_ORDER: CalendarEventType[] = ["ASSESSMENT", "DELIVERY", "INSTALLATION", "MAINTENANCE"];
