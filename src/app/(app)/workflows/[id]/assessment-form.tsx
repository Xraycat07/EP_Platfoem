"use client";

import { useActionState } from "react";
import { saveAssessmentAction } from "../actions";

const inputClass =
  "rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";
const labelClass = "text-xs font-medium text-ink-soft";

type Assessment = {
  scheduledFor: Date | null;
  eskomSupply: string | null;
  dbBoard: string | null;
  roofType: string | null;
  roofOrientation: string | null;
  availablePanelSpace: string | null;
  existingElectrical: string | null;
  essentialLoads: string | null;
  backupRequirements: string | null;
  recommendedInverterKva: number | null;
  recommendedBatteryKwh: number | null;
  recommendedPanelKw: number | null;
  futureExpansion: string | null;
  notes: string | null;
} | null;

export function AssessmentForm({
  workflowId,
  leadId,
  assessment,
}: {
  workflowId: string;
  leadId: string;
  assessment: Assessment;
}) {
  const boundAction = saveAssessmentAction.bind(null, workflowId, leadId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Assessment date"
          name="scheduledFor"
          type="date"
          defaultValue={
            assessment?.scheduledFor
              ? new Date(assessment.scheduledFor).toISOString().slice(0, 10)
              : ""
          }
        />
        <Field label="Eskom / municipal supply" name="eskomSupply" defaultValue={assessment?.eskomSupply ?? ""} />
        <Field label="DB board" name="dbBoard" defaultValue={assessment?.dbBoard ?? ""} />
        <Field label="Roof type" name="roofType" defaultValue={assessment?.roofType ?? ""} />
        <Field label="Roof orientation" name="roofOrientation" defaultValue={assessment?.roofOrientation ?? ""} />
        <Field
          label="Available panel space"
          name="availablePanelSpace"
          defaultValue={assessment?.availablePanelSpace ?? ""}
        />
      </div>

      <Field
        label="Existing electrical installation"
        name="existingElectrical"
        defaultValue={assessment?.existingElectrical ?? ""}
        textarea
      />
      <Field
        label="Essential loads"
        name="essentialLoads"
        defaultValue={assessment?.essentialLoads ?? ""}
        textarea
      />
      <Field
        label="Backup requirements"
        name="backupRequirements"
        defaultValue={assessment?.backupRequirements ?? ""}
        textarea
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label="Inverter (kVA)"
          name="recommendedInverterKva"
          type="number"
          step="0.1"
          defaultValue={assessment?.recommendedInverterKva ?? ""}
        />
        <Field
          label="Battery (kWh)"
          name="recommendedBatteryKwh"
          type="number"
          step="0.01"
          defaultValue={assessment?.recommendedBatteryKwh ?? ""}
        />
        <Field
          label="Panels (kW)"
          name="recommendedPanelKw"
          type="number"
          step="0.1"
          defaultValue={assessment?.recommendedPanelKw ?? ""}
        />
      </div>

      <Field
        label="Future expansion requirements"
        name="futureExpansion"
        defaultValue={assessment?.futureExpansion ?? ""}
      />
      <Field label="Notes (required)" name="notes" defaultValue={assessment?.notes ?? ""} textarea required />

      {state?.error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : assessment ? "Update assessment" : "Save assessment"}
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
  textarea,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  defaultValue?: string | number;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          rows={2}
          defaultValue={defaultValue}
          required={required}
          className={inputClass}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          step={step}
          defaultValue={defaultValue}
          required={required}
          className={inputClass}
        />
      )}
    </div>
  );
}
