-- AlterTable
ALTER TABLE "customers" ADD COLUMN "customerType" TEXT DEFAULT 'REGULAR',
ADD COLUMN "whatsappOptIn" BOOLEAN NOT NULL DEFAULT true;
