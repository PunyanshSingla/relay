-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "followUpEligibleAt" TIMESTAMP(3),
ADD COLUMN     "isSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "gmailId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastCheckedAt" TIMESTAMP(3),
    "replyReceivedAt" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "follow_ups_emailId_key" ON "follow_ups"("emailId");

-- CreateIndex
CREATE INDEX "follow_ups_userId_status_idx" ON "follow_ups"("userId", "status");

-- CreateIndex
CREATE INDEX "follow_ups_userId_sentAt_idx" ON "follow_ups"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "emails_followUpEligibleAt_idx" ON "emails"("followUpEligibleAt");

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
