export const LEAD_STAGES = [
  "NEW",
  "QUALIFIED",
  "ASSESSMENT_BOOKED",
  "ASSESSED",
  "QUOTED",
  "ACCEPTED",
  "DEPOSIT_PAID",
  "INSTALLING",
  "INSTALLED",
  "LOST",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];

export const STAGE_LABELS: Record<LeadStage, string> = {
  NEW: "New",
  QUALIFIED: "Qualified",
  ASSESSMENT_BOOKED: "Assessment booked",
  ASSESSED: "Assessed",
  QUOTED: "Quoted",
  ACCEPTED: "Accepted",
  DEPOSIT_PAID: "Deposit paid",
  INSTALLING: "Installing",
  INSTALLED: "Installed",
  LOST: "Lost",
};
