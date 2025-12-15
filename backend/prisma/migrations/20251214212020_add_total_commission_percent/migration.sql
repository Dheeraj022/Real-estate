/*
  Warnings:

  - Added the required column `totalCommissionPercent` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT NOT NULL DEFAULT '[]',
    "totalCommissionPercent" REAL NOT NULL,
    "sellerPercent" REAL NOT NULL,
    "level1Percent" REAL NOT NULL,
    "level2Percent" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Property" ("createdAt", "description", "id", "images", "level1Percent", "level2Percent", "location", "name", "price", "sellerPercent", "status", "updatedAt", "totalCommissionPercent") SELECT "createdAt", "description", "id", "images", "level1Percent", "level2Percent", "location", "name", "price", "sellerPercent", "status", "updatedAt", ("sellerPercent" + "level1Percent" + "level2Percent") FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE INDEX "Property_status_idx" ON "Property"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
