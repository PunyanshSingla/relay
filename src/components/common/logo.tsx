import Link from "next/link";

export function Logo() {
    return (
        <Link href="/" className="flex shrink-0 items-center gap-2">
            <div
                className="relative flex size-8 items-center justify-center rounded-lg"
                style={{ background: "var(--gradient-primary)" }}
            >
                <svg
                    viewBox="0 0 24 24"
                    className="size-4 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">Relay</span>
        </Link>
    );
}
