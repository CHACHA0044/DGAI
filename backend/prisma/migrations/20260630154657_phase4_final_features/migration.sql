-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('SHORT_TERM', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "HabitFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('TASK_BLOCK', 'HABIT_BLOCK', 'MEETING', 'FREE_TIME', 'BUFFER', 'BREAK');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('PRODUCTIVITY_PATTERN', 'WEEKLY_SUMMARY', 'MONTHLY_SUMMARY', 'FOCUS_SCORE', 'DELAY_ANALYSIS', 'COACHING_TIP');

-- CreateEnum
CREATE TYPE "AppTheme" AS ENUM ('DARK', 'LIGHT', 'SYSTEM');

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "GoalType" NOT NULL DEFAULT 'SHORT_TERM',
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "linkedTaskIds" JSONB NOT NULL DEFAULT '[]',
    "aiEstimation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "HabitFrequency" NOT NULL DEFAULT 'DAILY',
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "completedToday" BOOLEAN NOT NULL DEFAULT false,
    "lastCompletedAt" TIMESTAMP(3),
    "completionHistory" JSONB NOT NULL DEFAULT '[]',
    "aiSuggestion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT,
    "habitId" TEXT,
    "type" "CalendarEventType" NOT NULL DEFAULT 'TASK_BLOCK',
    "source" TEXT NOT NULL DEFAULT 'INTERNAL',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_insights" (
    "id" TEXT NOT NULL,
    "type" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "period" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "workStartHour" INTEGER NOT NULL DEFAULT 9,
    "workEndHour" INTEGER NOT NULL DEFAULT 18,
    "breakDurationMinutes" INTEGER NOT NULL DEFAULT 15,
    "focusIntervalMinutes" INTEGER NOT NULL DEFAULT 50,
    "emergencyThresholdHours" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "theme" "AppTheme" NOT NULL DEFAULT 'DARK',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goals_status_idx" ON "goals"("status");

-- CreateIndex
CREATE INDEX "habits_frequency_idx" ON "habits"("frequency");

-- CreateIndex
CREATE INDEX "calendar_events_startAt_endAt_idx" ON "calendar_events"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "user_insights_type_generatedAt_idx" ON "user_insights"("type", "generatedAt");
