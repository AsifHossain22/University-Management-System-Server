-- AlterTable
ALTER TABLE "instructor_profiles" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "experienceYears" INTEGER,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profileImagePublicId" TEXT,
ADD COLUMN     "profileImageUrl" TEXT,
ADD COLUMN     "qualification" TEXT,
ADD COLUMN     "specialization" TEXT;

-- CreateIndex
CREATE INDEX "instructor_profiles_specialization_idx" ON "instructor_profiles"("specialization");
