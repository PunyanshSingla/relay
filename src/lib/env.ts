/**
 * Environment variable validation
 * Validates required env vars at startup and fails fast with clear error messages
 */

function getEnvVar(name: string, required: boolean = true): string | undefined {
  const value = process.env[name];
  if (required && (!value || value.trim() === "")) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Please add it to your .env file or environment configuration.`
    );
  }
  return value;
}

function validateUrl(name: string, value: string): void {
  try {
    new URL(value);
  } catch {
    throw new Error(
      `Invalid URL format for ${name}: "${value}"\n` +
      `Expected a valid URL like http://localhost:3000 or https://relay.ai`
    );
  }
}

function validateResendApiKey(key: string): void {
  if (!key.startsWith("re_")) {
    throw new Error(
      `Invalid RESEND_API_KEY format.\n` +
      `Expected a key starting with "re_", got: "${key.slice(0, 10)}..."`
    );
  }
}

/**
 * Validate all environment variables and return typed config
 * Call this once at application startup
 */
export function validateEnv() {
  const BETTER_AUTH_URL = getEnvVar("BETTER_AUTH_URL") || "http://localhost:3000";
  const RESEND_API_KEY = getEnvVar("RESEND_API_KEY", process.env.NODE_ENV === "production");
  const EMAIL_FROM = getEnvVar("EMAIL_FROM", false) || "relay@resend.dev";
  const EMAIL_DOMAIN = getEnvVar("EMAIL_DOMAIN", false) || "resend.dev";

  // Validate URL formats
  validateUrl("BETTER_AUTH_URL", BETTER_AUTH_URL);

  // Validate Resend API key format
  if (RESEND_API_KEY) {
    validateResendApiKey(RESEND_API_KEY);
  }

  return {
    DATABASE_URL: getEnvVar("DATABASE_URL"),
    BETTER_AUTH_SECRET: getEnvVar("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: getEnvVar("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: getEnvVar("GOOGLE_CLIENT_SECRET"),
    RESEND_API_KEY,
    EMAIL_FROM,
    EMAIL_DOMAIN,
    NEXT_PUBLIC_APP_URL: getEnvVar("NEXT_PUBLIC_APP_URL", false) || "http://localhost:3000",
    NODE_ENV: process.env.NODE_ENV || "development",
  } as const;
}

/**
 * Type-safe environment config
 */
export type EnvConfig = ReturnType<typeof validateEnv>;

// Singleton cache
let envConfig: EnvConfig | null = null;

/**
 * Get validated environment config (cached after first call)
 */
export function getEnv(): EnvConfig {
  if (!envConfig) {
    envConfig = validateEnv();
  }
  return envConfig;
}
