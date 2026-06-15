import 'dotenv/config';
import { createCorsair, setupCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === "production";

const globalForCorsair = globalThis as unknown as {
  corsairPool?: Pool;
};

const corsairPool =
  globalForCorsair.corsairPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    allowExitOnIdle: true,
  });
if (!isProduction) globalForCorsair.corsairPool = corsairPool;

export const corsair = createCorsair({
    plugins: [gmail(), googlecalendar()],
    database: corsairPool,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});

export async function ensureCorsairSetup() {
    await setupCorsair(corsair);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (clientId && clientSecret) {
        await corsair.keys.gmail.set_client_id(clientId);
        await corsair.keys.gmail.set_client_secret(clientSecret);
        await corsair.keys.googlecalendar.set_client_id(clientId);
        await corsair.keys.googlecalendar.set_client_secret(clientSecret);
    }
}

export async function ensureTenant(tenantId: string) {
    await setupCorsair(corsair, { tenantId });
}
