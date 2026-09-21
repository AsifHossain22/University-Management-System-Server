-- AlterTable
ALTER TABLE "results" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "results_isActive_idx" ON "results"("isActive");

-- CreateIndex
CREATE INDEX "results_deletedAt_idx" ON "results"("deletedAt");
