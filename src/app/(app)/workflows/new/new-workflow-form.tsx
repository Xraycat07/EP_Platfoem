"use client";

import { useActionState } from "react";
import { createWorkflowAction } from "../actions";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-sm font-medium text-foreground";

export function NewWorkflowForm() {
  const [state, formAction, pending] = useActionState(createWorkflowAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required className={inputClass} />
        <Field label="Cellphone" name="phone" required className={inputClass} />
        <Field label="Suburb" name="suburb" required className={inputClass} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="area" className={labelClass}>
            Area / campaign
          </label>
          <select id="area" name="area" className={inputClass} defaultValue="">
            <option value="">Select area…</option>
            <option value="Pretoria East">Pretoria East</option>
            <option value="Centurion">Centurion</option>
            <option value="Midrand">Midrand</option>
            <option value="Johannesburg">Johannesburg</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <Field
          label="Monthly electricity bill (R)"
          name="monthlyBill"
          type="number"
          className={inputClass}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="propertyType" className={labelClass}>
            Property type
          </label>
          <select id="propertyType" name="propertyType" className={inputClass} defaultValue="Residential">
            <option value="Residential">Residential</option>
            <option value="Business">Business</option>
          </select>
        </div>
        <Field label="Privyr ID" name="privyrId" className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="hasExistingSolar" className="h-4 w-4 rounded border-line" />
        Already has an existing solar system
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="objective" className={labelClass}>
          Main objective
        </label>
        <textarea
          id="objective"
          name="objective"
          rows={2}
          placeholder="e.g. backup during load shedding, reduce Eskom bill"
          className={inputClass}
        />
      </div>

      <Field
        label="Source"
        name="source"
        placeholder="e.g. Google Ads – solar installer Pretoria East"
        className={inputClass}
      />

      {state?.error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-amber px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Create workflow"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}
