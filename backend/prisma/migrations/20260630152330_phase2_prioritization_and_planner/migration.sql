-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "lastPrioritizedAt" TIMESTAMP(3),
ADD COLUMN     "priorityLabel" TEXT,
ADD COLUMN     "priorityReason" TEXT,
ADD COLUMN     "priorityScore" INTEGER;

-- CreateTable
CREATE TABLE "daily_plans" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "schedule" JSONB NOT NULL,
    "suggestedOrder" JSONB NOT NULL,
    "recommendedBreaks" JSONB NOT NULL,
    "expectedFinishTime" TEXT NOT NULL,
    "tasksToPostpone" JSONB NOT NULL,
    "mostImportantTask" TEXT NOT NULL,
    "recommendedFocusSession" TEXT NOT NULL,
    "quickWins" JSONB NOT NULL,
    "highEffortWork" JSONB NOT NULL,
    "deepWorkBlocks" JSONB NOT NULL,
    "isFallback" BOOLEAN NOT NULL DEFAULT false,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_plans_date_key" ON "daily_plans"("date");
