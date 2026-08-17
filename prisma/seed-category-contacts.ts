// Creates one login account per pipeline category and sets it as that
// category's contact, so Settings > Category contacts has real accounts to
// pick from out of the box.
//
// Run with: npx tsx prisma/seed-category-contacts.ts
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { STEP_GROUPS } from "../src/lib/workflow/definition";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const CONTACT_PASSWORD = "elp-contact-2026";

function emailFor(groupKey: string) {
  return `${groupKey.toLowerCase().replace(/_/g, "")}@elp.co.za`;
}

async function main() {
  const passwordHash = await bcrypt.hash(CONTACT_PASSWORD, 10);

  for (const group of STEP_GROUPS) {
    const email = emailFor(group.key);
    const name = `${group.label} Team`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, passwordHash, role: "REP" },
    });

    const contact = await prisma.categoryContact.upsert({
      where: { key: group.key },
      create: { key: group.key },
      update: {},
    });
    await prisma.categoryContactRecipient.deleteMany({ where: { categoryContactId: contact.id } });
    await prisma.categoryContactRecipient.create({
      data: { categoryContactId: contact.id, userId: user.id },
    });

    console.log(`${group.label}: ${name} <${email}> set as category contact`);
  }

  console.log(`\nDone — login for each contact: <email> / ${CONTACT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
