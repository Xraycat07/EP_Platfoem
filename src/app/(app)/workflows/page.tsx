import Link from "next/link";
import { listWorkflows, getStatusCounts, progressPercent } from "@/lib/workflow/engine";
import { getDictionary } from "@/lib/i18n/get-locale";
import { WORKFLOW_STATUSES, STEP_KEYS, type WorkflowStatus, type StepKey } from "@/lib/workflow/types";
import { STEP_GROUPS, STEP_ORDER } from "@/lib/workflow/definition";
import { AutoRefresh } from "@/components/auto-refresh";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-teal-soft text-teal",
  ON_HOLD: "bg-amber-soft text-amber",
  COMPLETED: "bg-surface-muted text-ink-soft",
  CANCELLED: "bg-danger-soft text-danger",
};

const STATUS_ORDER: WorkflowStatus[] = ["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

const SORT_COLUMNS = ["client", "area", "rep", "step", "status", "progress"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];
type Workflow = Awaited<ReturnType<typeof listWorkflows>>[number];

const SORTERS: Record<SortColumn, (a: Workflow, b: Workflow) => number> = {
  client: (a, b) => a.lead.name.localeCompare(b.lead.name),
  area: (a, b) => (a.lead.area ?? a.lead.suburb).localeCompare(b.lead.area ?? b.lead.suburb),
  rep: (a, b) => (a.assignedTo?.name ?? "").localeCompare(b.assignedTo?.name ?? ""),
  step: (a, b) => STEP_ORDER.indexOf(a.currentStep as StepKey) - STEP_ORDER.indexOf(b.currentStep as StepKey),
  status: (a, b) => STATUS_ORDER.indexOf(a.status as WorkflowStatus) - STATUS_ORDER.indexOf(b.status as WorkflowStatus),
  progress: (a, b) => progressPercent(a) - progressPercent(b),
};

function isWorkflowStatus(value: string | undefined): value is WorkflowStatus {
  return !!value && (WORKFLOW_STATUSES as readonly string[]).includes(value);
}

function isStepKey(value: string | undefined): value is StepKey {
  return !!value && (STEP_KEYS as readonly string[]).includes(value);
}

function isSortColumn(value: string | undefined): value is SortColumn {
  return !!value && (SORT_COLUMNS as readonly string[]).includes(value);
}

export default async function WorkflowsPage(props: PageProps<"/workflows">) {
  const searchParams = await props.searchParams;
  const statusParam = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const stepParam = Array.isArray(searchParams.step) ? searchParams.step[0] : searchParams.step;
  const categoryParam = Array.isArray(searchParams.category) ? searchParams.category[0] : searchParams.category;
  const sortParam = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;
  const dirParam = Array.isArray(searchParams.dir) ? searchParams.dir[0] : searchParams.dir;

  const status = isWorkflowStatus(statusParam) ? statusParam : undefined;
  const step = isStepKey(stepParam) ? stepParam : undefined;
  const category = STEP_GROUPS.find((g) => g.key === categoryParam);
  const sort = isSortColumn(sortParam) ? sortParam : undefined;
  const dir: "asc" | "desc" = dirParam === "desc" ? "desc" : "asc";

  // Clicking a step/category bar on the dashboard means "who's there right
  // now" — that's scoped to the active pipeline (ACTIVE/ON_HOLD), same as
  // the counts shown there, regardless of the status tab.
  const pipelineFilter = step
    ? { currentStep: step, statusIn: ["ACTIVE", "ON_HOLD"] as const }
    : category
      ? { currentStepIn: category.steps, statusIn: ["ACTIVE", "ON_HOLD"] as const }
      : { status };

  const [fetchedWorkflows, statusCounts, { dict }] = await Promise.all([
    listWorkflows(pipelineFilter),
    getStatusCounts(),
    getDictionary(),
  ]);
  const workflows = sort
    ? [...fetchedWorkflows].sort((a, b) => (dir === "desc" ? -1 : 1) * SORTERS[sort](a, b))
    : fetchedWorkflows;
  const total = statusCounts.ACTIVE + statusCounts.ON_HOLD + statusCounts.COMPLETED + statusCounts.CANCELLED;
  const w = dict.workflowsList;

  function sortHref(column: SortColumn) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (step) params.set("step", step);
    if (category) params.set("category", category.key);
    params.set("sort", column);
    params.set("dir", sort === column && dir === "asc" ? "desc" : "asc");
    return `/workflows?${params.toString()}`;
  }

  const tabs: { label: string; status?: WorkflowStatus; count: number }[] = [
    { label: w.all, count: total },
    { label: w.active, status: "ACTIVE", count: statusCounts.ACTIVE },
    { label: w.onHold, status: "ON_HOLD", count: statusCounts.ON_HOLD },
    { label: w.completed, status: "COMPLETED", count: statusCounts.COMPLETED },
    { label: w.cancelled, status: "CANCELLED", count: statusCounts.CANCELLED },
  ];

  const pipelineLabel = step
    ? dict.stepLabels[step]
    : category
      ? dict.stepGroups[category.key as keyof typeof dict.stepGroups]
      : undefined;
  const statusLabel = !pipelineLabel && status ? dict.statusLabels[status] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{w.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {workflows.length} {workflows.length === 1 ? w.job : w.jobs}
            {statusLabel ? ` · ${statusLabel}` : ""}
            {pipelineLabel ? ` · ${w.currentlyIn} ${pipelineLabel}` : ""}.
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="rounded-md bg-amber px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {w.newWorkflow}
        </Link>
      </div>

      {pipelineLabel && (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-teal-soft px-3 py-1.5 text-xs font-medium text-teal">
            {pipelineLabel}
          </span>
          <Link href="/workflows" className="text-xs font-medium text-ink-soft hover:text-foreground">
            {w.clearFilter} ×
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.status === status;
          return (
            <Link
              key={tab.label}
              href={tab.status ? `/workflows?status=${tab.status}` : "/workflows"}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                isActive ? "bg-amber text-white" : "bg-surface-muted text-ink-soft hover:text-foreground"
              }`}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </div>

      {workflows.length === 0 && (
        <div className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-sm text-ink-soft">
          {statusLabel ? w.noFilteredWorkflows.replace("{status}", statusLabel.toLowerCase()) : w.noWorkflows}
        </div>
      )}

      {/* Card list — mobile only */}
      {workflows.length > 0 && (
        <div className="flex flex-col gap-3 sm:hidden">
          {workflows.map((workflow) => (
            <Link
              key={workflow.id}
              href={`/workflows/${workflow.id}`}
              className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 transition hover:border-teal"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{workflow.lead.name}</p>
                  <p className="text-xs text-ink-soft">{workflow.lead.phone}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[workflow.status] ?? ""}`}
                >
                  {dict.statusLabels[workflow.status as WorkflowStatus]}
                </span>
              </div>
              <p className="text-xs text-ink-soft">
                {workflow.lead.suburb}
                {workflow.lead.area ? ` · ${workflow.lead.area}` : ""} · {workflow.assignedTo?.name ?? w.unassigned}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-soft">
                  {dict.stepLabels[workflow.currentStep as StepKey]}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded bg-surface-muted">
                    <div className="h-full rounded bg-teal" style={{ width: `${progressPercent(workflow)}%` }} />
                  </div>
                  <span className="text-xs text-ink-soft">{progressPercent(workflow)}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Table — sm and up */}
      {workflows.length > 0 && (
        <div className="hidden overflow-x-auto rounded-lg border border-line bg-surface sm:block">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-muted text-left text-xs uppercase tracking-wide text-ink-soft">
                <SortHeader column="client" label={w.client} sort={sort} dir={dir} href={sortHref} />
                <SortHeader column="area" label={w.area} sort={sort} dir={dir} href={sortHref} />
                <SortHeader column="rep" label={w.rep} sort={sort} dir={dir} href={sortHref} />
                <SortHeader column="step" label={w.currentStep} sort={sort} dir={dir} href={sortHref} />
                <SortHeader column="status" label={w.status} sort={sort} dir={dir} href={sortHref} />
                <SortHeader column="progress" label={w.progress} sort={sort} dir={dir} href={sortHref} />
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow) => (
                <tr key={workflow.id} className="border-b border-line last:border-none">
                  <td className="px-4 py-3">
                    <Link
                      href={`/workflows/${workflow.id}`}
                      className="font-medium text-foreground hover:text-teal"
                    >
                      {workflow.lead.name}
                    </Link>
                    <p className="text-xs text-ink-soft">{workflow.lead.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {workflow.lead.suburb}
                    {workflow.lead.area ? ` · ${workflow.lead.area}` : ""}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{workflow.assignedTo?.name ?? w.unassigned}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-soft">
                      {dict.stepLabels[workflow.currentStep as StepKey]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[workflow.status] ?? ""}`}
                    >
                      {dict.statusLabels[workflow.status as WorkflowStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded bg-surface-muted">
                        <div
                          className="h-full rounded bg-teal"
                          style={{ width: `${progressPercent(workflow)}%` }}
                        />
                      </div>
                      <span className="text-xs text-ink-soft">{progressPercent(workflow)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SortHeader({
  column,
  label,
  sort,
  dir,
  href,
}: {
  column: SortColumn;
  label: string;
  sort: SortColumn | undefined;
  dir: "asc" | "desc";
  href: (column: SortColumn) => string;
}) {
  const isActive = sort === column;
  return (
    <th className="px-4 py-3 font-medium">
      <Link
        href={href(column)}
        className={`flex items-center gap-1 transition hover:text-foreground ${isActive ? "text-foreground" : ""}`}
      >
        {label}
        <span className={`text-[10px] ${isActive ? "opacity-100" : "opacity-0"}`}>
          {isActive && dir === "desc" ? "▼" : "▲"}
        </span>
      </Link>
    </th>
  );
}
