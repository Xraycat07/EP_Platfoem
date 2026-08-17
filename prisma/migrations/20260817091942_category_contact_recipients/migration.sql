/*
  Warnings:

  - You are about to drop the column `email` on the `CategoryContact` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "CategoryContactRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryContactId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CategoryContactRecipient_categoryContactId_fkey" FOREIGN KEY ("categoryContactId") REFERENCES "CategoryContact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CategoryContactRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CategoryContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CategoryContact" ("id", "key", "updatedAt") SELECT "id", "key", "updatedAt" FROM "CategoryContact";
DROP TABLE "CategoryContact";
ALTER TABLE "new_CategoryContact" RENAME TO "CategoryContact";
CREATE UNIQUE INDEX "CategoryContact_key_key" ON "CategoryContact"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CategoryContactRecipient_categoryContactId_userId_key" ON "CategoryContactRecipient"("categoryContactId", "userId");
