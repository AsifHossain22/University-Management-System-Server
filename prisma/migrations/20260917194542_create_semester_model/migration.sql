-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "semesters_code_key" ON "semesters"("code");

-- CreateIndex
CREATE INDEX "semesters_isActive_idx" ON "semesters"("isActive");

-- CreateIndex
CREATE INDEX "semesters_startDate_idx" ON "semesters"("startDate");

-- CreateIndex
CREATE INDEX "semesters_endDate_idx" ON "semesters"("endDate");

-- CreateIndex
CREATE INDEX "semesters_deletedAt_idx" ON "semesters"("deletedAt");
