import { corsair, ensureCorsairSetup } from "@/lib/corsair";
import { prisma } from "@/lib/prisma";
import { upsertSyncState } from "@/lib/sync-status";
import crypto from "crypto";

const GMAIL_LIST_TIMEOUT = 60_000;
const GMAIL_GET_TIMEOUT = 20_000;

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
  maxMessages: number = 200,
): Promise<{ syncCount: number }> {
  await ensureCorsairSetup();

  const tenant = corsair.withTenant(userId);

  let q: string | undefined;
  if (lastSyncTime) {
    const unixSeconds = Math.floor(lastSyncTime.getTime() / 1000) - 1;
    q = `after:${unixSeconds}`;
  }

  let syncCount = 0;
  let pageToken: string | undefined;
  let totalFetched = 0;

  do {
    let listResult: Awaited<ReturnType<typeof tenant.gmail.api.messages.list>> | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        listResult = await Promise.race([
          tenant.gmail.api.messages.list({
            maxResults: 50,
            pageToken,
            q,
          }),
          timeout(GMAIL_LIST_TIMEOUT, "messages.list"),
        ]);
        break;
      } catch (err) {
        if (attempt === 0) {
          console.warn(`[sync] messages.list attempt 1 failed, retrying...`);
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          throw err;
        }
      }
    }

    if (!listResult) break;

    const messages = (listResult as { messages?: Array<{ id?: string }> }).messages ?? [];
    if (messages.length === 0) break;

    for (const msg of messages) {
      if (totalFetched >= maxMessages) break;
      if (!msg.id) continue;
      try {
        const detailed = await Promise.race([
          tenant.gmail.api.messages.get({
            id: msg.id,
            format: "full",
          }),
          timeout(GMAIL_GET_TIMEOUT, "messages.get"),
        ]);
        await upsertEmail(userId, detailed as Record<string, unknown>);
        syncCount++;
        totalFetched++;
      } catch (err) {
        console.error(`[sync] Failed to fetch message ${msg.id}:`, err);
      }
    }

    // Update progress every page
    const totalInDb = await prisma.email.count({ where: { userId } });
    await upsertSyncState(userId, {
      syncedEmails: syncCount,
      totalEmails: totalInDb,
    }).catch(() => {});

    if (totalFetched >= maxMessages) break;
    pageToken = (listResult as { nextPageToken?: string }).nextPageToken ?? undefined;
  } while (pageToken);

  return { syncCount };
}

function timeout(ms: number, label: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Gmail API timeout: ${label} (${ms}ms)`)), ms)
  );
}

export async function upsertEmail(
  userId: string,
  msg: Record<string, unknown>,
): Promise<void> {
  const payload = msg.payload as Record<string, unknown> | undefined;
  const headers =
    (payload?.headers as Array<{ name: string; value: string }>) ?? [];
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
  const read = !labels.includes("UNREAD");
  const starred = labels.includes("STARRED");

  const existing = await prisma.email.findUnique({ where: { gmailId } });

  if (existing) {
    await prisma.email.update({
      where: { gmailId },
      data: {
        subject,
        body,
        bodyHtml,
        snippet,
        labels,
        read,
        starred,
        hasAttachment,
        from,
        fromName,
        toText: to,
        ccText: cc,
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
      read,
      starred,
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

function extractHtmlBody(
  payload: Record<string, unknown> | undefined,
): string | null {
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
      if (subParts?.some((p) => p.filename && p.filename.length > 0))
        return true;
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
