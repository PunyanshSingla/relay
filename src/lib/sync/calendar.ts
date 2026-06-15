import { corsair, ensureCorsairSetup, ensureTenant } from "@/lib/corsair";

export async function syncCalendarEvents(
  userId: string,
): Promise<{ syncCount: number }> {
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
  limit: number = 10,
) {
  await ensureCorsairSetup();
  await ensureTenant(userId);

  const tenant = corsair.withTenant(userId);

  const now = new Date().toISOString();

  const result = await tenant.googlecalendar.api.events.getMany({
    timeMin: now,
    maxResults: limit,
    singleEvents: true,
    orderBy: "startTime",
  });

  return result.items ?? [];
}
