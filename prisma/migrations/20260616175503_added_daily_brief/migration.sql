-- CreateTable
CREATE TABLE "daily_briefs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "emailCount" INTEGER NOT NULL DEFAULT 0,
    "meetingCount" INTEGER NOT NULL DEFAULT 0,
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "overdueCount" INTEGER NOT NULL DEFAULT 0,
    "rawInput" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_briefs_userId_date_idx" ON "daily_briefs"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_briefs_userId_date_key" ON "daily_briefs"("userId", "date");
