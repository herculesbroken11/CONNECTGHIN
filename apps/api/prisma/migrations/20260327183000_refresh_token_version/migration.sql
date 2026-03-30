-- Add refresh token version for server-side refresh revocation.
ALTER TABLE "User"
ADD COLUMN "refreshTokenVersion" INTEGER NOT NULL DEFAULT 0;
