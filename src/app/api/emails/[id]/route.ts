import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { corsair, ensureCorsairSetup } from "@/lib/corsair";
import type { Email, Priority, Category } from "@/types/email";

const DB_FIELDS = {
  id: true,
  gmailId: true,
  userId: true,
  threadId: true,
  from: true,
  fromName: true,
  toText: true,
  ccText: true,
  subject: true,
  body: true,
  bodyHtml: true,
  snippet: true,
  timestamp: true,
  read: true,
  starred: true,
  hasAttachment: true,
  labels: true,
  priority: true,
  category: true,
  aiClassified: true,
  aiReason: true,
  aiAction: true,
} as const;

function parseAddresses(raw: string): Array<{ name: string; email: string }> {
  if (!raw) return [];
  return raw.split(",").map((addr) => {
    const trimmed = addr.trim();
    const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
    if (match) return { name: match[1].replace(/"/g, "").trim(), email: match[2] };
    return { name: trimmed, email: trimmed };
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const dbEmail = await prisma.email.findUnique({
      where: { id },
      select: DB_FIELDS,
    });

    if (!dbEmail) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // If bodyHtml is missing, fetch full email from Gmail on-demand
    let bodyHtml = dbEmail.bodyHtml ?? undefined;
    let body = dbEmail.body;
    if (!bodyHtml && !body) {
      try {
        await ensureCorsairSetup();
        const tenant = corsair.withTenant(session.user.id);
        const full = await tenant.gmail.api.messages.get({
          id: dbEmail.gmailId,
          format: "full",
        });

        const payload = full.payload as Record<string, unknown> | undefined;
        const parts = payload?.parts as Array<{
          mimeType?: string;
          body?: { data?: string };
        }> | undefined;

        // Extract body
        const mainBody = payload?.body as { data?: string } | undefined;
        if (mainBody?.data) {
          body = Buffer.from(mainBody.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
        } else if (parts) {
          const textPart = parts.find((p) => p.mimeType === "text/plain");
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
          }
        }

        // Extract HTML body
        if (parts) {
          for (const part of parts) {
            if (part.mimeType === "text/html" && part.body?.data) {
              bodyHtml = Buffer.from(part.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
              break;
            }
            if (part.mimeType === "multipart/alternative") {
              const subParts = (part as Record<string, unknown>).parts as Array<{
                mimeType?: string;
                body?: { data?: string };
              }> | undefined;
              const html = subParts?.find((p) => p.mimeType === "text/html");
              if (html?.body?.data) {
                bodyHtml = Buffer.from(html.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
                break;
              }
            }
          }
        }

        // Cache in DB for next time
        if (body || bodyHtml) {
          await prisma.email.update({
            where: { id },
            data: { body: body || "", bodyHtml: bodyHtml || null },
          }).catch(() => {});
        }
      } catch (err) {
        console.error("[email] Failed to fetch full body from Gmail:", err);
      }
    }

    const email: Email = {
      id: dbEmail.id,
      from: { name: dbEmail.fromName || dbEmail.from, email: dbEmail.from },
      to: parseAddresses(dbEmail.toText),
      cc: dbEmail.ccText ? parseAddresses(dbEmail.ccText) : undefined,
      subject: dbEmail.subject,
      preview: dbEmail.snippet || "",
      body: body || dbEmail.body,
      bodyHtml: bodyHtml ?? undefined,
      timestamp: dbEmail.timestamp,
      read: dbEmail.read,
      starred: dbEmail.starred,
      priority: (dbEmail.priority as Priority) || "P3",
      category: (dbEmail.category as Category) || "fyi",
      labels: dbEmail.labels,
      hasAttachment: dbEmail.hasAttachment,
      attachments: [],
      threadId: dbEmail.threadId,
      replies: [],
      isClassified: dbEmail.aiClassified,
    };

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Failed to fetch email:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
