import { Text, Hr } from "@react-email/components";
import { EmailLayout } from "./layouts/EmailLayout";
import { EmailButton, EmailFooter, LinkFallback } from "@/components/email";

interface ResetPasswordEmailProps {
  name: string;
  url: string;
}

export function ResetPasswordEmail({ name, url }: ResetPasswordEmailProps) {
  return (
    <EmailLayout
      preview={`Hi ${name}, click the link to reset your Relay password.`}
    >
      <Text
        style={{
          fontSize: "24px",
          fontWeight: 700,
          letterSpacing: "-0.05em",
          color: "#f3f4f6",
          marginBottom: "24px",
        }}
      >
        <span style={{ color: "#d4af37" }}>Relay</span>
      </Text>

      <Text
        style={{
          fontSize: "22px",
          fontWeight: 600,
          margin: "0 0 16px 0",
          color: "#ffffff",
          letterSpacing: "-0.02em",
        }}
      >
        Reset your password
      </Text>

      <Text
        style={{
          fontSize: "15px",
          lineHeight: "1.6",
          margin: "0 0 24px 0",
          color: "#a1a1aa",
        }}
      >
        Hi {name},
      </Text>

      <Text
        style={{
          fontSize: "15px",
          lineHeight: "1.6",
          margin: "0 0 24px 0",
          color: "#a1a1aa",
        }}
      >
        We received a request to reset your password for your Relay account.
        Click the button below to choose a new password:
      </Text>

      <EmailButton href={url}>Reset Password</EmailButton>

      <Text
        style={{
          fontSize: "15px",
          lineHeight: "1.6",
          margin: "0 0 24px 0",
          color: "#a1a1aa",
        }}
      >
        This link will expire in 1 hour. If you did not request a password
        reset, you can safely ignore this email and your password will remain
        unchanged.
      </Text>

      <Hr
        style={{
          height: "1px",
          backgroundColor: "#222020",
          margin: "32px 0",
          border: "none",
        }}
      />

      <LinkFallback url={url} />

      <Hr
        style={{
          height: "1px",
          backgroundColor: "#222020",
          margin: "32px 0",
          border: "none",
        }}
      />

      <EmailFooter />
    </EmailLayout>
  );
}

export default ResetPasswordEmail;
