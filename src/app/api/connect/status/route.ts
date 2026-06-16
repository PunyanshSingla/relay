import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    }),
  );

  return NextResponse.json({
    gmail: cookies["gmail_connected"] === "true",
    calendar: cookies["calendar_connected"] === "true",
  });
}
