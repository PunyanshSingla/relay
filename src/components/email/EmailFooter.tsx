import { Text } from "@react-email/components";

export function EmailFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Text
        style={{
          fontSize: "12px",
          color: "#71717a",
          lineHeight: "1.5",
          margin: "0",
        }}
      >
        &copy; {currentYear} Relay AI, Inc. All rights reserved.
      </Text>
      <Text
        style={{
          fontSize: "12px",
          color: "#71717a",
          lineHeight: "1.5",
          margin: "8px 0 0 0",
        }}
      >
        If you have any questions, reply directly to this email.
      </Text>
    </>
  );
}
