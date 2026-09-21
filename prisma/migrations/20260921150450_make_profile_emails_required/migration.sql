/*
  Warnings:

  - Made the column `instructorEmail` on table `instructor_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `studentEmail` on table `student_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "instructor_profiles" ALTER COLUMN "instructorEmail" SET NOT NULL;

-- AlterTable
ALTER TABLE "student_profiles" ALTER COLUMN "studentEmail" SET NOT NULL;
