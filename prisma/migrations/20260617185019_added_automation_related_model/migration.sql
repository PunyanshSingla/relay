-- CreateTable
CREATE TABLE "user_actions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "suppressedUntil" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workflow_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionTarget" TEXT NOT NULL,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_executions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_actions_userId_actionType_idx" ON "user_actions"("userId", "actionType");

-- CreateIndex
CREATE INDEX "user_actions_userId_actionType_target_idx" ON "user_actions"("userId", "actionType", "target");

-- CreateIndex
CREATE INDEX "workflow_patterns_userId_status_idx" ON "workflow_patterns"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_patterns_userId_actionType_target_key" ON "workflow_patterns"("userId", "actionType", "target");

-- CreateIndex
CREATE INDEX "automation_rules_userId_enabled_idx" ON "automation_rules"("userId", "enabled");

-- CreateIndex
CREATE INDEX "automation_executions_ruleId_idx" ON "automation_executions"("ruleId");

-- CreateIndex
CREATE INDEX "automation_executions_emailId_idx" ON "automation_executions"("emailId");
