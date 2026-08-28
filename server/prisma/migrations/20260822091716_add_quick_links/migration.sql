-- CreateEnum
CREATE TYPE "QuickLinkStatus" AS ENUM ('Published', 'Archived');

-- CreateTable
CREATE TABLE "quick_link_category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_link_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quick_link" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "QuickLinkStatus" NOT NULL DEFAULT 'Published',
    "categoryId" INTEGER NOT NULL,
    "postedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quick_link_category_name_key" ON "quick_link_category"("name");

-- CreateIndex
CREATE INDEX "quick_link_status_createdAt_idx" ON "quick_link"("status", "createdAt");

-- CreateIndex
CREATE INDEX "quick_link_categoryId_idx" ON "quick_link"("categoryId");

-- AddForeignKey
ALTER TABLE "quick_link" ADD CONSTRAINT "quick_link_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "quick_link_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quick_link" ADD CONSTRAINT "quick_link_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
