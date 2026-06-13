import { Text, Hr } from "@react-email/components";
import { EmailLayout } from "./layouts/EmailLayout";
import { EmailButton, EmailFooter, LinkFallback } from "@/components/email";


interface VerificationEmailProps {
  name: string;
  url: string;
}

export function VerificationEmail({ name, url }: VerificationEmailProps) {
  return (
    <EmailLayout
      preview={`Hi ${name}, verify your email to activate your Relay workspace.`}
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
        Verify your email address
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
        Welcome to Relay. To complete your registration and activate your
        workspace, please click the button below to verify your email address:
      </Text>

      <EmailButton href={url}>Verify Email Address</EmailButton>

      <Text
        style={{
          fontSize: "15px",
          lineHeight: "1.6",
          margin: "0 0 24px 0",
          color: "#a1a1aa",
        }}
      >
        This verification link will expire in 24 hours. If you did not create a
        Relay account, you can safely ignore this email.
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

export default VerificationEmail;
