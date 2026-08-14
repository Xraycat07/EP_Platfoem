import { BackLink } from "@/components/back-link";
import { getDictionary } from "@/lib/i18n/get-locale";
import { NewWorkflowForm } from "./new-workflow-form";

export default async function NewWorkflowPage() {
  const { dict } = await getDictionary();
  const t = dict.newWorkflowPage;

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/workflows" label={t.backToWorkflows} />
      <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
      <p className="mt-1 text-sm text-ink-soft">{t.subtitle}</p>
      <div className="mt-6 rounded-lg border border-line bg-surface p-6">
        <NewWorkflowForm />
      </div>
    </div>
  );
}
