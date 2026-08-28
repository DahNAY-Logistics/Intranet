/*
  Warnings:

  - The primary key for the `announcement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `announcement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `announcement_category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `announcement_category` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `attachment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `attachment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `banner` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `banner` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `banner_category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `banner_category` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `_Reporting` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `categoryId` on the `announcement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `announcement_category` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `categoryId` on the `banner` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `attachmentId` on the `banner` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `banner_category` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_Reporting" DROP CONSTRAINT "_Reporting_A_fkey";

-- DropForeignKey
ALTER TABLE "_Reporting" DROP CONSTRAINT "_Reporting_B_fkey";

-- DropForeignKey
ALTER TABLE "announcement" DROP CONSTRAINT "announcement_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "banner" DROP CONSTRAINT "banner_attachmentId_fkey";

-- DropForeignKey
ALTER TABLE "banner" DROP CONSTRAINT "banner_categoryId_fkey";

-- AlterTable
ALTER TABLE "announcement" DROP CONSTRAINT "announcement_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "categoryId",
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD CONSTRAINT "announcement_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "announcement_category" DROP CONSTRAINT "announcement_category_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "announcement_category_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "attachment" DROP CONSTRAINT "attachment_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "attachment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "banner" DROP CONSTRAINT "banner_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "categoryId",
ADD COLUMN     "categoryId" INTEGER NOT NULL,
DROP COLUMN "attachmentId",
ADD COLUMN     "attachmentId" INTEGER NOT NULL,
ADD CONSTRAINT "banner_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "banner_category" DROP CONSTRAINT "banner_category_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "banner_category_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "reportedToId" TEXT;

-- DropTable
DROP TABLE "_Reporting";

-- CreateIndex
CREATE INDEX "announcement_categoryId_idx" ON "announcement"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "banner_attachmentId_key" ON "banner"("attachmentId");

-- CreateIndex
CREATE INDEX "banner_categoryId_idx" ON "banner"("categoryId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_reportedToId_fkey" FOREIGN KEY ("reportedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner" ADD CONSTRAINT "banner_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "banner_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner" ADD CONSTRAINT "banner_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "attachment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "announcement_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
