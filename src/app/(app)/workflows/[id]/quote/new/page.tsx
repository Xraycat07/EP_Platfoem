import { notFound } from "next/navigation";
import { getWorkflow } from "@/lib/workflow/engine";
import { BackLink } from "@/components/back-link";
import { QuoteForm } from "./quote-form";

export default async function NewQuotePage(props: PageProps<"/workflows/[id]/quote/new">) {
  const { id } = await props.params;
  const workflow = await getWorkflow(id);
  if (!workflow) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href={`/workflows/${workflow.id}`} label={`Back to ${workflow.lead.name}`} />
      <h1 className="text-2xl font-bold text-foreground">Build a quote for {workflow.lead.name}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Give them a choice: three system tiers, not a yes/no on solar.
      </p>
      <div className="mt-6 rounded-lg border border-line bg-surface p-6">
        <QuoteForm workflowId={workflow.id} leadId={workflow.leadId} />
      </div>
    </div>
  );
}
