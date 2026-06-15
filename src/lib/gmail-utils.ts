import type { Email, EmailAddress, EmailAttachment, EmailReply, Priority, Category } from "@/types/email";

interface GmailHeader {
  name?: string;
  value?: string;
}

interface GmailPayload {
  headers?: GmailHeader[];
  body?: { data?: string; size?: number; attachmentId?: string };
  parts?: GmailPayload[];
  mimeType?: string;
  filename?: string;
}

interface GmailMessage {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string | number | Date | null;
  payload?: GmailMessagePayload;
}

interface GmailMessagePayload {
  headers?: GmailHeader[];
  body?: { data?: string; size?: number };
  parts?: GmailMessagePayload[];
  mimeType?: string;
}

function getHeaderValue(headers: GmailHeader[] | undefined, name: string): string {
  if (!headers) return "";
  const header = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return header?.value ?? "";
}

function parseEmailAddresses(raw: string): EmailAddress[] {
  if (!raw) return [];
  return raw.split(",").map((addr) => {
    const trimmed = addr.trim();
    const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return { name: match[1].replace(/"/g, "").trim(), email: match[2] };
    }
    return { name: trimmed, email: trimmed };
  });
}

function decodeBase64Url(data: string): string {
  const binary = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

function extractBody(payload: GmailPayload | undefined): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  return "";
}

function extractHtmlBody(payload: GmailPayload | undefined): string | undefined {
  if (!payload) return undefined;

  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      const nested = extractHtmlBody(part);
      if (nested) return nested;
    }
  }

  return undefined;
}

function extractAttachments(
  payload: GmailPayload | undefined,
  prefix = ""
): EmailAttachment[] {
  if (!payload) return [];
  const attachments: EmailAttachment[] = [];

  if (payload.parts) {
    for (let i = 0; i < payload.parts.length; i++) {
      const part = payload.parts[i];
      const partPrefix = prefix ? `${prefix}.${i}` : String(i);

      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          id: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType || "application/octet-stream",
          size: part.body.size || 0,
        });
      }

      attachments.push(...extractAttachments(part, partPrefix));
    }
  }

  return attachments;
}

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&#x27;": "'",
    "&nbsp;": " ",
  };
  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}

function mapLabelIds(labelIds: string[]): {
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
} {
  return {
    read: !labelIds.includes("UNREAD"),
    starred: labelIds.includes("STARRED"),
    hasAttachment: labelIds.includes("HAS_ATTACHMENT"),
  };
}

export function mapGmailMessageToEmail(message: GmailMessage): Email {
  const headers = message.payload?.headers;
  const fromRaw = getHeaderValue(headers, "From");
  const toRaw = getHeaderValue(headers, "To");
  const ccRaw = getHeaderValue(headers, "Cc");
  const subject = getHeaderValue(headers, "Subject");
  const labels = mapLabelIds(message.labelIds ?? []);
  const body = extractBody(message.payload);
  const bodyHtml = extractHtmlBody(message.payload);
  const attachments = extractAttachments(message.payload);

  const fromAddresses = parseEmailAddresses(fromRaw);
  const from: EmailAddress =
    fromAddresses.length > 0
      ? fromAddresses[0]
      : { name: "Unknown", email: "unknown@email.com" };

  const to = parseEmailAddresses(toRaw);
  const cc = ccRaw ? parseEmailAddresses(ccRaw) : undefined;

  return {
    id: message.id ?? "",
    from,
    to,
    cc: cc && cc.length > 0 ? cc : undefined,
    subject: decodeHtmlEntities(subject || "(No subject)"),
    preview: decodeHtmlEntities(message.snippet || ""),
    body,
    bodyHtml,
    timestamp: new Date(
      typeof message.internalDate === "string"
        ? parseInt(message.internalDate, 10)
        : typeof message.internalDate === "number"
          ? message.internalDate
          : Date.now()
    ),
    read: labels.read,
    starred: labels.starred,
    priority: "P3" as Priority,
    category: "fyi" as Category,
    labels: message.labelIds ?? [],
    hasAttachment: labels.hasAttachment,
    attachments,
    threadId: message.threadId ?? "",
    replies: [],
  };
}

export function getGmailFilterQuery(
  filter: "all" | "unread" | "P1" | "P2" | "P3"
): string | undefined {
  switch (filter) {
    case "unread":
      return "is:unread";
    default:
      return undefined;
  }
}

const CRLF = "\r\n";

interface AttachmentData {
  filename: string;
  mimeType: string;
  base64Content: string;
}

interface MimeMessageParams {
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  htmlBody: string;
  attachments?: AttachmentData[];
  threadId?: string;
}

function generateBoundary(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return `relay_${Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function buildMimeMessage(params: MimeMessageParams): string {
  const boundary = generateBoundary();
  const lines: string[] = [];

  lines.push(`From: ${params.from}`);
  lines.push(`To: ${params.to}`);
  if (params.cc) lines.push(`Cc: ${params.cc}`);
  if (params.bcc) lines.push(`Bcc: ${params.bcc}`);
  lines.push(`Subject: ${params.subject}`);
  lines.push(`MIME-Version: 1.0`);

  const hasAttachments = params.attachments && params.attachments.length > 0;

  if (hasAttachments) {
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    lines.push(CRLF);
    lines.push(`--${boundary}`);
  }

  lines.push(`Content-Type: text/html; charset="UTF-8"`);
  lines.push(CRLF);
  lines.push(params.htmlBody);
  lines.push(CRLF);

  if (hasAttachments) {
    for (const att of params.attachments!) {
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`);
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      lines.push(`Content-Transfer-Encoding: base64`);
      lines.push(CRLF);
      lines.push(att.base64Content);
      lines.push(CRLF);
    }
    lines.push(`--${boundary}--`);
  }

  return lines.join(CRLF);
}

export function encodeRfc2822(rfc2822Message: string): string {
  return Buffer.from(rfc2822Message, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

interface GmailThread {
  id?: string;
  messages?: GmailMessage[];
}

export function mapGmailThreadToEmails(thread: GmailThread): Email[] {
  const messages = thread.messages ?? [];
  if (messages.length === 0) return [];

  return messages.map((msg, index) => {
    const email = mapGmailMessageToEmail(msg);

    if (index < messages.length - 1) {
      const replies: EmailReply[] = [];
      for (let i = index + 1; i < messages.length; i++) {
        const reply = mapGmailMessageToEmail(messages[i]);
        replies.push({
          id: reply.id,
          from: reply.from,
          body: reply.body,
          bodyHtml: reply.bodyHtml,
          timestamp: reply.timestamp,
        });
      }
      email.replies = replies;
    }

    return email;
  });
}
