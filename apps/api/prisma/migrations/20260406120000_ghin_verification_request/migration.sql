-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "ghinVerificationRequestedAt" TIMESTAMP(3),
ADD COLUMN "ghinVerificationRequestNote" TEXT;

-- CreateIndex
CREATE INDEX "Profile_ghinVerificationRequestedAt_idx" ON "Profile"("ghinVerificationRequestedAt");
