// Creates one test workflow per pipeline step (11 total), each sitting at a
// different step with every step before it fully completed and populated
// with realistic domain data — so the dashboard shows every step/category
// occupied, and each workflow's History tab has something real to expand.
//
// Run with: npx tsx prisma/seed-pipeline-demo.ts
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { STEP_ORDER } from "../src/lib/workflow/definition";
import type { StepKey } from "../src/lib/workflow/types";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const now = new Date();
function daysAgo(n: number) {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
}

const STEP_TITLES: Record<StepKey, string> = {
  LEAD_RECEIVED: "Lead Received",
  ASSESSMENT: "Assessment",
  QUOTATION: "Quotation",
  ACCEPTANCE: "Acceptance",
  DEPOSIT: "Deposit",
  DELIVERY: "Delivery",
  INSTALLATION: "Installation",
  COC: "COC",
  MAINTENANCE_SETUP: "Maintenance Setup",
  AFTER_SALES: "After Sales",
  REFERRALS: "Referrals",
};

// Writes the domain record a real completion of `stepKey` would have created,
// so the History tab's "what was captured" view has real data to show.
async function populateCompletedStep(
  workflowId: string,
  leadId: string,
  stepKey: StepKey,
  installerId: string,
  when: Date
) {
  switch (stepKey) {
    case "ASSESSMENT": {
      const assessment = await prisma.assessment.create({
        data: {
          leadId,
          scheduledFor: when,
          eskomSupply: "Single phase, 60A",
          dbBoard: "Standard board, room for essential loads sub-board",
          roofType: "Tiled, north-facing",
          roofOrientation: "North",
          availablePanelSpace: "~30 m²",
          existingElectrical: "Standard installation, no prior solar",
          essentialLoads: "Lights, fridge, wifi, garage door",
          backupRequirements: "Essential loads backup during outages",
          recommendedInverterKva: 5,
          recommendedBatteryKwh: 5.12,
          recommendedPanelKw: 4.9,
          futureExpansion: "Possible pool pump in future",
          notes: "Test assessment data.",
        },
      });
      await prisma.image.create({
        data: {
          assessmentId: assessment.id,
          url: "https://placehold.co/640x480?text=Roof+photo",
          caption: "Roof overview (test data)",
        },
      });
      break;
    }

    case "QUOTATION":
      await prisma.quote.create({
        data: {
          leadId,
          status: "SENT",
          sentAt: when,
          tiers: {
            create: [
              {
                name: "ELP Essential",
                tagline: "Backup for essential household loads",
                panelKw: 4.9,
                inverterKva: 5,
                batteryKwh: 5.12,
                estMonthlyProductionKwh: 650,
                backupDescription: "Lights, wifi, fridge during outages",
                price: 98500,
                warrantyYears: 10,
                sortOrder: 1,
              },
              {
                name: "ELP Independence",
                tagline: "Solar + battery to substantially reduce grid dependence",
                panelKw: 7.4,
                inverterKva: 8,
                batteryKwh: 10.24,
                estMonthlyProductionKwh: 980,
                backupDescription: "Full home backup",
                price: 154000,
                warrantyYears: 10,
                isRecommended: true,
                sortOrder: 2,
              },
            ],
          },
        },
      });
      break;

    case "ACCEPTANCE": {
      const quote = await prisma.quote.findFirst({ where: { leadId }, orderBy: { createdAt: "desc" } });
      if (quote) {
        await prisma.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED", respondedAt: when } });
      }
      break;
    }

    case "DEPOSIT":
      await prisma.payment.create({
        data: { workflowId, type: "DEPOSIT", amount: 30000, reference: "EFT-TEST-0001", paidAt: when },
      });
      break;

    case "DELIVERY":
      await prisma.delivery.create({
        data: {
          workflowId,
          scheduledFor: when,
          deliveredAt: when,
          items: "8x panels, 1x inverter, 1x battery",
          notes: "Test delivery data.",
        },
      });
      break;

    case "INSTALLATION":
      await prisma.installation.create({
        data: {
          workflowId,
          scheduledFor: when,
          startedAt: when,
          completedAt: when,
          installedById: installerId,
          notes: "Test installation data.",
        },
      });
      break;

    case "COC":
      await prisma.coc.create({
        data: { workflowId, certificateNo: "COC-TEST-0001", issuedAt: when, issuedBy: "Test Electrician" },
      });
      break;

    case "MAINTENANCE_SETUP":
      await prisma.maintenanceRecord.create({
        data: { workflowId, planType: "Annual check", scheduledFor: when, notes: "Test maintenance setup." },
      });
      break;

    case "AFTER_SALES":
      await prisma.afterSalesTicket.create({
        data: {
          workflowId,
          subject: "Test support ticket",
          status: "RESOLVED",
          raisedAt: when,
          resolvedAt: when,
          notes: "Test after-sales data.",
        },
      });
      break;

    case "REFERRALS":
      await prisma.referral.create({
        data: { workflowId, contactName: "Test Referral Contact", contactPhone: "0820000000", notes: "Test referral data." },
      });
      break;

    case "LEAD_RECEIVED":
      // Captured on the lead itself (source/objective) — nothing extra to write.
      break;
  }
}

async function main() {
  const reps = await prisma.user.findMany({ where: { role: "REP" }, orderBy: { email: "asc" } });
  if (reps.length === 0) {
    throw new Error("No REP users found — run `npx tsx prisma/seed.ts` first.");
  }

  for (const [targetIdx, targetStep] of STEP_ORDER.entries()) {
    const rep = reps[targetIdx % reps.length];

    const lead = await prisma.lead.create({
      data: {
        name: `Test Client — ${STEP_TITLES[targetStep]}`,
        phone: `082${String(1000000 + targetIdx).slice(-7)}`,
        suburb: "Test Suburb",
        area: "Test Area",
        monthlyBill: 2200,
        propertyType: "Residential",
        hasExistingSolar: false,
        objective: "Reduce Eskom bill and add backup power",
        source: "Seed script — pipeline demo data",
        assignedRepId: rep.id,
        stage: "NEW",
      },
    });

    const steps = STEP_ORDER.map((stepKey, i) => {
      if (i < targetIdx) {
        return {
          stepKey,
          status: "COMPLETED" as const,
          startedAt: daysAgo((targetIdx - i) * 3 + 2),
          completedAt: daysAgo((targetIdx - i) * 3),
          completedById: rep.id,
          notes: `Completed ${STEP_TITLES[stepKey]} (test data).`,
        };
      }
      if (i === targetIdx) {
        return { stepKey, status: "IN_PROGRESS" as const, startedAt: daysAgo(0) };
      }
      return { stepKey, status: "PENDING" as const };
    });

    const workflow = await prisma.workflowInstance.create({
      data: {
        leadId: lead.id,
        assignedToId: rep.id,
        currentStep: targetStep,
        status: "ACTIVE",
        startedAt: daysAgo(targetIdx * 3 + 2),
        steps: { create: steps },
      },
    });

    for (let i = 0; i < targetIdx; i++) {
      await populateCompletedStep(workflow.id, lead.id, STEP_ORDER[i], rep.id, daysAgo((targetIdx - i) * 3));
    }

    console.log(`Created "${lead.name}" -> sitting at ${targetStep} (${targetIdx} prior step(s) completed with data)`);
  }

  console.log(`\nDone — ${STEP_ORDER.length} test workflows created, one per pipeline step.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
