export type FollowUpStatus = "pending" | "dismissed" | "acted_upon";

export interface FollowUp {
  id: string;
  emailId: string;
  gmailId: string;
  threadId: string;
  subject: string;
  toEmail: string;
  toName: string | null;
  sentAt: Date;
  status: FollowUpStatus;
  replyReceivedAt: Date | null;
  createdAt: Date;
}
