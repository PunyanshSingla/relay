"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Mic, MicOff, Square } from "lucide-react";
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

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

function getSpeechRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === "undefined") return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  return new SR();
}

export function ChatInput({
  onSend,
  disabled,
  placeholder,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice state
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setVoiceSupported(getSpeechRecognition() !== null);
  }, []);

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
    setInterimText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = getSpeechRecognition();
    if (!recognition) return;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = value; // preserve existing text

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
        } else {
          interim += transcript;
        }
      }
      setValue(finalTranscript);
      setInterimText(interim);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

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
          placeholder={
            isRecording
              ? "Listening... speak now"
              : placeholder || PLACEHOLDERS[placeholderIdx]
          }
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground min-h-[24px] max-h-[120px]",
            disabled && "opacity-50",
            isRecording && "placeholder:text-red-500/60"
          )}
        />
        {showCharCount && (
          <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
            {charCount}
          </span>
        )}

        {/* Voice input button */}
        {voiceSupported && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "size-8 shrink-0",
              isRecording
                ? "text-red-500 hover:text-red-600 hover:bg-red-500/10 animate-pulse"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={toggleRecording}
            disabled={disabled}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? (
              <Square className="size-4 fill-current" />
            ) : (
              <Mic className="size-4" />
            )}
          </Button>
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

      {/* Voice status */}
      {isRecording && (
        <div className="flex items-center gap-2 mt-1.5">
          <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-red-500 font-medium">
            Recording... click {interimText ? "stop to finish" : "and speak"}
          </span>
          {interimText && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[300px]">
              &quot;{interimText}&quot;
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[10px] text-muted-foreground">
          Enter to send · Shift+Enter for new line
          {voiceSupported ? " · Mic for voice input" : ""}
        </p>
      </div>
    </div>
  );
}
