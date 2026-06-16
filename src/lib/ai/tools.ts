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

  send_email: {
    description: "Send an email to someone. Use when the user wants to send a new email.",
    parameters: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content"),
    }),
  },

  reply_to_email: {
    description: "Reply to an existing email thread.",
    parameters: z.object({
      emailId: z.string().describe("The email ID to reply to"),
      body: z.string().describe("Reply body content"),
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
};

export type ToolName = keyof typeof chatTools;

export interface ToolCall {
  name: ToolName;
  args: Record<string, unknown>;
  result?: unknown;
}

export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>,
  userId: string,
  fetchFn: typeof fetch,
): Promise<unknown> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  switch (name) {
    case "search_emails": {
      const res = await fetchFn(
        `${baseUrl}/api/search?q=${encodeURIComponent(args.query as string)}`,
        { headers: { Cookie: `better-auth.session_token=${args._sessionToken}` } },
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
      const res = await fetchFn(
        `${baseUrl}/api/emails/${args.emailId}`,
        { headers: { Cookie: `better-auth.session_token=${args._sessionToken}` } },
      );
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

    case "send_email": {
      const res = await fetchFn(`${baseUrl}/api/emails/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `better-auth.session_token=${args._sessionToken}`,
        },
        body: JSON.stringify({
          to: args.to,
          subject: args.subject,
          htmlBody: args.body,
        }),
      });
      return res.ok ? { success: true } : { success: false, error: "Failed to send" };
    }

    case "reply_to_email": {
      const emailRes = await fetchFn(
        `${baseUrl}/api/emails/${args.emailId}`,
        { headers: { Cookie: `better-auth.session_token=${args._sessionToken}` } },
      );
      const emailData = await emailRes.json();
      const email = emailData.email;
      if (!email) return { success: false, error: "Email not found" };

      const res = await fetchFn(`${baseUrl}/api/emails/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `better-auth.session_token=${args._sessionToken}`,
        },
        body: JSON.stringify({
          to: email.from.email,
          subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
          htmlBody: args.body,
          threadId: email.threadId,
        }),
      });
      return res.ok ? { success: true } : { success: false, error: "Failed to reply" };
    }

    case "create_event": {
      const res = await fetchFn(`${baseUrl}/api/calendar/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `better-auth.session_token=${args._sessionToken}`,
        },
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
      const res = await fetchFn(
        `${baseUrl}/api/calendar/events?${params.toString()}`,
        { headers: { Cookie: `better-auth.session_token=${args._sessionToken}` } },
      );
      const data = await res.json();
      let events = data.events ?? [];
      if (args.query) {
        const q = (args.query as string).toLowerCase();
        events = events.filter((ev: { summary?: string; description?: string }) =>
          ev.summary?.toLowerCase().includes(q) || ev.description?.toLowerCase().includes(q)
        );
      }
      return events.slice(0, 5).map((ev: { id: string; summary: string; start: string; end: string }) => ({
        id: ev.id,
        summary: ev.summary,
        start: ev.start,
        end: ev.end,
      }));
    }

    case "list_contacts": {
      const res = await fetchFn(
        `${baseUrl}/api/contacts?q=${encodeURIComponent(args.query as string)}`,
        { headers: { Cookie: `better-auth.session_token=${args._sessionToken}` } },
      );
      const data = await res.json();
      return (data.contacts ?? []).slice(0, 5).map((c: { id: string; name: string; email: string }) => ({
        id: c.id,
        name: c.name,
        email: c.email,
      }));
    }

    case "get_inbox_summary": {
      const res = await fetchFn(
        `${baseUrl}/api/emails/counts`,
        { headers: { Cookie: `better-auth.session_token=${args._sessionToken}` } },
      );
      return res.json();
    }

    default:
      return { error: "Unknown tool" };
  }
}
