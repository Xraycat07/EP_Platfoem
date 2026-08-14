"use client";

import { useActionState } from "react";
import { createQuoteAction } from "../../../actions";

const TIERS = [
  { key: "essential", name: "EP Essential", tagline: "Backup for essential household loads" },
  {
    key: "independence",
    name: "EP Independence",
    tagline: "Solar + battery designed to substantially reduce grid dependence",
  },
  {
    key: "premium",
    name: "EP Premium",
    tagline: "Larger solar generation and battery capacity with greater backup capability",
  },
] as const;

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

export function QuoteForm({ workflowId, leadId }: { workflowId: string; leadId: string }) {
  const boundAction = createQuoteAction.bind(null, workflowId, leadId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {TIERS.map((tier, index) => (
        <fieldset key={tier.key} className="rounded-lg border border-line p-4">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
            <label className="flex items-center gap-1.5 font-normal text-xs text-ink-soft">
              <input
                type="radio"
                name="recommended"
                value={tier.key}
                defaultChecked={index === 1}
                className="h-3.5 w-3.5"
              />
              Recommended
            </label>
            {tier.name}
          </legend>

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name={`${tier.key}-name`} value={tier.name} />
            <Field label="Tagline" name={`${tier.key}-tagline`} defaultValue={tier.tagline} full />
            <Field label="Panels (kW)" name={`${tier.key}-panelKw`} type="number" step="0.1" />
            <Field label="Inverter (kVA)" name={`${tier.key}-inverterKva`} type="number" step="0.1" />
            <Field label="Battery (kWh)" name={`${tier.key}-batteryKwh`} type="number" step="0.01" />
            <Field
              label="Est. monthly production (kWh)"
              name={`${tier.key}-production`}
              type="number"
              step="1"
            />
            <Field label="Backup capability" name={`${tier.key}-backup`} full />
            <Field label="Price (R)" name={`${tier.key}-price`} type="number" step="1" required={index === 1} />
            <Field label="Warranty (years)" name={`${tier.key}-warranty`} type="number" step="1" defaultValue={10} />
          </div>
        </fieldset>
      ))}

      {state?.error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-amber px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send quote"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  step,
  defaultValue,
  required,
  full,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  defaultValue?: string | number;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        required={required}
        className={inputClass}
      />
    </div>
  );
}
