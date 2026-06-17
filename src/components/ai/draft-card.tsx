"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Edit3,
  X,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ComposeEditor,
  type ComposeEditorRef,
} from "@/components/inbox/compose-editor";
import type { DraftResult } from "@/lib/ai/tools";

interface DraftCardProps {
  draft: DraftResult;
  onSend: (draft: DraftResult) => void;
  onDiscard: () => void;
  isStreaming?: boolean;
}

export function DraftCard({
  draft,
  onSend,
  onDiscard,
  isStreaming,
}: DraftCardProps) {
  const [editing, setEditing] = useState(false);
  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const editorRef = useRef<ComposeEditorRef>(null);
  const lastStreamedBody = useRef(draft.body);

  useEffect(() => {
    setTo(draft.to);
  }, [draft.to]);

  useEffect(() => {
    setSubject(draft.subject);
  }, [draft.subject]);

  useEffect(() => {
    if (draft.body && draft.body !== lastStreamedBody.current) {
      lastStreamedBody.current = draft.body;
      if (!editing && editorRef.current) {
        editorRef.current.setContent(draft.body);
      }
      setBody(draft.body);
    }
  }, [draft.body, editing]);

  useEffect(() => {
    if (!isStreaming && editorRef.current && body) {
      editorRef.current.setContent(body);
    }
  }, [isStreaming, body]);

  const handleSend = async () => {
    if (!confirmSend) {
      setConfirmSend(true);
      setTimeout(() => setConfirmSend(false), 4000);
      return;
    }

    setSending(true);
    const html =
      editing && editorRef.current ? editorRef.current.getHTML() : body;
    await onSend({ ...draft, to, subject, body: html });
    setSending(false);
    setConfirmSend(false);
  };

  const handleToggleEdit = () => {
    if (!editing && editorRef.current) {
      editorRef.current.setContent(body);
    }
    setEditing(!editing);
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {draft.type === "reply" ? "Reply Draft" : "Email Draft"}
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-[10px] text-primary animate-pulse">
              <Sparkles className="size-2.5" />
              Writing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleToggleEdit}
            disabled={isStreaming}
          >
            <Edit3 className="size-3" />
          </Button>
        </div>
      </div>

      {/* Fields */}
      <div className="px-3 py-2 space-y-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">To:</span>
          {editing ? (
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-6 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
            />
          ) : (
            <span className="text-xs">{to || (isStreaming ? "..." : "")}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12">Subj:</span>
          {editing ? (
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-6 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
            />
          ) : (
            <span className="text-xs font-medium">
              {subject || (isStreaming ? "..." : "")}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2 min-h-[80px] max-h-[300px] overflow-y-auto">
        {editing || isStreaming ? (
          <div className="min-h-[120px]">
            <ComposeEditor
              ref={editorRef}
              content={body || ""}
              onChange={setBody}
            />
          </div>
        ) : (
          <div
            className="text-xs text-muted-foreground prose prose-xs max-w-none"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-border bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={onDiscard}
          disabled={isStreaming}
        >
          <X className="size-3 mr-1" />
          Discard
        </Button>
        <Button
          size="sm"
          className={cn(
            "text-xs h-7",
            confirmSend && "bg-emerald-600 hover:bg-emerald-700 text-white"
          )}
          onClick={handleSend}
          disabled={sending || isStreaming}
        >
          {sending ? (
            <Loader2 className="size-3 mr-1 animate-spin" />
          ) : confirmSend ? (
            <Check className="size-3 mr-1" />
          ) : (
            <Send className="size-3 mr-1" />
          )}
          {sending
            ? "Sending..."
            : confirmSend
              ? "Confirm Send"
              : "Send"}
        </Button>
      </div>
    </div>
  );
}
