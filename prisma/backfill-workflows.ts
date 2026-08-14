import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { STEP_ORDER } from "../src/lib/workflow/definition";
import type { StepKey } from "../src/lib/workflow/types";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

type LeadStage =
  | "NEW"
  | "QUALIFIED"
  | "ASSESSMENT_BOOKED"
  | "ASSESSED"
  | "QUOTED"
  | "ACCEPTED"
  | "DEPOSIT_PAID"
  | "INSTALLING"
  | "INSTALLED"
  | "LOST";

const STAGE_TO_STEP: Record<LeadStage, StepKey> = {
  NEW: "LEAD_RECEIVED",
  QUALIFIED: "LEAD_RECEIVED",
  ASSESSMENT_BOOKED: "ASSESSMENT",
  ASSESSED: "QUOTATION",
  QUOTED: "ACCEPTANCE",
  ACCEPTED: "DEPOSIT",
  DEPOSIT_PAID: "DELIVERY",
  INSTALLING: "INSTALLATION",
  INSTALLED: "COC",
  LOST: "LEAD_RECEIVED",
};

async function main() {
  const leads = await prisma.lead.findMany({ where: { workflow: null } });
  if (leads.length === 0) {
    console.log("No leads without a workflow — nothing to backfill.");
    return;
  }

  for (const lead of leads) {
    const currentStep = STAGE_TO_STEP[lead.stage as LeadStage];
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    const isLost = lead.stage === "LOST";

    const steps = STEP_ORDER.map((stepKey, index) => {
      if (index < currentIndex) {
        return { stepKey, status: "COMPLETED" as const, completedAt: lead.updatedAt, startedAt: lead.updatedAt };
      }
      if (index === currentIndex) {
        return isLost
          ? { stepKey, status: "COMPLETED" as const, completedAt: lead.updatedAt, startedAt: lead.updatedAt }
          : { stepKey, status: "IN_PROGRESS" as const, startedAt: lead.updatedAt };
      }
      return { stepKey, status: "PENDING" as const };
    });

    const workflow = await prisma.workflowInstance.create({
      data: {
        leadId: lead.id,
        assignedToId: lead.assignedRepId,
        currentStep,
        status: isLost ? "CANCELLED" : "ACTIVE",
        completedAt: isLost ? lead.updatedAt : null,
        startedAt: lead.createdAt,
        steps: { create: steps },
      },
    });

    console.log(`Backfilled workflow ${workflow.id} for lead "${lead.name}" (${lead.stage} -> ${currentStep})`);
  }

  console.log(`Backfilled ${leads.length} workflow(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
