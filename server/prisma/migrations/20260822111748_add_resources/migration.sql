-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('Published', 'Archived');

-- CreateTable
CREATE TABLE "resource_category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT,
    "status" "ResourceStatus" NOT NULL DEFAULT 'Published',
    "categoryId" INTEGER NOT NULL,
    "postedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_category_name_key" ON "resource_category"("name");

-- CreateIndex
CREATE INDEX "resource_status_createdAt_idx" ON "resource"("status", "createdAt");

-- CreateIndex
CREATE INDEX "resource_categoryId_idx" ON "resource"("categoryId");

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "resource_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
