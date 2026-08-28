-- CreateEnum
CREATE TYPE "BannerStatus" AS ENUM ('Published', 'Archived');

-- CreateTable
CREATE TABLE "banner_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banner_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "status" "BannerStatus" NOT NULL DEFAULT 'Published',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "postedById" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banner_category_name_key" ON "banner_category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "banner_attachmentId_key" ON "banner"("attachmentId");

-- CreateIndex
CREATE INDEX "banner_status_displayOrder_idx" ON "banner"("status", "displayOrder");

-- CreateIndex
CREATE INDEX "banner_categoryId_idx" ON "banner"("categoryId");

-- AddForeignKey
ALTER TABLE "banner" ADD CONSTRAINT "banner_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "banner_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner" ADD CONSTRAINT "banner_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner" ADD CONSTRAINT "banner_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "attachment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
