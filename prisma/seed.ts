import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { STEP_ORDER } from "../src/lib/workflow/definition";
import type { StepKey } from "../src/lib/workflow/types";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function buildSteps(currentStep: StepKey) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const now = new Date();
  return STEP_ORDER.map((stepKey, index) => {
    if (index < currentIndex) {
      return { stepKey, status: "COMPLETED" as const, startedAt: now, completedAt: now };
    }
    if (index === currentIndex) {
      return { stepKey, status: "IN_PROGRESS" as const, startedAt: now };
    }
    return { stepKey, status: "PENDING" as const };
  });
}

async function main() {
  const adminPassword = await bcrypt.hash("elp-admin-2026", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@elp.co.za" },
    update: {},
    create: {
      name: "EP Admin",
      email: "admin@elp.co.za",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const repPassword = await bcrypt.hash("elp-rep-2026", 10);
  const rep = await prisma.user.upsert({
    where: { email: "rep@elp.co.za" },
    update: {},
    create: {
      name: "Sales Rep",
      email: "rep@elp.co.za",
      passwordHash: repPassword,
      role: "REP",
    },
  });

  const existing = await prisma.lead.findFirst({
    where: { phone: "0821234567" },
  });

  if (!existing) {
    const lead = await prisma.lead.create({
      data: {
        name: "Johan Botha",
        phone: "0821234567",
        suburb: "Faerie Glen",
        area: "Pretoria East",
        monthlyBill: 3200,
        propertyType: "Residential",
        hasExistingSolar: false,
        objective: "Backup during load shedding, reduce Eskom bill",
        source: "Google Ads - solar installer Pretoria East",
        stage: "QUOTED",
        assignedRepId: rep.id,
        assessment: {
          create: {
            scheduledFor: new Date(),
            eskomSupply: "Single phase, 60A",
            dbBoard: "Older board, needs essential loads sub-board",
            roofType: "Tiled, north-facing",
            roofOrientation: "North",
            availablePanelSpace: "~35 m²",
            existingElectrical: "Standard, no prior solar",
            essentialLoads: "Lights, fridge, wifi, garage door, 2x TV",
            backupRequirements: "Full home backup during outages",
            recommendedInverterKva: 8,
            recommendedBatteryKwh: 10.24,
            recommendedPanelKw: 7.4,
            futureExpansion: "Pool pump in 12 months",
            notes: "Good roof, no shading. Client price sensitive but wants reliability.",
          },
        },
        quotes: {
          create: {
            status: "SENT",
            sentAt: new Date(),
            tiers: {
              create: [
                {
                  name: "EP Essential",
                  tagline: "Backup for essential household loads",
                  panelKw: 4.9,
                  inverterKva: 5,
                  batteryKwh: 5.12,
                  estMonthlyProductionKwh: 650,
                  backupDescription: "Lights, wifi, fridge, TVs during outages",
                  price: 98500,
                  warrantyYears: 10,
                  sortOrder: 1,
                },
                {
                  name: "EP Independence",
                  tagline: "Solar + battery designed to substantially reduce grid dependence",
                  panelKw: 7.4,
                  inverterKva: 8,
                  batteryKwh: 10.24,
                  estMonthlyProductionKwh: 980,
                  backupDescription: "Full home backup, including garage and geyser",
                  price: 154000,
                  warrantyYears: 10,
                  isRecommended: true,
                  sortOrder: 2,
                },
                {
                  name: "EP Premium",
                  tagline: "Larger generation and battery capacity with greater backup capability",
                  panelKw: 9.9,
                  inverterKva: 10,
                  batteryKwh: 15.36,
                  estMonthlyProductionKwh: 1320,
                  backupDescription: "Full home backup with room for pool pump expansion",
                  price: 219000,
                  warrantyYears: 10,
                  sortOrder: 3,
                },
              ],
            },
          },
        },
        workflow: {
          create: {
            assignedToId: rep.id,
            currentStep: "ACCEPTANCE",
            steps: { create: buildSteps("ACCEPTANCE") },
          },
        },
      },
    });

    await prisma.lead.create({
      data: {
        name: "Naledi Khumalo",
        phone: "0837654321",
        suburb: "Centurion Central",
        area: "Centurion",
        monthlyBill: 1800,
        propertyType: "Residential",
        hasExistingSolar: false,
        objective: "Reduce Eskom bill",
        source: "Google Ads - solar company Centurion",
        stage: "NEW",
        assignedRepId: rep.id,
        workflow: {
          create: {
            assignedToId: rep.id,
            currentStep: "LEAD_RECEIVED",
            steps: { create: buildSteps("LEAD_RECEIVED") },
          },
        },
      },
    });

    console.log(`Seeded lead ${lead.id} with assessment, quote and workflow.`);
  }

  console.log("Seeded users:");
  console.log(`  Admin -> ${admin.email} / elp-admin-2026`);
  console.log(`  Rep   -> ${rep.email} / elp-rep-2026`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
