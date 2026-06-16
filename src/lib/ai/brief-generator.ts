import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { withRetry } from "./retry";

const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash-lite";

const briefProvider = createGoogleGenerativeAI({
  apiKey: process.env.CLASSIFY_API_KEY || "",
});

export interface BriefInput {
  emails: Array<{
    from: string;
    subject: string;
    preview: string;
    priority: string;
    timestamp: string;
  }>;
  meetings: Array<{
    summary: string;
    startTime: string;
    attendees?: string;
  }>;
  pendingFollowUps: Array<{
    subject: string;
    toEmail: string;
    sentAt: string;
  }>;
  overdueFollowUps: Array<{
    subject: string;
    toEmail: string;
    sentAt: string;
    daysSince: number;
  }>;
}

export async function generateBrief(input: BriefInput): Promise<string | null> {
  const emailBlock = input.emails.length > 0
    ? input.emails.map((e, i) =>
      `${i + 1}. [${e.priority}] From: ${e.from} — "${e.subject}" (${e.timestamp})\n   ${e.preview}`
    ).join("\n")
    : "No important emails in the last 24 hours.";

  const meetingBlock = input.meetings.length > 0
    ? input.meetings.map((m, i) =>
      `${i + 1}. ${m.summary} at ${m.startTime}${m.attendees ? ` with ${m.attendees}` : ""}`
    ).join("\n")
    : "No meetings scheduled today.";

  const followUpBlock = input.pendingFollowUps.length > 0
    ? input.pendingFollowUps.map((f, i) =>
      `${i + 1}. "${f.subject}" → ${f.toEmail} (sent ${f.sentAt})`
    ).join("\n")
    : "No pending follow-ups.";

  const overdueBlock = input.overdueFollowUps.length > 0
    ? input.overdueFollowUps.map((o, i) =>
      `${i + 1}. "${o.subject}" → ${o.toEmail} (sent ${o.daysSince} days ago — OVERDUE)`
    ).join("\n")
    : "No overdue items.";

  const prompt = `You are an AI Chief of Staff generating a concise morning briefing.

Today's Date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

IMPORTANT EMAILS (last 24 hours):
${emailBlock}

TODAY'S MEETINGS:
${meetingBlock}

PENDING FOLLOW-UPS (awaiting reply):
${followUpBlock}

OVERDUE ITEMS (follow-ups > 5 days with no reply):
${overdueBlock}

Generate a concise executive morning brief. Rules:
- Start with a 1-line overall status (e.g., "Light day ahead" or "Busy day with 3 urgent items")
- Use 3-5 bullet points covering the most important items across all sections
- Highlight any overdue items or P1 emails as urgent
- Mention key meetings and who they're with
- Keep the total brief under 200 words
- Use natural, conversational tone — like a trusted advisor briefing you
- Do NOT use markdown headers, just plain text with bullet points (use • or -)
- Do NOT include a sign-off or greeting`;

  try {
    const { text } = await withRetry(async () => {
      return generateText({
        model: briefProvider(AI_MODEL),
        prompt,
      });
    }, "generateBrief", 3, "brief-generator");

    return text.trim();
  } catch (error) {
    console.error("[brief-generator] Failed:", error);
    return null;
  }
}
