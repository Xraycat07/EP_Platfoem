import { LoginForm } from "./login-form";
import { getDictionary } from "@/lib/i18n/get-locale";
import { LanguageToggle } from "@/components/language-toggle";

export default async function LoginPage() {
  const { locale, dict } = await getDictionary();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          <LanguageToggle locale={locale} />
        </div>
        <div className="mb-8 text-center">
          <p className="text-xs font-mono tracking-widest text-ink-soft uppercase">
            {dict.login.tagline}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {dict.login.title}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {dict.login.subtitle}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-6 shadow-sm">
          <LoginForm dict={dict.login} />
        </div>
        <p className="mt-6 text-center text-xs text-ink-soft">
          {dict.login.demoLogin}: admin@elp.co.za / elp-admin-2026
        </p>
      </div>
    </div>
  );
}
