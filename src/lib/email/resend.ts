import { Resend } from "resend";
import { render } from "@react-email/render";
import { VerificationEmail } from "../../emails/VerificationEmail";
import { ResetPasswordEmail } from "../../emails/ResetPasswordEmail";

// Environment variables
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM || "relay@resend.dev";
const isProduction = process.env.NODE_ENV === "production";

// Initialize Resend only if API key is provided
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Sanitize user input to prevent XSS in email templates
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 500);
}

/**
 * Delay helper for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email with retry logic
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!resend) {
    if (!isProduction) {
      console.log("----------------------------------------------------------------");
      console.log("[Resend DEV Fallback] No RESEND_API_KEY set. Logging email:");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log("----------------------------------------------------------------");
    }
    return { success: true, logged: true };
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Relay <${fromEmail}>`,
        to,
        subject,
        html,
      });

      if (error) {
        throw new Error(error.message || "Resend API error");
      }

      return { success: true, data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Email send attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        const backoffMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await delay(backoffMs);
      }
    }
  }

  console.error("All email send attempts failed:", lastError?.message);
  throw lastError;
}

/**
 * Send a verification email to a user
 */
export async function sendVerificationEmail({
  email,
  name,
  url,
}: {
  email: string;
  name: string;
  url: string;
}) {
  const sanitizedName = sanitizeInput(name);
  const subject = "Verify your email address - Relay";

  const html = await render(
    VerificationEmail({
      name: sanitizedName,
      url,
    })
  );

  // Log verification link in development for easy access
  if (!isProduction) {
    console.log("================================================================");
    console.log(`[BETTER-AUTH DEV LINK] Verification Link for ${email}:`);
    console.log(url);
    console.log("================================================================");
  }

  return sendEmail({ to: email, subject, html });
}

/**
 * Send a password reset email to a user
 */
export async function sendResetPasswordEmail({
  email,
  name,
  url,
}: {
  email: string;
  name: string;
  url: string;
}) {
  const sanitizedName = sanitizeInput(name);
  const subject = "Reset your password - Relay";

  const html = await render(
    ResetPasswordEmail({
      name: sanitizedName,
      url,
    })
  );

  // Log reset link in development for easy access
  if (!isProduction) {
    console.log("================================================================");
    console.log(`[BETTER-AUTH DEV LINK] Reset Password Link for ${email}:`);
    console.log(url);
    console.log("================================================================");
  }

  return sendEmail({ to: email, subject, html });
}
