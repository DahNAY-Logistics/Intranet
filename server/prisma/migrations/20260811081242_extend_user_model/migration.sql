/*
  Warnings:

  - A unique constraint covering the columns `[employeeId]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "department" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "joinedDate" TIMESTAMP(3),
ADD COLUMN     "location" TEXT;

-- CreateTable
CREATE TABLE "_Reporting" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Reporting_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_Reporting_B_index" ON "_Reporting"("B");

-- CreateIndex
CREATE UNIQUE INDEX "user_employeeId_key" ON "user"("employeeId");

-- AddForeignKey
ALTER TABLE "_Reporting" ADD CONSTRAINT "_Reporting_A_fkey" FOREIGN KEY ("A") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Reporting" ADD CONSTRAINT "_Reporting_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
