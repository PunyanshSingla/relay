import type { Email, EmailAddress, Priority, Category } from "@/types/email";

interface GmailHeader {
  name?: string;
  value?: string;
}

interface GmailPayload {
  headers?: GmailHeader[];
  body?: { data?: string; size?: number };
  parts?: GmailPayload[];
  mimeType?: string;
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

function extractBody(payload: GmailPayload | undefined): string {
  if (!payload) return "";

  // Simple text/plain body
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
  }

  // If it has parts, recurse
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
      }
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  return "";
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
  const subject = getHeaderValue(headers, "Subject");
  const labels = mapLabelIds(message.labelIds ?? []);
  const body = extractBody(message.payload);

  const fromAddresses = parseEmailAddresses(fromRaw);
  const from: EmailAddress =
    fromAddresses.length > 0
      ? fromAddresses[0]
      : { name: "Unknown", email: "unknown@email.com" };

  const to = parseEmailAddresses(toRaw);

  return {
    id: message.id ?? "",
    from,
    to,
    subject: subject || "(No subject)",
    preview: message.snippet || "",
    body,
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
