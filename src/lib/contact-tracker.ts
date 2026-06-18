import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function trackContact(
  userId: string,
  fromEmail: string,
  fromName: string | null,
  subject: string | null,
): Promise<void> {
  const email = extractEmail(fromEmail);
  if (!email) return;

  const existing = await prisma.contact.findUnique({
    where: { userId_email: { userId, email } },
  });

  const now = new Date();

  if (existing) {
    await prisma.contact.update({
      where: { id: existing.id },
      data: {
        emailCount: existing.emailCount + 1,
        lastInteraction: now,
        lastTopic: subject ?? existing.lastTopic,
        relationshipStrength: Math.min(
          1,
          existing.relationshipStrength + 0.02,
        ),
        name: fromName ?? existing.name,
      },
    });
  } else {
    await prisma.contact.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        email,
        name: fromName,
        emailCount: 1,
        lastInteraction: now,
        lastTopic: subject,
        relationshipStrength: 0.05,
      },
    });
  }
}

export async function getContactContext(userId: string, from: string) {
  const email = extractEmail(from);
  if (!email) return undefined;

  const contact = await prisma.contact.findUnique({
    where: { userId_email: { userId, email } },
  });

  if (!contact) return undefined;

  return {
    name: contact.name ?? undefined,
    emailCount: contact.emailCount,
    relationshipStrength: contact.relationshipStrength,
    lastTopic: contact.lastTopic ?? undefined,
  };
}

async function findContactByEmail(userId: string, email: string) {
  return prisma.contact.findUnique({
    where: { userId_email: { userId, email: email.toLowerCase() } },
  });
}

function extractEmail(from: string): string | null {
  const match = from.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase();
  if (from.includes("@")) return from.toLowerCase();
  return null;
}
