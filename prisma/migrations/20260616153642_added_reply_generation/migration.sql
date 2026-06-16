-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "generatedReply" TEXT,
ADD COLUMN     "needsReply" BOOLEAN,
ADD COLUMN     "replyGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replyMode" TEXT;

-- CreateIndex
CREATE INDEX "emails_userId_replyGenerated_idx" ON "emails"("userId", "replyGenerated");
