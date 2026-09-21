/*
  Warnings:

  - A unique constraint covering the columns `[instructorEmail]` on the table `instructor_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentEmail]` on the table `student_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "instructor_profiles" ADD COLUMN     "instructorEmail" TEXT;

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "studentEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "instructor_profiles_instructorEmail_key" ON "instructor_profiles"("instructorEmail");

-- CreateIndex
CREATE INDEX "instructor_profiles_instructorEmail_idx" ON "instructor_profiles"("instructorEmail");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_studentEmail_key" ON "student_profiles"("studentEmail");

-- CreateIndex
CREATE INDEX "student_profiles_studentEmail_idx" ON "student_profiles"("studentEmail");
