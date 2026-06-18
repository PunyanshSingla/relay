import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeEmail, type EmailSummaryResult } from "@/lib/ai/email-summarizer";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const email = await prisma.email.findUnique({
      where: { id },
      select: {
        userId: true,
        from: true,
        fromName: true,
        subject: true,
        body: true,
        summary: true,
      },
    });

    if (!email || email.userId !== session.user.id) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Return cached summary
    if (email.summary) {
      try {
        const parsed = JSON.parse(email.summary) as EmailSummaryResult;
        return NextResponse.json({ summary: parsed, cached: true });
      } catch {
        // If JSON is invalid, treat as plain text summary
        return NextResponse.json({
          summary: { summary: email.summary, keyPoints: [], actionItems: [], sentiment: "neutral" as const },
          cached: true,
        });
      }
    }

    // Generate summary
    const result = await summarizeEmail({
      from: email.fromName || email.from,
      subject: email.subject,
      body: email.body,
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }

    // Cache in DB
    await prisma.email.update({
      where: { id },
      data: { summary: JSON.stringify(result) },
    });

    return NextResponse.json({ summary: result, cached: false });
  } catch (error) {
    console.error("[email summary] Failed:", error);
    const message = error instanceof Error ? error.message : "Failed to generate summary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const email = await prisma.email.findUnique({
      where: { id },
      select: {
        userId: true,
        from: true,
        fromName: true,
        subject: true,
        body: true,
      },
    });

    if (!email || email.userId !== session.user.id) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const result = await summarizeEmail({
      from: email.fromName || email.from,
      subject: email.subject,
      body: email.body,
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }

    await prisma.email.update({
      where: { id },
      data: { summary: JSON.stringify(result) },
    });

    return NextResponse.json({ summary: result, cached: false });
  } catch (error) {
    console.error("[email summary] POST failed:", error);
    const message = error instanceof Error ? error.message : "Failed to generate summary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
