import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import { mapGmailMessageToEmail } from "@/lib/gmail-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const tenant = corsair.withTenant(session.user.id);

    const message = await tenant.gmail.api.messages.get({
      id,
      format: "full",
    });

    const email = mapGmailMessageToEmail(message);

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Failed to fetch email:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
