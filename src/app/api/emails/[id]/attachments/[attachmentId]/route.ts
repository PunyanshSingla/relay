import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";

interface GmailPart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  body?: { attachmentId?: string; size?: number; data?: string };
  parts?: GmailPart[];
}

function findAttachmentPart(
  payload: GmailPart | undefined,
  attachmentId: string
): GmailPart | undefined {
  if (!payload) return undefined;

  if (payload.body?.attachmentId === attachmentId) {
    return payload;
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const found = findAttachmentPart(part, attachmentId);
      if (found) return found;
    }
  }

  return undefined;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, attachmentId } = await params;

  try {
    const tenant = corsair.withTenant(session.user.id);

    const message = await tenant.gmail.api.messages.get({
      id,
      format: "full",
    });

    const part = findAttachmentPart(message.payload as GmailPart, attachmentId);
    if (!part) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const filename = part.filename || "attachment";
    const mimeType = part.mimeType || "application/octet-stream";

    let data: string | undefined;
    if (part.body?.data) {
      data = part.body.data;
    } else if (part.body?.attachmentId) {
      const fullMessage = await tenant.gmail.api.messages.get({
        id,
        format: "full",
      });
      const fullPart = findAttachmentPart(
        fullMessage.payload as GmailPart,
        part.body.attachmentId
      );
      data = fullPart?.body?.data;
    }

    if (!data) {
      return NextResponse.json({ error: "Attachment data not found" }, { status: 404 });
    }

    const binary = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    console.error("Failed to download attachment:", error);
    const message =
      error instanceof Error ? error.message : "Failed to download attachment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
