import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/get-locale";
import { getTheme } from "@/lib/theme/get-theme";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, { locale, dict }, theme] = await Promise.all([auth(), getDictionary(), getTheme()]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:gap-1">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="flex shrink-0 items-baseline gap-2">
              <span className="text-sm font-mono uppercase tracking-widest text-amber">
                ELP
              </span>
              <span className="text-sm font-semibold text-foreground">
                Platform
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle theme={theme} />
              <LanguageToggle locale={locale} />
              <Link
                href="/workflows/new"
                className="rounded-md bg-amber px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 sm:px-3"
              >
                <span className="sm:hidden">{dict.nav.newWorkflowShort}</span>
                <span className="hidden sm:inline">{dict.nav.newWorkflow}</span>
              </Link>
              <span className="hidden text-xs text-ink-soft md:inline">
                {session?.user?.name}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-danger hover:text-danger sm:px-3"
                >
                  {dict.nav.signOut}
                </button>
              </form>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-ink-soft transition hover:text-foreground"
            >
              {dict.nav.dashboard}
            </Link>
            <Link
              href="/workflows"
              className="text-ink-soft transition hover:text-foreground"
            >
              {dict.nav.workflows}
            </Link>
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/settings"
                className="text-ink-soft transition hover:text-foreground"
              >
                {dict.nav.settings}
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
