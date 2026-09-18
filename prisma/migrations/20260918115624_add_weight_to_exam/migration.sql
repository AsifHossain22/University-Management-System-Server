/*
  Warnings:

  - Added the required column `weight` to the `exams` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "course_grades" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "gradePoint" DOUBLE PRECISION NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_grades_registrationId_key" ON "course_grades"("registrationId");

-- CreateIndex
CREATE INDEX "course_grades_grade_idx" ON "course_grades"("grade");

-- CreateIndex
CREATE INDEX "course_grades_isPassed_idx" ON "course_grades"("isPassed");

-- AddForeignKey
ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "course_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
