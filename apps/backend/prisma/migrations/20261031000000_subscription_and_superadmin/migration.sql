-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "restaurants"
ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'STARTER',
ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3),
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "isPlatformOwner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "monthlyFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 799,
ADD COLUMN "billingNotes" TEXT;

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

