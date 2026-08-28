-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('VeryHappy', 'Happy', 'Neutral', 'Sad', 'VerySad');

-- CreateTable
CREATE TABLE "mood_check_in" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_check_in_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_entry" (
    "id" SERIAL NOT NULL,
    "mood" "Mood" NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mood_check_in_userId_date_key" ON "mood_check_in"("userId", "date");

-- CreateIndex
CREATE INDEX "mood_entry_date_idx" ON "mood_entry"("date");

-- AddForeignKey
ALTER TABLE "mood_check_in" ADD CONSTRAINT "mood_check_in_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
