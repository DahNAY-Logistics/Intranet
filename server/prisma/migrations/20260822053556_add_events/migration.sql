-- CreateEnum
CREATE TYPE "EventMode" AS ENUM ('Online', 'Offline', 'Hybrid');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('Published', 'Archived');

-- CreateTable
CREATE TABLE "event_category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'Published',
    "mode" "EventMode" NOT NULL,
    "location" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "postedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_category_name_key" ON "event_category"("name");

-- CreateIndex
CREATE INDEX "event_status_startDate_idx" ON "event"("status", "startDate");

-- CreateIndex
CREATE INDEX "event_categoryId_idx" ON "event"("categoryId");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "event_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
