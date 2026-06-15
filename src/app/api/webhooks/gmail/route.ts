import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest";
import { upsertEmail } from "@/lib/sync/gmail";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.CORSAIR_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    const signature = request.headers.get("x-corsair-signature");
    if (WEBHOOK_SECRET && signature) {
      const computed = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
      if (computed !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const { eventType, accountId, data } = payload as {
      eventType: string;
      accountId: string;
      data: unknown;
    };

    if (eventType === "new_email" || eventType === "email.received") {
      const msg = data as {
        id: string;
        threadId: string;
        snippet?: string;
        internalDate?: string;
        labelIds?: string[];
        payload?: Record<string, unknown>;
      };

      const account = await prisma.corsairAccount.findUnique({
        where: { id: accountId },
        select: { tenantId: true },
      });

      if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      await upsertEmail(account.tenantId, msg as Parameters<typeof upsertEmail>[1]);

      await inngest.send({
        name: "email/batch-classify",
        data: { userId: account.tenantId },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] Failed to process:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
