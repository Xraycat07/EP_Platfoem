// Adds randomized test workflows spread across every status — ACTIVE, ON_HOLD,
// COMPLETED, CANCELLED — at random pipeline steps, each with realistic (if
// randomized) captured data for every step it has passed through.
//
// Run with: npx tsx prisma/seed-random-demo.ts
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

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const FIRST_NAMES = [
  "Thabo", "Sarah", "Pieter", "Nomvula", "David", "Zanele", "Johan", "Aisha",
  "Sipho", "Emma", "Lerato", "Michael", "Precious", "Andre", "Fatima",
  "Bongani", "Chantelle", "Kagiso", "Ryan", "Nokuthula",
] as const;
const LAST_NAMES = [
  "Nkosi", "van der Merwe", "Mahlangu", "Botha", "Dlamini", "Naidoo", "Smith",
  "Khumalo", "Pretorius", "Mokoena", "Fourie", "Zulu", "Steyn", "Mabaso", "Human",
] as const;
const SUBURBS = [
  "Faerie Glen", "Centurion Central", "Waterkloof", "Menlyn", "Brooklyn",
  "Garsfontein", "Silver Lakes", "Moreleta Park", "Wapadrand", "Highveld",
] as const;
const AREAS = ["Pretoria East", "Centurion", "Pretoria North", "Pretoria West", "Midrand"] as const;
const OBJECTIVES = [
  "Reduce Eskom bill",
  "Backup during load shedding",
  "Full energy independence",
  "Backup for essential loads only",
  "Reduce bill and add backup",
] as const;
const ELECTRICIANS = ["J. van Wyk Electrical", "PowerSafe Electricians", "Test Electrician CC"] as const;

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

const TIER_POOL = [
  { name: "ELP Essential", panelKw: 4.9, inverterKva: 5, batteryKwh: 5.12, base: 98500 },
  { name: "ELP Independence", panelKw: 7.4, inverterKva: 8, batteryKwh: 10.24, base: 154000 },
  { name: "ELP Premium", panelKw: 9.9, inverterKva: 10, batteryKwh: 15.36, base: 219000 },
] as const;

async function populateCompletedStepRandom(
  workflowId: string,
  leadId: string,
  stepKey: StepKey,
  actorId: string,
  when: Date
) {
  switch (stepKey) {
    case "ASSESSMENT": {
      const tier = pick(TIER_POOL);
      const assessment = await prisma.assessment.create({
        data: {
          leadId,
          scheduledFor: when,
          eskomSupply: pick(["Single phase, 60A", "Three phase, 80A", "Single phase, 40A"]),
          dbBoard: pick(["Standard board, room for sub-board", "Older board, needs upgrade"]),
          roofType: pick(["Tiled, north-facing", "IBR sheeting, west-facing", "Flat concrete roof"]),
          roofOrientation: pick(["North", "North-East", "West"]),
          availablePanelSpace: `~${randomInt(20, 45)} m²`,
          existingElectrical: "Standard installation, no prior solar",
          essentialLoads: "Lights, fridge, wifi, garage door",
          backupRequirements: pick(["Essential loads only", "Full home backup"]),
          recommendedInverterKva: tier.inverterKva,
          recommendedBatteryKwh: tier.batteryKwh,
          recommendedPanelKw: tier.panelKw,
          futureExpansion: pick(["None planned", "Possible pool pump", "EV charger in future"]),
          notes: "Randomized test assessment data.",
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

    case "QUOTATION": {
      const chosenCount = randomInt(1, 3);
      const chosen = [...TIER_POOL].sort(() => Math.random() - 0.5).slice(0, chosenCount);
      await prisma.quote.create({
        data: {
          leadId,
          status: "SENT",
          sentAt: when,
          tiers: {
            create: chosen.map((t, i) => ({
              name: t.name,
              tagline: "Randomized test tier",
              panelKw: t.panelKw,
              inverterKva: t.inverterKva,
              batteryKwh: t.batteryKwh,
              estMonthlyProductionKwh: Math.round(t.panelKw * 130),
              backupDescription: "Backup during outages",
              price: t.base + randomInt(-4000, 4000),
              warrantyYears: 10,
              isRecommended: i === Math.floor(chosen.length / 2),
              sortOrder: i + 1,
            })),
          },
        },
      });
      break;
    }

    case "ACCEPTANCE": {
      const quote = await prisma.quote.findFirst({ where: { leadId }, orderBy: { createdAt: "desc" } });
      if (quote) {
        await prisma.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED", respondedAt: when } });
      }
      break;
    }

    case "DEPOSIT":
      await prisma.payment.create({
        data: {
          workflowId,
          type: "DEPOSIT",
          amount: randomInt(15000, 60000),
          reference: `EFT-${randomInt(10000, 99999)}`,
          paidAt: when,
        },
      });
      break;

    case "DELIVERY":
      await prisma.delivery.create({
        data: {
          workflowId,
          scheduledFor: when,
          deliveredAt: when,
          items: pick([
            "8x panels, 1x inverter, 1x battery",
            "12x panels, 1x inverter, 2x battery",
            "6x panels, 1x inverter, 1x battery",
          ]),
          notes: "Randomized test delivery data.",
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
          installedById: actorId,
          notes: "Randomized test installation data.",
        },
      });
      break;

    case "COC":
      await prisma.coc.create({
        data: {
          workflowId,
          certificateNo: `COC-${randomInt(10000, 99999)}`,
          issuedAt: when,
          issuedBy: pick(ELECTRICIANS),
        },
      });
      break;

    case "MAINTENANCE_SETUP":
      await prisma.maintenanceRecord.create({
        data: {
          workflowId,
          planType: pick(["Annual check", "Bi-annual check", "Quarterly check"]),
          scheduledFor: when,
          notes: "Randomized test maintenance setup.",
        },
      });
      break;

    case "AFTER_SALES": {
      const resolved = Math.random() < 0.5;
      await prisma.afterSalesTicket.create({
        data: {
          workflowId,
          subject: pick(["Inverter fault light", "App not syncing", "Battery charge query", "General check-in"]),
          status: resolved ? "RESOLVED" : "OPEN",
          raisedAt: when,
          resolvedAt: resolved ? when : null,
          notes: "Randomized test after-sales data.",
        },
      });
      break;
    }

    case "REFERRALS":
      await prisma.referral.create({
        data: {
          workflowId,
          contactName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
          contactPhone: `082${String(randomInt(1000000, 9999999))}`,
          notes: "Randomized test referral data.",
        },
      });
      break;

    case "LEAD_RECEIVED":
      break;
  }
}

function randomLeadData(assignedRepId: string) {
  return {
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    phone: `083${String(randomInt(1000000, 9999999))}`,
    suburb: pick(SUBURBS),
    area: pick(AREAS),
    monthlyBill: randomInt(1200, 4500),
    propertyType: pick(["Residential", "Smallholding", "Townhouse"]),
    hasExistingSolar: Math.random() < 0.15,
    objective: pick(OBJECTIVES),
    source: pick(["Google Ads", "Referral", "Facebook", "Walk-in", "Website enquiry"]),
    assignedRepId,
    stage: "NEW" as const,
  };
}

async function createWorkflowAtStep(
  targetIdx: number,
  status: "ACTIVE" | "ON_HOLD" | "CANCELLED",
  actors: { id: string }[],
  label: string
) {
  const actor = pick(actors);
  const lead = await prisma.lead.create({ data: randomLeadData(actor.id) });

  const targetStep = STEP_ORDER[targetIdx];
  const steps = STEP_ORDER.map((stepKey, i) => {
    if (i < targetIdx) {
      return {
        stepKey,
        status: "COMPLETED" as const,
        startedAt: daysAgo((targetIdx - i) * 3 + 2),
        completedAt: daysAgo((targetIdx - i) * 3),
        completedById: actor.id,
        notes: `Completed ${STEP_TITLES[stepKey]} (randomized test data).`,
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
      assignedToId: actor.id,
      currentStep: targetStep,
      status: "ACTIVE",
      startedAt: daysAgo(targetIdx * 3 + 5),
      steps: { create: steps },
    },
  });

  for (let i = 0; i < targetIdx; i++) {
    await populateCompletedStepRandom(workflow.id, lead.id, STEP_ORDER[i], actor.id, daysAgo((targetIdx - i) * 3));
  }

  if (status === "ON_HOLD") {
    await prisma.workflowInstance.update({ where: { id: workflow.id }, data: { status: "ON_HOLD" } });
    await prisma.workflowEvent.create({
      data: {
        workflowId: workflow.id,
        type: "HOLD",
        message: "Put on hold",
        comment: pick(["Client requested a pause", "Waiting on municipal approval", "Client travelling, resume next month"]),
        actorId: actor.id,
      },
    });
  } else if (status === "CANCELLED") {
    const reason = pick(["Client went with another installer", "Budget put on hold", "No longer proceeding"]);
    await prisma.workflowInstance.update({
      where: { id: workflow.id },
      data: { status: "CANCELLED", completedAt: daysAgo(0), metadata: { cancelReason: reason } },
    });
    await prisma.workflowEvent.create({
      data: {
        workflowId: workflow.id,
        type: "CANCEL",
        message: "Workflow cancelled",
        comment: reason,
        actorId: actor.id,
      },
    });
  }

  console.log(`[${label}] "${lead.name}" -> ${targetStep} (${status}, ${targetIdx} prior step(s) completed)`);
}

async function createCompletedWorkflow(actors: { id: string }[]) {
  const actor = pick(actors);
  const lead = await prisma.lead.create({ data: randomLeadData(actor.id) });

  const lastIdx = STEP_ORDER.length - 1;
  const steps = STEP_ORDER.map((stepKey, i) => ({
    stepKey,
    status: "COMPLETED" as const,
    startedAt: daysAgo((lastIdx - i) * 3 + 2),
    completedAt: daysAgo((lastIdx - i) * 3),
    completedById: actor.id,
    notes: `Completed ${STEP_TITLES[stepKey]} (randomized test data).`,
  }));

  const workflow = await prisma.workflowInstance.create({
    data: {
      leadId: lead.id,
      assignedToId: actor.id,
      currentStep: STEP_ORDER[lastIdx],
      status: "COMPLETED",
      startedAt: daysAgo(lastIdx * 3 + 5),
      completedAt: daysAgo(0),
      steps: { create: steps },
    },
  });

  for (let i = 0; i < STEP_ORDER.length; i++) {
    await populateCompletedStepRandom(workflow.id, lead.id, STEP_ORDER[i], actor.id, daysAgo((lastIdx - i) * 3));
  }

  console.log(`[COMPLETED] "${lead.name}" -> finished the full pipeline`);
}

async function main() {
  const reps = await prisma.user.findMany({ where: { role: "REP" } });
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  const actors = [...reps, ...admins];
  if (actors.length === 0) {
    throw new Error("No users found — run `npx tsx prisma/seed.ts` first.");
  }

  for (let i = 0; i < 4; i++) {
    await createWorkflowAtStep(randomInt(0, STEP_ORDER.length - 1), "ACTIVE", actors, "ACTIVE");
  }
  for (let i = 0; i < 3; i++) {
    await createWorkflowAtStep(randomInt(0, STEP_ORDER.length - 1), "ON_HOLD", actors, "ON_HOLD");
  }
  for (let i = 0; i < 3; i++) {
    await createWorkflowAtStep(randomInt(0, STEP_ORDER.length - 1), "CANCELLED", actors, "CANCELLED");
  }
  for (let i = 0; i < 3; i++) {
    await createCompletedWorkflow(actors);
  }

  console.log("\nDone — 13 randomized workflows created across ACTIVE, ON_HOLD, COMPLETED and CANCELLED.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
