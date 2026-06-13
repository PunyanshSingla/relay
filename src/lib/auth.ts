import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { dash } from "@better-auth/infra";
import { sendVerificationEmail, sendResetPasswordEmail } from "./email/resend";

const isProduction = process.env.NODE_ENV === "production";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const pool = globalForPrisma.pgPool || new Pool({ connectionString: process.env.DATABASE_URL });
if (!isProduction) globalForPrisma.pgPool = pool;

const adapter = new PrismaPg(pool);

const client = globalForPrisma.prisma || new PrismaClient({ adapter });
if (!isProduction) globalForPrisma.prisma = client;

/**
 * Safer URL rewriting using URL API
 */
function rewriteUrl(url: string, from: string, to: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.pathname = urlObj.pathname.replace(from, to);
    return urlObj.toString();
  } catch {
    // Fallback to string replacement if URL parsing fails
    return url.replace(from, to);
  }
}

export const auth = betterAuth({
  database: prismaAdapter(client, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000/",

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh every 1 day
  },

  // Cookie and security settings
  advanced: {
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    },
  },

  // Rate limiting
  rateLimit: {
    window: 60, // 1 minute window
    max: 100, // 100 requests per window
  },

  // Email and password policy
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128, // Prevent bcrypt DoS with extremely long passwords
  },

  // Email verification
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 60 * 60 * 24, // 24 hours
  },

  sendVerificationEmail: async (data: {
    user: { email: string; name: string };
    url: string;
    token: string;
  }) => {
    const { user, url } = data;
    // Rewrite URL from backend API route to frontend verification page
    const frontendUrl = rewriteUrl(url, "/api/auth/verify-email", "/verify-email");
    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      url: frontendUrl,
    });
  },

  sendResetPassword: async (data: {
    user: { email: string; name: string };
    url: string;
    token: string;
  }) => {
    const { user, url } = data;
    // Rewrite URL from backend API route to frontend reset page
    const frontendUrl = rewriteUrl(url, "/api/auth/reset-password", "/reset-password");
    await sendResetPasswordEmail({
      email: user.email,
      name: user.name,
      url: frontendUrl,
    });
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  plugins: [dash()],
});
