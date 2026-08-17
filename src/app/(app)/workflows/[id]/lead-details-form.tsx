"use client";

import { useActionState, useState } from "react";
import { updateLeadDetailsAction } from "../actions";
import { mapsEmbedUrl, mapsSearchUrl } from "@/lib/maps";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

export type LeadContactDetails = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  idNumber: string | null;
  altContactName: string | null;
  altContactPhone: string | null;
  suburb: string;
  area: string | null;
  streetAddress: string | null;
  postalCode: string | null;
  province: string | null;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function LeadDetailsForm({
  lead,
  workflowId,
  dict,
}: {
  lead: LeadContactDetails;
  workflowId: string;
  dict: Dictionary["workflowDetail"];
}) {
  const [editing, setEditing] = useState(false);
  const boundAction = updateLeadDetailsAction.bind(null, lead.id, workflowId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  const hasAddress = !!(lead.streetAddress || lead.suburb || lead.area || lead.province || lead.postalCode);

  if (!editing) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{dict.contactDetails}</h3>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-teal hover:underline"
          >
            {dict.edit}
          </button>
        </div>
        <dl className="flex flex-col gap-3 text-sm">
          <Row label={dict.fullName} value={lead.name} />
          <Row label={dict.cellphone} value={lead.phone} />
          <Row label={dict.email} value={lead.email ?? "—"} />
          <Row label={dict.idNumber} value={lead.idNumber ?? "—"} />
          <Row label={dict.altContactName} value={lead.altContactName ?? "—"} />
          <Row label={dict.altContactPhone} value={lead.altContactPhone ?? "—"} />
        </dl>
        <div className="border-t border-line pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{dict.address}</h4>
          {hasAddress ? (
            <>
              <p className="mt-2 text-sm text-foreground">
                {[lead.streetAddress, lead.suburb, lead.area, lead.province, lead.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <a
                href={mapsSearchUrl(lead)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-teal hover:underline"
              >
                {dict.viewOnMap} ↗
              </a>
              <div className="mt-3 overflow-hidden rounded-md border border-line">
                <iframe
                  src={mapsEmbedUrl(lead)}
                  className="h-48 w-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={dict.address}
                />
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">{dict.noAddressYet}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{dict.leadDetails}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={dict.fullName} name="name" defaultValue={lead.name} required />
        <Field label={dict.cellphone} name="phone" defaultValue={lead.phone} required />
        <Field label={dict.email} name="email" type="email" defaultValue={lead.email ?? ""} />
        <Field label={dict.idNumber} name="idNumber" defaultValue={lead.idNumber ?? ""} />
        <Field label={dict.altContactName} name="altContactName" defaultValue={lead.altContactName ?? ""} />
        <Field label={dict.altContactPhone} name="altContactPhone" defaultValue={lead.altContactPhone ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={dict.streetAddress} name="streetAddress" defaultValue={lead.streetAddress ?? ""} />
        <Field label={dict.suburb} name="suburb" defaultValue={lead.suburb} required />
        <Field label={dict.area} name="area" defaultValue={lead.area ?? ""} />
        <Field label={dict.province} name="province" defaultValue={lead.province ?? ""} />
        <Field label={dict.postalCode} name="postalCode" defaultValue={lead.postalCode ?? ""} />
      </div>

      {state?.error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="rounded-md bg-teal-soft px-3 py-2 text-sm text-teal">{dict.detailsUpdated}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-danger hover:text-danger"
        >
          {dict.cancel}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? dict.saving : dict.save}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`lead-${name}`} className={labelClass}>
        {label}
      </label>
      <input
        id={`lead-${name}`}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className={inputClass}
      />
    </div>
  );
}
