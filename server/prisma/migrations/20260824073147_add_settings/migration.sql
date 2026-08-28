-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "siteName" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "supportEmail" TEXT NOT NULL,
    "codeOfConductUrl" TEXT,
    "privacyPolicyUrl" TEXT,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
