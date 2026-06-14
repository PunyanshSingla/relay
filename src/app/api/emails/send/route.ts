import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import { buildMimeMessage, encodeRfc2822 } from "@/lib/gmail-utils";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const to = formData.get("to") as string;
    const cc = (formData.get("cc") as string) || undefined;
    const bcc = (formData.get("bcc") as string) || undefined;
    const subject = (formData.get("subject") as string) || "(No subject)";
    const bodyHtml = (formData.get("bodyHtml") as string) || "";
    const threadId = (formData.get("threadId") as string) || undefined;

    if (!to) {
      return NextResponse.json({ error: "Recipient is required" }, { status: 400 });
    }

    const attachmentFiles = formData.getAll("attachments");
    const attachmentUrlsRaw = formData.get("attachmentUrls") as string | null;

    const attachments: { filename: string; mimeType: string; base64Content: string }[] = [];

    for (const file of attachmentFiles) {
      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Content = buffer
          .toString("base64")
          .replace(/(.{76})/g, "$1\r\n")
          .trim();
        attachments.push({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          base64Content,
        });
      }
    }

    if (attachmentUrlsRaw) {
      const urls: string[] = JSON.parse(attachmentUrlsRaw);
      for (const url of urls) {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
          if (!response.ok) continue;

          const contentType = response.headers.get("content-type") || "application/octet-stream";
          const contentDisposition = response.headers.get("content-disposition");
          let filename = url.split("/").pop()?.split("?")[0] ?? "attachment";
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch) {
              filename = filenameMatch[1].replace(/['"]/g, "");
            }
          }

          const buffer = Buffer.from(await response.arrayBuffer());
          const base64Content = buffer
            .toString("base64")
            .replace(/(.{76})/g, "$1\r\n")
            .trim();

          attachments.push({
            filename,
            mimeType: contentType.split(";")[0].trim(),
            base64Content,
          });
        } catch {
          continue;
        }
      }
    }

    const user = session.user as { email?: string };
    const fromEmail = user.email ?? "";

    const rfc2822 = buildMimeMessage({
      from: fromEmail,
      to,
      cc,
      bcc,
      subject,
      htmlBody: bodyHtml,
      attachments,
    });

    const raw = encodeRfc2822(rfc2822);

    const tenant = corsair.withTenant(session.user.id);

    const result = await tenant.gmail.api.messages.send({
      raw,
      threadId,
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      threadId: result.threadId,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
