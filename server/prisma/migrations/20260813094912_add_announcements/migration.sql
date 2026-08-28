-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('Published', 'Archived');

-- CreateTable
CREATE TABLE "announcement_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'Published',
    "categoryId" TEXT NOT NULL,
    "postedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "announcement_category_name_key" ON "announcement_category"("name");

-- CreateIndex
CREATE INDEX "announcement_status_createdAt_idx" ON "announcement"("status", "createdAt");

-- CreateIndex
CREATE INDEX "announcement_categoryId_idx" ON "announcement"("categoryId");

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "announcement_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
