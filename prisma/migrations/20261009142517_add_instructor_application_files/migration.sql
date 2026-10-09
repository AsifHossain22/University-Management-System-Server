-- AlterTable
ALTER TABLE "instructor_applications" ADD COLUMN     "cvPublicId" TEXT,
ADD COLUMN     "cvUrl" TEXT,
ADD COLUMN     "profilePhotoPublicId" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "supportingDocuments" JSONB;
