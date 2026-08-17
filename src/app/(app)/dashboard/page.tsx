import Link from "next/link";
import { getPipelineCompletion, getStatusCounts, listWorkflows, progressPercent } from "@/lib/workflow/engine";
import { getCategoryContacts } from "@/lib/category-contacts";
import { getDictionary } from "@/lib/i18n/get-locale";
import { auth } from "@/lib/auth";
import { STEP_ORDER, STEP_GROUPS } from "@/lib/workflow/definition";
import type { StepKey } from "@/lib/workflow/types";
import { AutoRefresh } from "@/components/auto-refresh";

export default async function DashboardPage() {
  const [{ positions, categories: categoryCompletion }, statusCounts, workflows, contacts, { dict }, session] =
    await Promise.all([
      getPipelineCompletion(),
      getStatusCounts(),
      listWorkflows(),
      getCategoryContacts(),
      getDictionary(),
      auth(),
    ]);

  const maxPosition = Math.max(1, ...STEP_ORDER.map((s) => positions[s]));
  const myEmail = session?.user?.email?.toLowerCase();
  const myCategories = myEmail
    ? STEP_GROUPS.filter((g) => contacts[g.key]?.some((u) => u.email.toLowerCase() === myEmail))
    : [];

  return (
    <div className="flex flex-col gap-8">
      <AutoRefresh />
      <div>
        <h1 className="text-2xl font-bold text-foreground">{dict.dashboard.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{dict.dashboard.subtitle}</p>
      </div>

      {myCategories.length > 0 && (
        <div className="rounded-lg border border-teal bg-teal-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">{dict.dashboard.yourCategories}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {myCategories.map((group) => (
              <Link
                key={group.key}
                href={`/workflows?category=${group.key}`}
                className="flex flex-wrap items-center gap-2 text-sm hover:underline"
              >
                <span className="font-semibold text-foreground">
                  {dict.stepGroups[group.key as keyof typeof dict.stepGroups]}
                </span>
                <span className="text-xs text-ink-soft">
                  {contacts[group.key].map((u) => u.name).join(", ")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={dict.dashboard.active} value={statusCounts.ACTIVE} accent="teal" href="/workflows?status=ACTIVE" />
        <StatCard label={dict.dashboard.onHold} value={statusCounts.ON_HOLD} accent="amber" href="/workflows?status=ON_HOLD" />
        <StatCard label={dict.dashboard.completed} value={statusCounts.COMPLETED} href="/workflows?status=COMPLETED" />
        <StatCard label={dict.dashboard.cancelled} value={statusCounts.CANCELLED} accent="danger" href="/workflows?status=CANCELLED" />
      </div>

      <div className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">{dict.dashboard.activePipeline}</h2>
        <div className="mt-4 flex flex-col gap-4">
          {STEP_GROUPS.map((group) => {
            const clientsInCategory = group.steps.reduce((sum, s) => sum + positions[s], 0);
            const categoryLabel = dict.stepGroups[group.key as keyof typeof dict.stepGroups];
            return (
              <div key={group.key}>
                <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  {clientsInCategory > 0 ? (
                    <Link href={`/workflows?category=${group.key}`} className="hover:text-teal hover:underline">
                      {categoryLabel}
                    </Link>
                  ) : (
                    categoryLabel
                  )}
                  <span className="font-mono font-normal normal-case tracking-normal text-foreground">
                    {categoryCompletion[group.key]}% {dict.dashboard.percentComplete}
                  </span>
                  {contacts[group.key]?.length > 0 && (
                    <a
                      href={`mailto:${contacts[group.key].map((u) => u.email).join(",")}`}
                      className="font-mono font-normal normal-case tracking-normal text-teal hover:underline"
                    >
                      {contacts[group.key].map((u) => u.name).join(", ")}
                    </a>
                  )}
                </p>
                <div className="flex flex-col gap-2">
                  {group.steps.map((step) => {
                    const count = positions[step];
                    const row = (
                      <>
                        <span className="w-40 shrink-0 text-xs text-ink-soft">
                          {dict.stepLabels[step as StepKey]}
                        </span>
                        <div className="h-5 flex-1 overflow-hidden rounded bg-surface-muted">
                          <div
                            className="h-full rounded bg-teal"
                            style={{
                              width: `${(count / maxPosition) * 100}%`,
                              minWidth: count > 0 ? "8px" : 0,
                            }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-xs font-mono tabular-nums text-foreground">
                          {count}
                        </span>
                      </>
                    );
                    return count > 0 ? (
                      <Link
                        key={step}
                        href={`/workflows?step=${step}`}
                        className="flex items-center gap-3 rounded transition hover:bg-surface-muted/60"
                      >
                        {row}
                      </Link>
                    ) : (
                      <div key={step} className="flex items-center gap-3">
                        {row}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{dict.dashboard.recentWorkflows}</h2>
          <div className="flex items-center gap-4">
            <Link href="/workflows?status=COMPLETED" className="text-xs font-medium text-teal hover:underline">
              {dict.dashboard.history} →
            </Link>
            <Link href="/workflows" className="text-xs font-medium text-teal hover:underline">
              {dict.dashboard.viewAll} →
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-col divide-y divide-line">
          {workflows.slice(0, 6).map((workflow) => (
            <Link
              key={workflow.id}
              href={`/workflows/${workflow.id}`}
              className="flex items-center justify-between py-2.5 text-sm transition hover:bg-surface-muted/60"
            >
              <div>
                <p className="font-medium text-foreground">{workflow.lead.name}</p>
                <p className="text-xs text-ink-soft">
                  {workflow.lead.suburb}
                  {workflow.lead.area ? ` · ${workflow.lead.area}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">{progressPercent(workflow)}%</span>
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-soft">
                  {dict.stepLabels[workflow.currentStep as StepKey]}
                </span>
              </div>
            </Link>
          ))}
          {workflows.length === 0 && (
            <p className="py-4 text-sm text-ink-soft">{dict.dashboard.noWorkflowsYet}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: number;
  accent?: "amber" | "teal" | "danger";
  href?: string;
}) {
  const color =
    accent === "amber"
      ? "text-amber"
      : accent === "teal"
        ? "text-teal"
        : accent === "danger"
          ? "text-danger"
          : "text-foreground";
  const content = (
    <>
      <p className="text-xs text-ink-soft">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-bold tabular-nums ${color}`}>
        {value}
      </p>
    </>
  );
  const className = "rounded-lg border border-line bg-surface p-4 transition hover:border-teal";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
