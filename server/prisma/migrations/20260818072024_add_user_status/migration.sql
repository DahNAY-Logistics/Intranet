-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Inactive');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'Active';

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");
