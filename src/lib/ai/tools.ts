import { z } from "zod";

export const chatTools = {
  search_emails: {
    description: "Search emails using AI-powered semantic search. Use this when the user wants to find emails about a topic, from a person, or matching any criteria.",
    parameters: z.object({
      query: z.string().describe("Search query describing what emails to find"),
    }),
  },

  read_email: {
    description: "Read the full content of a specific email by its ID. Use after searching to get details.",
    parameters: z.object({
      emailId: z.string().describe("The email ID to read"),
    }),
  },

  draft_email: {
    description: "Draft an email for the user to review before sending. ALWAYS use this instead of sending directly. The user will review and confirm.",
    parameters: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content in HTML"),
    }),
  },

  draft_reply: {
    description: "Draft a reply to an existing email for the user to review before sending. ALWAYS use this instead of replying directly.",
    parameters: z.object({
      emailId: z.string().describe("The email ID to reply to"),
      body: z.string().describe("Reply body content in HTML"),
    }),
  },

  create_event: {
    description: "Create a calendar event. Use when the user wants to schedule a meeting or event.",
    parameters: z.object({
      summary: z.string().describe("Event title/summary"),
      startDateTime: z.string().describe("Start date-time in ISO format (e.g., 2026-06-17T15:00:00)"),
      endDateTime: z.string().describe("End date-time in ISO format"),
      description: z.string().optional().describe("Event description"),
      attendees: z.array(z.string()).optional().describe("List of attendee email addresses"),
    }),
  },

  search_events: {
    description: "Search calendar events. Use when the user wants to know about upcoming meetings or events.",
    parameters: z.object({
      query: z.string().optional().describe("Optional search query to filter events"),
      timeMin: z.string().optional().describe("Start of time range in ISO format"),
      timeMax: z.string().optional().describe("End of time range in ISO format"),
    }),
  },

  list_contacts: {
    description: "Search contacts by name or email.",
    parameters: z.object({
      query: z.string().describe("Search query for contacts"),
    }),
  },

  get_inbox_summary: {
    description: "Get a summary of the inbox: total emails, unread count, P1/P2/P3 breakdown. Use when the user asks about their inbox status.",
    parameters: z.object({}),
  },

  send_email: {
    description: "Send an email directly. Use this when in auto-send mode or when the user explicitly confirms sending.",
    parameters: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content in HTML"),
      threadId: z.string().optional().describe("Thread ID for replies"),
    }),
  },
};

export type ToolName = keyof typeof chatTools;

export interface ToolCall {
  name: ToolName;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface DraftResult {
  draft: true;
  type: "email" | "reply";
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  replyToId?: string;
}

export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>,
  userId: string,
  fetchFn: typeof fetch,
  cookieHeader?: string,
): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const signal = AbortSignal.timeout(12000);

  const safeFetch = (url: string, init?: RequestInit) =>
    fetchFn(url, {
      ...init,
      signal,
      headers: {
        ...init?.headers,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

  switch (name) {
    case "search_emails": {
      const res = await safeFetch(
        `${baseUrl}/api/search?q=${encodeURIComponent(args.query as string)}`,
      );
      const data = await res.json();
      return data.emails?.slice(0, 5).map((e: { id: string; subject: string; from: { name: string; email: string }; preview: string; timestamp: string }) => ({
        id: e.id,
        subject: e.subject,
        from: e.from.name,
        preview: e.preview?.slice(0, 100),
      })) ?? [];
    }

    case "read_email": {
      const res = await safeFetch(`${baseUrl}/api/emails/${args.emailId}`);
      const data = await res.json();
      const e = data.email;
      return e ? {
        id: e.id,
        subject: e.subject,
        from: e.from,
        body: e.body?.slice(0, 2000),
        timestamp: e.timestamp,
      } : null;
    }

    case "draft_email": {
      // Return draft for user to review — don't send yet
      const result: DraftResult = {
        draft: true,
        type: "email",
        to: args.to as string,
        subject: args.subject as string,
        body: args.body as string,
      };
      return result;
    }

    case "draft_reply": {
      // Fetch original email for context, return draft
      const emailRes = await safeFetch(`${baseUrl}/api/emails/${args.emailId}`);
      const emailData = await emailRes.json();
      const email = emailData.email;
      if (!email) return { error: "Email not found" };

      const result: DraftResult = {
        draft: true,
        type: "reply",
        to: email.from.email,
        subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
        body: args.body as string,
        threadId: email.threadId,
        replyToId: email.id,
      };
      return result;
    }

    case "create_event": {
      const res = await safeFetch(`${baseUrl}/api/calendar/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: args.summary,
          startDateTime: args.startDateTime,
          endDateTime: args.endDateTime,
          description: args.description,
          attendees: args.attendees,
        }),
      });
      return res.ok ? { success: true } : { success: false, error: "Failed to create event" };
    }

    case "search_events": {
      const params = new URLSearchParams();
      if (args.timeMin) params.set("timeMin", args.timeMin as string);
      if (args.timeMax) params.set("timeMax", args.timeMax as string);
      const res = await safeFetch(`${baseUrl}/api/calendar/events?${params.toString()}`);
      const data = await res.json();
      let events = data.events ?? [];
      if (args.query) {
        const q = (args.query as string).toLowerCase();
        events = events.filter((ev: { summary?: string; description?: string }) =>
          ev.summary?.toLowerCase().includes(q) || ev.description?.toLowerCase().includes(q)
        );
      }
      return events.slice(0, 5).map((ev: { id: string; summary: string; start: string; end: string }) => ({
        id: ev.id, summary: ev.summary, start: ev.start, end: ev.end,
      }));
    }

    case "list_contacts": {
      const res = await safeFetch(`${baseUrl}/api/contacts?q=${encodeURIComponent(args.query as string)}`);
      const data = await res.json();
      return (data.contacts ?? []).slice(0, 5).map((c: { id: string; name: string; email: string }) => ({
        id: c.id, name: c.name, email: c.email,
      }));
    }

    case "get_inbox_summary": {
      const res = await safeFetch(`${baseUrl}/api/emails/counts`);
      return res.json();
    }

    case "send_email": {
      const fd = new FormData();
      fd.set("to", args.to as string);
      fd.set("subject", args.subject as string);
      fd.set("bodyHtml", args.body as string);
      if (args.threadId) fd.set("threadId", args.threadId as string);

      const res = await safeFetch(`${baseUrl}/api/emails/send`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      return res.ok
        ? { success: true, id: data.id, threadId: data.threadId }
        : { success: false, error: data.error || "Failed to send email" };
    }

    default:
      return { error: "Unknown tool" };
  }
}
