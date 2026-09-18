-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "obtainedMarks" DOUBLE PRECISION NOT NULL,
    "grade" TEXT,
    "gradePoint" DOUBLE PRECISION,
    "isPassed" BOOLEAN NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "results_registrationId_idx" ON "results"("registrationId");

-- CreateIndex
CREATE INDEX "results_examId_idx" ON "results"("examId");

-- CreateIndex
CREATE INDEX "results_isPassed_idx" ON "results"("isPassed");

-- CreateIndex
CREATE UNIQUE INDEX "results_registrationId_examId_key" ON "results"("registrationId", "examId");

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "course_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
