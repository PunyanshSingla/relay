import { Button } from "@react-email/components";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={{
        background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
        color: "#0b0a0a",
        fontWeight: 600,
        fontSize: "14px",
        textDecoration: "none",
        padding: "14px 32px",
        borderRadius: "8px",
        display: "inline-block",
        boxShadow: "0 10px 20px rgba(212, 175, 55, 0.15)",
      }}
    >
      {children}
    </Button>
  );
}
