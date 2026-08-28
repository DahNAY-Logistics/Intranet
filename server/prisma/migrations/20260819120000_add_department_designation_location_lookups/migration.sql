-- CreateTable
CREATE TABLE "department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_name_key" ON "department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "designation_name_key" ON "designation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "location_name_key" ON "location"("name");

INSERT INTO "department" ("name", "updatedAt")
SELECT DISTINCT "department", CURRENT_TIMESTAMP FROM "user" WHERE "department" IS NOT NULL;

INSERT INTO "designation" ("name", "updatedAt")
SELECT DISTINCT "designation", CURRENT_TIMESTAMP FROM "user" WHERE "designation" IS NOT NULL;

INSERT INTO "location" ("name", "updatedAt")
SELECT DISTINCT "location", CURRENT_TIMESTAMP FROM "user" WHERE "location" IS NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "designationId" INTEGER,
ADD COLUMN     "locationId" INTEGER;

UPDATE "user" u SET "departmentId" = d."id" FROM "department" d WHERE u."department" = d."name";
UPDATE "user" u SET "designationId" = ds."id" FROM "designation" ds WHERE u."designation" = ds."name";
UPDATE "user" u SET "locationId" = l."id" FROM "location" l WHERE u."location" = l."name";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "department",
DROP COLUMN "designation",
DROP COLUMN "location";

-- CreateIndex
CREATE INDEX "user_departmentId_idx" ON "user"("departmentId");

-- CreateIndex
CREATE INDEX "user_designationId_idx" ON "user"("designationId");

-- CreateIndex
CREATE INDEX "user_locationId_idx" ON "user"("locationId");

-- CreateIndex
CREATE INDEX "user_reportedToId_idx" ON "user"("reportedToId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
