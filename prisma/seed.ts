import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const TEST_ACCOUNTS = [
  { name: "ELP Admin", email: "admin@elp.co.za", password: "elp-admin-2026", role: "ADMIN" as const },
  { name: "ELP Admin 2", email: "admin2@elp.co.za", password: "elp-admin-2026", role: "ADMIN" as const },
  { name: "Sales Rep", email: "rep@elp.co.za", password: "elp-rep-2026", role: "REP" as const },
  { name: "Sales Rep 2", email: "rep2@elp.co.za", password: "elp-rep-2026", role: "REP" as const },
  { name: "Sales Rep 3", email: "rep3@elp.co.za", password: "elp-rep-2026", role: "REP" as const },
];

async function main() {
  for (const account of TEST_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        name: account.name,
        email: account.email,
        passwordHash,
        role: account.role,
      },
    });
  }

  console.log("Seeded test accounts:");
  for (const account of TEST_ACCOUNTS) {
    console.log(`  ${account.role.padEnd(5)} -> ${account.email} / ${account.password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
