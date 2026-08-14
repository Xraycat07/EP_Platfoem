import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCategoryContacts } from "@/lib/category-contacts";
import { getDictionary } from "@/lib/i18n/get-locale";
import { STEP_GROUPS } from "@/lib/workflow/definition";
import type { StepKey } from "@/lib/workflow/types";
import { BackLink } from "@/components/back-link";
import { CategoryContactForm } from "./category-contact-form";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [contacts, { dict }] = await Promise.all([getCategoryContacts(), getDictionary()]);
  const t = dict.settingsPage;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackLink href="/dashboard" label={t.backToDashboard} />
        <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t.subtitle}</p>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">{t.categoryContacts}</h2>
        <div className="mt-4 flex flex-col divide-y divide-line">
          {STEP_GROUPS.map((group) => (
            <div key={group.key} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {dict.stepGroups[group.key as keyof typeof dict.stepGroups]}
                </p>
                <p className="text-xs text-ink-soft">
                  {group.steps.map((s) => dict.stepLabels[s as StepKey]).join(", ")}
                </p>
              </div>
              <CategoryContactForm
                categoryKey={group.key}
                email={contacts[group.key]}
                saveLabel={t.save}
                savingLabel={t.saving}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
