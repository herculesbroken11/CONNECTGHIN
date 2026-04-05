-- AlterTable
ALTER TABLE "User" ADD COLUMN "resetTokenSelector" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_resetTokenSelector_key" ON "User"("resetTokenSelector");
