export const STEP_KEYS = [
  "LEAD_RECEIVED",
  "ASSESSMENT",
  "QUOTATION",
  "ACCEPTANCE",
  "DEPOSIT",
  "DELIVERY",
  "INSTALLATION",
  "COC",
  "MAINTENANCE_SETUP",
  "AFTER_SALES",
  "REFERRALS",
] as const;

export type StepKey = (typeof STEP_KEYS)[number];

export const STEP_LABELS: Record<StepKey, string> = {
  LEAD_RECEIVED: "Lead received",
  ASSESSMENT: "Assessment",
  QUOTATION: "Quotation",
  ACCEPTANCE: "Acceptance",
  DEPOSIT: "Deposit",
  DELIVERY: "Delivery",
  INSTALLATION: "Installation",
  COC: "COC",
  MAINTENANCE_SETUP: "Maintenance setup",
  AFTER_SALES: "After-sales",
  REFERRALS: "Referrals",
};

export const WORKFLOW_STATUSES = ["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const STEP_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];
