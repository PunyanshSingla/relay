-- CreateTable
CREATE TABLE "sync_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'idle',
    "isInitialSync" BOOLEAN NOT NULL DEFAULT false,
    "syncStartedAt" TIMESTAMP(3),
    "syncCompletedAt" TIMESTAMP(3),
    "totalEmails" INTEGER NOT NULL DEFAULT 0,
    "syncedEmails" INTEGER NOT NULL DEFAULT 0,
    "classifiedEmails" INTEGER NOT NULL DEFAULT 0,
    "totalToClassify" INTEGER NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sync_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sync_states_userId_key" ON "sync_states"("userId");
