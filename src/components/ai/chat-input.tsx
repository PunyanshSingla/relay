"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = [
  "Ask AI anything about your inbox...",
  "Draft an email to john@company.com about the Q2 report",
  "Reply to the last email from GitHub",
  "Schedule a meeting with the team tomorrow at 3pm",
  "Show me unread emails from this week",
  "What's on my calendar today?",
];

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (placeholder) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [placeholder]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = value.length;
  const showCharCount = charCount > 200;

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="flex items-end gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
        <Sparkles className="size-4 shrink-0 text-primary mt-1" />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || PLACEHOLDERS[placeholderIdx]}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground min-h-[24px] max-h-[120px]",
            disabled && "opacity-50"
          )}
        />
        {showCharCount && (
          <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
            {charCount}
          </span>
        )}
        <Button
          size="icon"
          className="size-8 shrink-0"
          onClick={handleSend}
          disabled={!value.trim() || disabled}
        >
          <Send className="size-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[10px] text-muted-foreground">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
