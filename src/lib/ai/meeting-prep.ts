import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { withRetry } from "./retry";

const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash-lite";

const meetingProvider = createGoogleGenerativeAI({
  apiKey: process.env.CLASSIFY_API_KEY || "",
});

export interface MeetingPrepInput {
  summary: string;
  description?: string;
  attendees: Array<{ email: string; name?: string }>;
  recentEmails: Array<{
    from: string;
    subject: string;
    snippet: string;
    timestamp: string;
  }>;
  pendingFollowUps: Array<{
    subject: string;
    toEmail: string;
    sentAt: string;
  }>;
}

export async function generateMeetingPrep(input: MeetingPrepInput): Promise<string | null> {
  const attendeeBlock = input.attendees.length > 0
    ? input.attendees.map((a) => a.name ? `${a.name} <${a.email}>` : a.email).join(", ")
    : "No attendees listed";

  const emailBlock = input.recentEmails.length > 0
    ? input.recentEmails.map((e, i) =>
      `${i + 1}. From: ${e.from} — "${e.subject}" (${e.timestamp})\n   ${e.snippet}`
    ).join("\n")
    : "No recent emails found with attendees.";

  const followUpBlock = input.pendingFollowUps.length > 0
    ? input.pendingFollowUps.map((f, i) =>
      `${i + 1}. "${f.subject}" → ${f.toEmail} (sent ${f.sentAt})`
    ).join("\n")
    : "No pending follow-ups with attendees.";

  const prompt = `You are an AI meeting prep assistant. Generate a concise meeting brief for the following meeting.

MEETING: ${input.summary}
${input.description ? `DESCRIPTION: ${input.description}` : ""}
ATTENDEES: ${attendeeBlock}

RECENT EMAILS WITH ATTENDEES (last 30 days):
${emailBlock}

PENDING FOLLOW-UPS WITH ATTENDEES:
${followUpBlock}

Generate a meeting prep brief. Rules:
- Start with a 1-line meeting context summary
- Include 3-5 suggested talking points based on recent email context
- Mention any open items or follow-ups that need discussion
- Reference specific email topics when relevant
- Keep it under 200 words
- Use bullet points for talking points (use • or -)
- Be concise and actionable — like a trusted advisor prepping you for a meeting
- Do NOT use markdown headers, just plain text
- Do NOT include a sign-off or greeting`;

  try {
    const { text } = await withRetry(async () => {
      return generateText({
        model: meetingProvider(AI_MODEL),
        prompt,
      });
    }, "generateMeetingPrep", 3, "meeting-prep");

    return text.trim();
  } catch (error) {
    console.error("[meeting-prep] Failed:", error);
    return null;
  }
}
