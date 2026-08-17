import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCategoryContacts } from "@/lib/category-contacts";
import { listUsers } from "@/lib/users";
import { getDictionary } from "@/lib/i18n/get-locale";
import { STEP_GROUPS } from "@/lib/workflow/definition";
import type { StepKey } from "@/lib/workflow/types";
import { BackLink } from "@/components/back-link";
import { CategoryContactForm } from "./category-contact-form";
import { CreateLoginForm } from "./create-login-form";
import { AccountRow } from "./account-row";

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [contacts, users, { dict }] = await Promise.all([
    getCategoryContacts(),
    listUsers(),
    getDictionary(),
  ]);
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
            <div key={group.key} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
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
                selectedUserIds={contacts[group.key].map((u) => u.id)}
                accounts={users}
                saveLabel={t.save}
                savingLabel={t.saving}
                savedLabel={t.saved}
                currentlyLinkedLabel={t.currentlyLinked}
                noneLinkedLabel={t.noneLinked}
                selectAccountsLabel={t.selectAccounts}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">{t.accounts}</h2>
        <p className="mt-1 text-xs text-ink-soft">{t.accountsSubtitle}</p>
        <div className="mt-4 flex flex-col divide-y divide-line">
          {users.map((user) => (
            <AccountRow key={user.id} user={user} dict={t} />
          ))}
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t.createLogin}</h3>
          <div className="mt-3">
            <CreateLoginForm
              dict={t}
              categories={STEP_GROUPS.map((group) => ({
                key: group.key,
                label: dict.stepGroups[group.key as keyof typeof dict.stepGroups],
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
