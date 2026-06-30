-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "completionProb" DOUBLE PRECISION,
ADD COLUMN     "lastRiskAnalysisAt" TIMESTAMP(3),
ADD COLUMN     "missProbability" DOUBLE PRECISION,
ADD COLUMN     "recoveryPlan" JSONB,
ADD COLUMN     "riskScore" INTEGER,
ADD COLUMN     "timeDeficit" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planner_metrics" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planner_metrics_pkey" PRIMARY KEY ("id")
);
