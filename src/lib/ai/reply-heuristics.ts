import { prisma } from "@/lib/prisma";
import type { NeedsReplyResult } from "./reply-generator.types";

const NO_REPLY_SENDER_PATTERNS = [
  /^no-?reply@/i,
  /^noreply@/i,
  /^do-not-?reply@/i,
  /^donotreply@/i,
  /^mailer-?daemon@/i,
];

const OTP_SUBJECT_PATTERNS = [
  /your\s+(?:otp|verification|confirm)/i,
  /(?:otp|one\s*time\s*(?:password|code))\s*(?:is|:)/i,
  /verification\s+code/i,
  /your\s+\d+\s+(?:digit|character)\s+code/i,
  /confirm\s+your\s+(?:email|account|identity)/i,
  /reset\s+your\s+password/i,
  /password\s+reset/i,
  /security\s+code/i,
  /login\s+code/i,
];

const AUTOMATION_SENDERS = [
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "jira.atlassian.com",
  "notifications@",
  "support@",
];

export async function checkNeedsReply(
  userId: string,
  from: string,
  subject: string,
  labels: string[],
  category?: string | null,
): Promise<NeedsReplyResult> {
  const email = extractEmail(from);

  if (category === "newsletter") {
    return { needsReply: false, reason: "Newsletter email" };
  }

  if (category === "promotion") {
    return { needsReply: false, reason: "Promotional email" };
  }

  if (labels.some((l) => l === "CATEGORY_PROMOTIONS" || l === "CATEGORY_UPDATES")) {
    return { needsReply: false, reason: "Gmail category: promotions/updates" };
  }

  for (const pattern of NO_REPLY_SENDER_PATTERNS) {
    if (email && pattern.test(email)) {
      return { needsReply: false, reason: "No-reply sender" };
    }
  }

  for (const pattern of OTP_SUBJECT_PATTERNS) {
    if (pattern.test(subject)) {
      return { needsReply: false, reason: "OTP/verification email" };
    }
  }

  if (email) {
    const domain = email.split("@")[1]?.toLowerCase();
    for (const sender of AUTOMATION_SENDERS) {
      if (domain === sender || email.startsWith(sender)) {
        return { needsReply: false, reason: "Automated system notification" };
      }
    }
  }

  const contact = email
    ? await prisma.contact.findUnique({
        where: { userId_email: { userId, email } },
      })
    : null;

  if (contact?.vip) {
    return { needsReply: true, reason: "VIP contact — likely expects response" };
  }

  return { needsReply: true, reason: "General email from human sender" };
}

function extractEmail(from: string): string | null {
  const match = from.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase();
  if (from.includes("@")) return from.toLowerCase();
  return null;
}
