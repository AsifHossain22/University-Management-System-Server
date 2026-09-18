-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED', 'DROPPED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "course_registrations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_registrations_studentId_idx" ON "course_registrations"("studentId");

-- CreateIndex
CREATE INDEX "course_registrations_sectionId_idx" ON "course_registrations"("sectionId");

-- CreateIndex
CREATE INDEX "course_registrations_status_idx" ON "course_registrations"("status");

-- CreateIndex
CREATE INDEX "course_registrations_registeredAt_idx" ON "course_registrations"("registeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "course_registrations_studentId_sectionId_key" ON "course_registrations"("studentId", "sectionId");

-- AddForeignKey
ALTER TABLE "course_registrations" ADD CONSTRAINT "course_registrations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_registrations" ADD CONSTRAINT "course_registrations_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
