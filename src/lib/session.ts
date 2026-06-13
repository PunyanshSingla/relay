import { auth } from "./auth";
import { headers } from "next/headers";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) return null;

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
    };
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}
