"use client";

import { useActionState, useRef, useEffect } from "react";
import { createLoginAction } from "./actions";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

export function CreateLoginForm({
  dict,
  categories,
}: {
  dict: {
    name: string;
    email: string;
    password: string;
    role: string;
    category: string;
    noCategory: string;
    createAccount: string;
    creatingAccount: string;
    accountCreated: string;
  };
  categories: { key: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createLoginAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="login-name" className={labelClass}>
            {dict.name}
          </label>
          <input id="login-name" name="name" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className={labelClass}>
            {dict.email}
          </label>
          <input id="login-email" name="email" type="email" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-password" className={labelClass}>
            {dict.password}
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            minLength={8}
            required
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-role" className={labelClass}>
            {dict.role}
          </label>
          <select id="login-role" name="role" defaultValue="REP" className={inputClass}>
            <option value="REP">Rep</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-category" className={labelClass}>
            {dict.category}
          </label>
          <select id="login-category" name="categoryKey" defaultValue="" className={inputClass}>
            <option value="">{dict.noCategory}</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state?.success && (
        <p className="rounded-md bg-teal-soft px-3 py-2 text-sm text-teal">{dict.accountCreated}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? dict.creatingAccount : dict.createAccount}
        </button>
      </div>
    </form>
  );
}
