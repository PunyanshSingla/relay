"use client";

import { useState, useRef } from "react";
import { Send, Edit3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComposeEditor, type ComposeEditorRef } from "@/components/inbox/compose-editor";
import type { DraftResult } from "@/lib/ai/tools";

interface DraftCardProps {
  draft: DraftResult;
  onSend: (draft: DraftResult) => void;
}

export function DraftCard({ draft, onSend }: DraftCardProps) {
  const [editing, setEditing] = useState(false);
  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const editorRef = useRef<ComposeEditorRef>(null);

  const handleSend = () => {
    const html = editing && editorRef.current ? editorRef.current.getHTML() : body;
    onSend({ ...draft, to, subject, body: html });
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {draft.type === "reply" ? "Reply Draft" : "Email Draft"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setEditing(!editing)}
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
            <span className="text-xs">{to}</span>
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
            <span className="text-xs font-medium">{subject}</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2 min-h-[80px] max-h-[200px] overflow-y-auto">
        {editing ? (
          <div className="min-h-[120px]">
            <ComposeEditor
              ref={editorRef}
              content={body}
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
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {}}>
          <X className="size-3 mr-1" />
          Discard
        </Button>
        <Button size="sm" className="text-xs h-7" onClick={handleSend}>
          <Send className="size-3 mr-1" />
          Send
        </Button>
      </div>
    </div>
  );
}
