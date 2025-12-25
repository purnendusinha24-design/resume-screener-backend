-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "reasons" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Resume_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
