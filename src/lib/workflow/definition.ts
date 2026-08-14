import { STEP_KEYS, type StepKey } from "./types";

export const STEP_ORDER: StepKey[] = [...STEP_KEYS];

export function stepIndex(step: StepKey): number {
  return STEP_ORDER.indexOf(step);
}

export function nextStep(step: StepKey): StepKey | null {
  const index = stepIndex(step);
  return index === -1 || index === STEP_ORDER.length - 1 ? null : STEP_ORDER[index + 1];
}

export function canReturnTo(currentStep: StepKey, targetStep: StepKey): boolean {
  return stepIndex(targetStep) <= stepIndex(currentStep);
}

export const STEP_GROUPS: { key: string; label: string; steps: StepKey[] }[] = [
  { key: "LEAD_ASSESSMENT", label: "Lead & Assessment", steps: ["LEAD_RECEIVED", "ASSESSMENT"] },
  { key: "SALES", label: "Sales", steps: ["QUOTATION", "ACCEPTANCE", "DEPOSIT", "DELIVERY"] },
  { key: "FULFILLMENT", label: "Fulfillment", steps: ["INSTALLATION", "COC", "MAINTENANCE_SETUP"] },
  { key: "AFTER_SALES", label: "After-sales", steps: ["AFTER_SALES", "REFERRALS"] },
];

export function groupForStep(step: StepKey): string {
  return STEP_GROUPS.find((g) => g.steps.includes(step))?.label ?? "";
}

export function groupKeyForStep(step: StepKey): string | null {
  return STEP_GROUPS.find((g) => g.steps.includes(step))?.key ?? null;
}
