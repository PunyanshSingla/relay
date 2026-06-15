import { corsair, ensureCorsairSetup, ensureTenant } from "@/lib/corsair";
import { prisma } from "@/lib/prisma";
import { upsertSyncState } from "@/lib/sync-status";
import crypto from "crypto";

export interface RawEmail {
  gmailId: string;
  threadId: string;
  from: string;
  fromName: string | null;
  to: string;
  cc: string | null;
  subject: string;
  body: string;
  bodyHtml: string | null;
  snippet: string | null;
  timestamp: Date;
  labels: string[];
  hasAttachment: boolean;
}

export async function syncIncrementalEmails(
  userId: string,
  lastSyncTime?: Date,
  maxMessages: number = 500,
): Promise<{ syncCount: number }> {
  await ensureCorsairSetup();
  await ensureTenant(userId);

  const tenant = corsair.withTenant(userId);

  let q: string | undefined;
  if (lastSyncTime) {
    // Subtract 1s for overlap — Gmail's after: is exclusive, so emails
    // arriving in the same second as the latest synced one could be missed.
    const unixSeconds = Math.floor(lastSyncTime.getTime() / 1000) - 1;
    q = `after:${unixSeconds}`;
  }

  let syncCount = 0;
  let pageToken: string | undefined;
  let totalFetched = 0;

  do {
    const listResult = await tenant.gmail.api.messages.list({
      maxResults: 50,
      pageToken,
      q,
    });

    const messages = listResult.messages ?? [];
    if (messages.length === 0) break;

    for (const msg of messages) {
      if (totalFetched >= maxMessages) break;
      if (!msg.id) continue;
      try {
        const detailed = await tenant.gmail.api.messages.get({
          id: msg.id,
          format: "full",
        });
        await upsertEmail(userId, detailed);
        syncCount++;
        totalFetched++;
      } catch (err) {
        console.error(`[sync] Failed to fetch message ${msg.id}:`, err);
      }
    }

    const totalInDb = await prisma.email.count({ where: { userId } });
    await upsertSyncState(userId, {
      syncedEmails: syncCount,
      totalEmails: totalInDb,
    }).catch((err) => {
      console.error("[sync] Failed to update sync progress:", err);
    });

    if (totalFetched >= maxMessages) break;
    pageToken = listResult.nextPageToken ?? undefined;
  } while (pageToken);

  return { syncCount };
}

export async function upsertEmail(
  userId: string,
  msg: Record<string, unknown>,
): Promise<void> {
  const payload = msg.payload as Record<string, unknown> | undefined;
  const headers = (payload?.headers as Array<{ name: string; value: string }>) ?? [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;

  const subject = getHeader("Subject") ?? "(no subject)";
  const from = getHeader("From") ?? "unknown";
  const to = getHeader("To") ?? "";
  const cc = getHeader("Cc") ?? null;
  const fromName = extractName(from);
  const body = extractBody(payload);
  const bodyHtml = extractHtmlBody(payload);
  const snippet = (msg.snippet as string) ?? null;
  const timestamp = msg.internalDate
    ? new Date(parseInt(msg.internalDate as string))
    : new Date();
  const labels = (msg.labelIds as string[]) ?? [];
  const hasAttachment = payload ? hasAttachments(payload) : false;
  const threadId = (msg.threadId as string) ?? (msg.id as string);
  const gmailId = msg.id as string;

  const existing = await prisma.email.findUnique({ where: { gmailId } });

  if (existing) {
    await prisma.email.update({
      where: { gmailId },
      data: {
        labels,
        read: existing.read,
        starred: existing.starred,
      },
    });
    return;
  }

  await prisma.email.create({
    data: {
      id: crypto.randomUUID(),
      gmailId,
      userId,
      threadId,
      from,
      fromName,
      toText: to,
      ccText: cc,
      subject,
      body,
      bodyHtml,
      snippet,
      timestamp,
      labels,
      hasAttachment,
    },
  });
}

function extractName(from: string): string | null {
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  if (!from.includes("@")) return from.trim();
  return null;
}

function extractBody(payload: Record<string, unknown> | undefined): string {
  if (!payload) return "";

  const body = payload.body as { data?: string } | undefined;
  if (body?.data) {
    return decodeBase64(body.data);
  }

  const parts = payload.parts as Array<{
    mimeType?: string;
    body?: { data?: string };
  }> | undefined;
  if (parts) {
    const textPart = parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return decodeBase64(textPart.body.data);
    }

    const multipartAlternative = parts.find(
      (p) => p.mimeType === "multipart/alternative",
    );
    if (multipartAlternative?.body?.data) {
      return decodeBase64(multipartAlternative.body.data);
    }
  }

  return "";
}

function extractHtmlBody(payload: Record<string, unknown> | undefined): string | null {
  if (!payload) return null;

  const parts = payload.parts as Array<{
    mimeType?: string;
    body?: { data?: string };
  }> | undefined;
  if (!parts) return null;

  for (const part of parts) {
    if (part.mimeType === "text/html" && part.body?.data) {
      return decodeBase64(part.body.data);
    }
    if (part.mimeType === "multipart/alternative") {
      const subParts = (part as Record<string, unknown>).parts as Array<{
        mimeType?: string;
        body?: { data?: string };
      }> | undefined;
      const html = subParts?.find((p) => p.mimeType === "text/html");
      if (html?.body?.data) return decodeBase64(html.body.data);
    }
  }

  return null;
}

function hasAttachments(payload: Record<string, unknown>): boolean {
  const parts = payload.parts as Array<{
    mimeType?: string;
    filename?: string;
  }> | undefined;
  if (!parts) return false;

  for (const part of parts) {
    if (part.mimeType === "multipart/mixed") {
      const subParts = (part as Record<string, unknown>).parts as Array<{
        filename?: string;
      }> | undefined;
      if (subParts?.some((p) => p.filename && p.filename.length > 0)) return true;
    }
    if (part.filename && part.filename.length > 0) return true;
  }

  return false;
}

function decodeBase64(data: string): string {
  try {
    const sanitized = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(sanitized, "base64").toString("utf-8");
  } catch {
    return "";
  }
}
