import { Text } from "@react-email/components";

const containerStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#71717a",
  wordBreak: "break-all",
  marginTop: "16px",
  textAlign: "left",
  backgroundColor: "#0b0a0a",
  padding: "12px",
  borderRadius: "6px",
  border: "1px solid #1a1919",
};

const labelStyle: React.CSSProperties = { color: "#f3f4f6" };
const urlStyle: React.CSSProperties = { color: "#d4af37" };

interface LinkFallbackProps {
  url: string;
}

export function LinkFallback({ url }: LinkFallbackProps) {
  return (
    <Text style={containerStyle}>
      <strong style={labelStyle}>Button not working?</strong>{" "}
      Copy and paste this link into your browser:
      <br />
      <span style={urlStyle}>{url}</span>
    </Text>
  );
}
