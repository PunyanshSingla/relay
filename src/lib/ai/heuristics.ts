import { prisma } from "@/lib/prisma";
import type { HeuristicResult } from "./heuristics.types";

const NO_REPLY_PATTERNS = [
  /^no-?reply@/i,
  /^noreply@/i,
  /^do-not-?reply@/i,
  /^donotreply@/i,
  /^notifications?@/i,
  /^alerts?@/i,
  /^auto(?:mail|responder)?@/i,
];

const NEWSLETTER_PATTERNS = [
  /^news(?:letter)?@/i,
  /^digest@/i,
  /^weekly@/i,
  /^updates?@/i,
  /^hello@/i,
];

const PROMOTION_DOMAINS = [
  "mailchimp.com",
  "mailchi.mp",
  "sendgrid.net",
  "hubspot.com",
  "marketo.com",
  "pardot.com",
  "activecampaign.com",
  "klaviyo.com",
  "braze.com",
  "iterable.com",
  "customer.io",
  "campaignmonitor.com",
  "convertkit.com",
];

export async function runHeuristics(
  userId: string,
  from: string,
  subject: string,
): Promise<HeuristicResult | null> {
  const vipResult = await checkVipContact(userId, from);
  if (vipResult) return vipResult;

  const noReplyResult = checkNoReplyPattern(from);
  if (noReplyResult) return noReplyResult;

  const newsletterResult = checkNewsletterPattern(from, subject);
  if (newsletterResult) return newsletterResult;

  const promotionResult = checkPromotionDomain(from);
  if (promotionResult) return promotionResult;

  return null;
}

async function checkVipContact(
  userId: string,
  from: string,
): Promise<HeuristicResult | null> {
  const email = extractEmail(from);
  if (!email) return null;

  const contact = await prisma.contact.findUnique({
    where: { userId_email: { userId, email } },
  });

  if (contact?.vip) {
    return {
      matched: true,
      priority: "P1",
      category: "action_needed",
      reason: "VIP contact",
    };
  }

  if (contact && contact.emailCount >= 10 && contact.relationshipStrength >= 0.6) {
    return {
      matched: true,
      priority: "P2",
      category: "action_needed",
      reason: "Frequent high-value contact",
    };
  }

  return null;
}

function checkNoReplyPattern(from: string): HeuristicResult | null {
  const email = extractEmail(from);
  if (!email) return null;

  for (const pattern of NO_REPLY_PATTERNS) {
    if (pattern.test(email)) {
      return {
        matched: true,
        priority: "P3",
        category: "fyi",
        reason: "No-reply sender",
      };
    }
  }

  return null;
}

function checkNewsletterPattern(from: string, subject: string): HeuristicResult | null {
  const email = extractEmail(from);
  if (!email) return null;

  for (const pattern of NEWSLETTER_PATTERNS) {
    if (pattern.test(email)) {
      return {
        matched: true,
        priority: "P3",
        category: "newsletter",
        reason: "Newsletter sender pattern",
      };
    }
  }

  const newsletterSubjectPatterns = [
    /newsletter/i,
    /edition #?\d+/i,
    /weekly digest/i,
    /monthly roundup/i,
    /your weekly/i,
    /your daily/i,
  ];

  for (const pattern of newsletterSubjectPatterns) {
    if (pattern.test(subject)) {
      return {
        matched: true,
        priority: "P3",
        category: "newsletter",
        reason: "Newsletter subject pattern",
      };
    }
  }

  return null;
}

function checkPromotionDomain(from: string): HeuristicResult | null {
  const email = extractEmail(from);
  if (!email) return null;

  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  for (const promoDomain of PROMOTION_DOMAINS) {
    if (domain === promoDomain || domain.endsWith(`.${promoDomain}`)) {
      return {
        matched: true,
        priority: "P3",
        category: "promotion",
        reason: "Marketing platform sender",
      };
    }
  }

  return null;
}

function extractEmail(from: string): string | null {
  const match = from.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase();

  if (from.includes("@")) return from.toLowerCase();

  return null;
}
