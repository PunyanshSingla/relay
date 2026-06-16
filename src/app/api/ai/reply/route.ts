import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { emailId, mode } = body as { emailId?: string; mode?: string };

  if (!emailId) {
    return NextResponse.json({ error: "emailId is required" }, { status: 400 });
  }

  const email = await prisma.email.findUnique({
    where: { id: emailId },
    select: {
      userId: true,
      replyGenerated: true,
      generatedReply: true,
      needsReply: true,
      replyMode: true,
    },
  });

  if (!email || email.userId !== session.user.id) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  if (email.replyGenerated && email.generatedReply && (!mode || email.replyMode === mode)) {
    return NextResponse.json({
      status: "ready",
      needsReply: email.needsReply,
      reply: email.generatedReply,
      reason: "Cached",
    });
  }

  if (email.replyGenerated && email.needsReply === false && (!mode || email.replyMode === mode)) {
    return NextResponse.json({
      status: "no_reply_needed",
      needsReply: false,
      reply: null,
      reason: "No reply needed",
    });
  }

  await inngest.send({
    name: "email/generate-reply",
    data: { userId: session.user.id, emailId, mode: mode ?? "professional" },
  });

  return NextResponse.json({ status: "generating" });
}
