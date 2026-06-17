import { corsair, ensureCorsairSetup, ensureTenant } from "@/lib/corsair";
import { prisma } from "@/lib/prisma";

async function hasCalendarAccount(userId: string): Promise<boolean> {
  const account = await prisma.corsairAccount.findFirst({
    where: { tenantId: userId, integration: { name: "googlecalendar" } },
    select: { id: true },
  });
  return account !== null;
}

export async function syncCalendarEvents(
  userId: string,
): Promise<{ syncCount: number }> {
  const connected = await hasCalendarAccount(userId);
  if (!connected) return { syncCount: 0 };

  await ensureCorsairSetup();
  await ensureTenant(userId);

  const tenant = corsair.withTenant(userId);

  const now = new Date().toISOString();

  const result = await tenant.googlecalendar.api.events.getMany({
    timeMin: now,
    maxResults: 250,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = result.items ?? [];
  return { syncCount: events.length };
}

export async function getUpcomingEvents(
  userId: string,
  limit: number = 50,
  timeMin?: string,
  timeMax?: string,
) {
  const connected = await hasCalendarAccount(userId);
  if (!connected) return [];

  await ensureCorsairSetup();
  await ensureTenant(userId);

  const tenant = corsair.withTenant(userId);

  const result = await tenant.googlecalendar.api.events.getMany({
    timeMin: timeMin ?? new Date().toISOString(),
    timeMax: timeMax ?? undefined,
    maxResults: limit,
    singleEvents: true,
    orderBy: "startTime",
  });

  return result.items ?? [];
}
