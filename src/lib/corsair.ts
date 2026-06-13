import 'dotenv/config';
import { createCorsair, setupCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { pool } from '@/lib/prisma';

export const corsair = createCorsair({
    plugins: [gmail()],
    database: pool,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});

let integrationInitialized = false;

export async function ensureCorsairSetup() {
    if (integrationInitialized) return;

    await setupCorsair(corsair);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (clientId && clientSecret) {
        await corsair.keys.gmail.set_client_id(clientId);
        await corsair.keys.gmail.set_client_secret(clientSecret);
    }

    integrationInitialized = true;
}

export async function ensureTenant(tenantId: string) {
    await setupCorsair(corsair, { tenantId });
}
