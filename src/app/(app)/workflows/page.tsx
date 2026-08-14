import Link from "next/link";
import { listWorkflows, getStatusCounts, progressPercent } from "@/lib/workflow/engine";
import { getDictionary } from "@/lib/i18n/get-locale";
import { WORKFLOW_STATUSES, type WorkflowStatus, type StepKey } from "@/lib/workflow/types";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-teal-soft text-teal",
  ON_HOLD: "bg-amber-soft text-amber",
  COMPLETED: "bg-surface-muted text-ink-soft",
  CANCELLED: "bg-danger-soft text-danger",
};

function isWorkflowStatus(value: string | undefined): value is WorkflowStatus {
  return !!value && (WORKFLOW_STATUSES as readonly string[]).includes(value);
}

export default async function WorkflowsPage(props: PageProps<"/workflows">) {
  const searchParams = await props.searchParams;
  const statusParam = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const status = isWorkflowStatus(statusParam) ? statusParam : undefined;

  const [workflows, statusCounts, { dict }] = await Promise.all([
    listWorkflows(status),
    getStatusCounts(),
    getDictionary(),
  ]);
  const total = statusCounts.ACTIVE + statusCounts.ON_HOLD + statusCounts.COMPLETED + statusCounts.CANCELLED;
  const w = dict.workflowsList;

  const tabs: { label: string; status?: WorkflowStatus; count: number }[] = [
    { label: w.all, count: total },
    { label: w.active, status: "ACTIVE", count: statusCounts.ACTIVE },
    { label: w.onHold, status: "ON_HOLD", count: statusCounts.ON_HOLD },
    { label: w.completed, status: "COMPLETED", count: statusCounts.COMPLETED },
    { label: w.cancelled, status: "CANCELLED", count: statusCounts.CANCELLED },
  ];

  const statusLabel = status ? dict.statusLabels[status] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{w.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {workflows.length} {workflows.length === 1 ? w.job : w.jobs}
            {statusLabel ? ` · ${statusLabel}` : ""}.
          </p>
        </div>
        <Link
          href="/workflows/new"
          className="rounded-md bg-amber px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {w.newWorkflow}
        </Link>
      </div>

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
                <th className="px-4 py-3 font-medium">{w.client}</th>
                <th className="px-4 py-3 font-medium">{w.area}</th>
                <th className="px-4 py-3 font-medium">{w.rep}</th>
                <th className="px-4 py-3 font-medium">{w.currentStep}</th>
                <th className="px-4 py-3 font-medium">{w.status}</th>
                <th className="px-4 py-3 font-medium">{w.progress}</th>
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
