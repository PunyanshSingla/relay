-- CreateTable
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE "emails" (
    "id" TEXT NOT NULL,
    "gmailId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "fromName" TEXT,
    "toText" TEXT NOT NULL,
    "ccText" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "snippet" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "hasAttachment" BOOLEAN NOT NULL DEFAULT false,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" TEXT,
    "category" TEXT,
    "aiClassified" BOOLEAN NOT NULL DEFAULT false,
    "aiReason" TEXT,
    "aiAction" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_embeddings" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,

    CONSTRAINT "email_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailCount" INTEGER NOT NULL DEFAULT 0,
    "meetingCount" INTEGER NOT NULL DEFAULT 0,
    "lastInteraction" TIMESTAMP(3),
    "lastTopic" TEXT,
    "responsePattern" TEXT,
    "preferredMeetingTimes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relationshipStrength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vip" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emails_gmailId_key" ON "emails"("gmailId");

-- CreateIndex
CREATE INDEX "emails_userId_priority_idx" ON "emails"("userId", "priority");

-- CreateIndex
CREATE INDEX "emails_userId_threadId_idx" ON "emails"("userId", "threadId");

-- CreateIndex
CREATE INDEX "emails_userId_timestamp_idx" ON "emails"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "email_embeddings_emailId_key" ON "email_embeddings"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_userId_email_key" ON "contacts"("userId", "email");

-- AddForeignKey
ALTER TABLE "email_embeddings" ADD CONSTRAINT "email_embeddings_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
