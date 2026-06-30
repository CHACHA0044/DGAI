-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('DRAFT', 'ANALYZING', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3),
    "estimatedHours" DOUBLE PRECISION,
    "tags" TEXT[],
    "status" "TaskStatus" NOT NULL DEFAULT 'DRAFT',
    "aiPriority" INTEGER,
    "riskLevel" "RiskLevel",
    "difficulty" "DifficultyLevel",
    "estimatedCompletion" TEXT,
    "executionPlan" TEXT,
    "productivityAdvice" TEXT,
    "nextImmediateStep" TEXT,
    "potentialBlockers" JSONB,
    "dependencies" JSONB,
    "subtasks" JSONB,
    "analysisMetadata" JSONB,
    "isAnalyzed" BOOLEAN NOT NULL DEFAULT false,
    "analyzedAt" TIMESTAMP(3),
    "analysisError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);
