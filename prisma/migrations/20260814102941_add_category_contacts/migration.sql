-- CreateTable
CREATE TABLE "CategoryContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "email" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryContact_key_key" ON "CategoryContact"("key");
