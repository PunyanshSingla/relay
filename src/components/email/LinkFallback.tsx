import { Text } from "@react-email/components";

interface LinkFallbackProps {
  url: string;
}

export function LinkFallback({ url }: LinkFallbackProps) {
  return (
    <Text
      style={{
        fontSize: "12px",
        color: "#71717a",
        wordBreak: "break-all",
        marginTop: "16px",
        textAlign: "left",
        backgroundColor: "#0b0a0a",
        padding: "12px",
        borderRadius: "6px",
        border: "1px solid #1a1919",
      }}
    >
      <strong style={{ color: "#f3f4f6" }}>Button not working?</strong>{" "}
      Copy and paste this link into your browser:
      <br />
      <span style={{ color: "#d4af37" }}>{url}</span>
    </Text>
  );
}
