-- AlterTable
ALTER TABLE "user_actions" ADD COLUMN     "category" TEXT,
ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "sender" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "threadId" TEXT;

-- CreateTable
CREATE TABLE "workflow_sequences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sequence" TEXT[],
    "patternHash" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workflow_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_candidates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "consistency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSavedPerWeek" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "triggerActions" JSONB,
    "suggestedActions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "automationRuleId" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workflow_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_sequences_userId_confidence_idx" ON "workflow_sequences"("userId", "confidence");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_sequences_userId_patternHash_key" ON "workflow_sequences"("userId", "patternHash");

-- CreateIndex
CREATE INDEX "workflow_candidates_userId_status_idx" ON "workflow_candidates"("userId", "status");

-- CreateIndex
CREATE INDEX "workflow_candidates_userId_confidence_idx" ON "workflow_candidates"("userId", "confidence");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_candidates_userId_name_key" ON "workflow_candidates"("userId", "name");

-- CreateIndex
CREATE INDEX "user_actions_userId_created_at_idx" ON "user_actions"("userId", "created_at");
