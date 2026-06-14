import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import { mapGmailMessageToEmail } from "@/lib/gmail-utils";

const PAGE_SIZE = 7;

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const maxResults = Math.min(
    parseInt(searchParams.get("maxResults") || String(PAGE_SIZE), 10),
    25
  );
  const pageToken = searchParams.get("pageToken") || undefined;
  const q = searchParams.get("q") || undefined;

  try {
    const tenant = corsair.withTenant(session.user.id);

    const listResult = await tenant.gmail.api.messages.list({
      maxResults,
      pageToken,
      q,
    });

    const messages = listResult.messages ?? [];
    if (messages.length === 0) {
      return NextResponse.json({
        emails: [],
        nextPageToken: null,
      });
    }

    const detailedMessages = await Promise.allSettled(
      messages.map((msg) =>
        tenant.gmail.api.messages.get({
          id: msg.id!,
          format: "full",
        })
      )
    );

    const emails = detailedMessages
      .filter((result) => result.status === "fulfilled")
      .map((result) => mapGmailMessageToEmail(result.value));

    console.log("GMAIL DEBUG - mapped emails:", emails.length, "from", detailedMessages.length, "messages");

    return NextResponse.json({
      emails,
      nextPageToken: listResult.nextPageToken ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch emails";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
