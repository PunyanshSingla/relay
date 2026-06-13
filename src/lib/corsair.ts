import 'dotenv/config';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { pool } from '@/lib/prisma';

export const corsair = createCorsair({
    plugins: [gmail()],
    database: pool,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true,
});