/*
  Warnings:

  - You are about to drop the column `totalMarks` on the `course_grades` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `results` table. All the data in the column will be lost.
  - You are about to drop the column `gradePoint` on the `results` table. All the data in the column will be lost.
  - You are about to drop the column `isPassed` on the `results` table. All the data in the column will be lost.
  - Added the required column `finalMarks` to the `course_grades` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "results_isPassed_idx";

-- AlterTable
ALTER TABLE "course_grades" DROP COLUMN "totalMarks",
ADD COLUMN     "finalMarks" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "results" DROP COLUMN "grade",
DROP COLUMN "gradePoint",
DROP COLUMN "isPassed";
