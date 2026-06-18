"use client";

import { useState, useCallback, useRef } from "react";
import {
  Sparkles,
  SpellCheck,
  PenLine,
  Briefcase,
  Coffee,
  Shrink,
  Expand,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Editor } from "@tiptap/core";

interface AiToolbarProps {
  editor: Editor;
  context?: {
    subject?: string;
    to?: string;
    thread?: string;
  };
}

type AiAction = "fix" | "improve" | "write" | "tone" | "shorten" | "expand";

async function callAi(
  action: AiAction,
  text: string,
  ctx?: { subject?: string; to?: string; thread?: string },
  tone?: string,
  customPrompt?: string,
): Promise<string> {
  const res = await fetch("/api/ai/compose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, text, ...ctx, tone, customPrompt }),
  });
  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return data.result;
}

export function AiToolbar({ editor, context }: AiToolbarProps) {
  const [loading, setLoading] = useState<AiAction | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [improveOpen, setImproveOpen] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const improveInputRef = useRef<HTMLTextAreaElement>(null);
  const writeInputRef = useRef<HTMLTextAreaElement>(null);

  const getTargetText = useCallback(() => {
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    return {
      text: hasSelection
        ? editor.state.doc.textBetween(from, to)
        : editor.state.doc.textContent,
      hasSelection,
      from,
      to,
    };
  }, [editor]);

  const replaceText = useCallback(
    (newText: string, hasSelection: boolean, from: number, to: number) => {
      if (hasSelection) {
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContentAt(from, newText)
          .run();
      } else {
        editor.commands.setContent(newText);
      }
    },
    [editor],
  );

  const handleAction = useCallback(
    async (action: AiAction, tone?: string, customImprovePrompt?: string) => {
      if (loading) return;
      const { text, hasSelection, from, to } = getTargetText();
      if (!text.trim()) return;

      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(action);

      try {
        const result = await callAi(
          action,
          text,
          context,
          tone,
          customImprovePrompt,
        );
        replaceText(result, hasSelection, from, to);
        setLoading(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setLoading(null);
          return;
        }
        console.error("[ai-toolbar] Error:", err);
        setLoading(null);
      }
    },
    [loading, getTargetText, replaceText, context],
  );

  const submitImprove = useCallback(() => {
    handleAction("improve", undefined, customPrompt || undefined);
    setImproveOpen(false);
    setCustomPrompt("");
  }, [handleAction, customPrompt]);

  const [writePrompt, setWritePrompt] = useState("");

  const submitWrite = useCallback(() => {
    handleAction("write", undefined, writePrompt || undefined);
    setWriteOpen(false);
    setWritePrompt("");
  }, [handleAction, writePrompt]);

  const isBusy = loading !== null;

  return (
    <div className="flex items-center gap-0.5 border-l border-border pl-2 ml-1">
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-1" />
      )}

      {/* Fix Spelling */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            disabled={isBusy}
            onClick={() => handleAction("fix")}
          >
            <SpellCheck className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fix Spelling &amp; Grammar</TooltipContent>
      </Tooltip>

      {/* Improve with custom prompt */}
      <Popover
        open={improveOpen}
        onOpenChange={(open) => {
          setImproveOpen(open);
          if (open) {
            setTimeout(() => improveInputRef.current?.focus(), 50);
          }
        }}
      >
        <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                disabled={isBusy}
                title="Improve Writing"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8} className="w-80">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              How should we improve this?
            </p>
            <textarea
              ref={improveInputRef}
              placeholder="e.g. make it more professional..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitImprove();
                }
                if (e.key === "Escape") {
                  setImproveOpen(false);
                  setCustomPrompt("");
                }
              }}
              className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setImproveOpen(false);
                  setCustomPrompt("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={submitImprove}
              >
                {customPrompt.trim() ? "Apply" : "Improve"}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Write with AI */}
      <Popover
        open={writeOpen}
        onOpenChange={(open) => {
          setWriteOpen(open);
          if (open) {
            setTimeout(() => writeInputRef.current?.focus(), 50);
          }
        }}
      >
        <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                disabled={isBusy}
                title="Write with AI"
              >
                <PenLine className="h-4 w-4" />
              </Button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8} className="w-80">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              What should the email say?
            </p>
            <textarea
              ref={writeInputRef}
              placeholder="e.g. thank them for the meeting and propose next Tuesday..."
              value={writePrompt}
              onChange={(e) => setWritePrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitWrite();
                }
                if (e.key === "Escape") {
                  setWriteOpen(false);
                  setWritePrompt("");
                }
              }}
              className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setWriteOpen(false);
                  setWritePrompt("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={submitWrite}
              >
                {writePrompt.trim() ? "Generate" : "Write"}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Tone Dropdown */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                disabled={isBusy}
              >
                <PenLine className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Change Tone</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Change Tone</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction("tone", "formal")}>
            <Briefcase className="h-4 w-4 mr-2" />
            Formal
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("tone", "casual")}>
            <Coffee className="h-4 w-4 mr-2" />
            Casual
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("tone", "friendly")}>
            <Sparkles className="h-4 w-4 mr-2" />
            Friendly
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Shorten */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            disabled={isBusy}
            onClick={() => handleAction("shorten")}
          >
            <Shrink className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Shorten</TooltipContent>
      </Tooltip>

      {/* Expand */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            disabled={isBusy}
            onClick={() => handleAction("expand")}
          >
            <Expand className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Expand</TooltipContent>
      </Tooltip>
    </div>
  );
}
