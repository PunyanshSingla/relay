import {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Font,
} from "@react-email/components";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({
  preview,
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          fallbackFontFamily={["Arial", "sans-serif"]}
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#0b0a0a",
          color: "#f3f4f6",
          margin: 0,
          padding: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <Container
          style={{
            width: "100%",
            tableLayout: "fixed",
            backgroundColor: "#0b0a0a",
            padding: "40px 0",
          }}
        >
          <Container
            style={{
              maxWidth: "520px",
              margin: "0 auto",
              backgroundColor: "#121111",
              border: "1px solid #222020",
              borderRadius: "16px",
              padding: "40px",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
            }}
          >
            {children}
          </Container>
        </Container>
      </Body>
    </Html>
  );
}
