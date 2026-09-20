-- CreateEnum
CREATE TYPE "InstructorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "instructor_applications" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "bio" TEXT,
    "departmentId" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "status" "InstructorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "userId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instructor_applications_userId_key" ON "instructor_applications"("userId");

-- CreateIndex
CREATE INDEX "instructor_applications_email_idx" ON "instructor_applications"("email");

-- CreateIndex
CREATE INDEX "instructor_applications_status_idx" ON "instructor_applications"("status");

-- CreateIndex
CREATE INDEX "instructor_applications_departmentId_idx" ON "instructor_applications"("departmentId");

-- CreateIndex
CREATE INDEX "instructor_applications_emailVerifiedAt_idx" ON "instructor_applications"("emailVerifiedAt");

-- CreateIndex
CREATE INDEX "instructor_applications_reviewedBy_idx" ON "instructor_applications"("reviewedBy");

-- CreateIndex
CREATE INDEX "instructor_applications_deletedAt_idx" ON "instructor_applications"("deletedAt");

-- AddForeignKey
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_applications" ADD CONSTRAINT "instructor_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
