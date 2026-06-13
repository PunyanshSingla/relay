"use client";

import { X, Send, Paperclip, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    name: string;
    email: string;
    subject: string;
  };
}

export function ComposeModal({ open, onOpenChange, replyTo }: ComposeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[640px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border">
          <DialogTitle className="text-base font-semibold">
            {replyTo ? `Reply to ${replyTo.name}` : "New Message"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </DialogHeader>

        <div className="flex flex-col">
          {/* To field */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
            <label className="text-sm text-muted-foreground w-14 shrink-0 font-medium">To</label>
            <Input
              defaultValue={replyTo?.email || ""}
              placeholder="recipient@email.com"
              className="border-0 focus-visible:ring-0 h-9 px-1 py-1 text-sm"
            />
          </div>

          {/* Subject field */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
            <label className="text-sm text-muted-foreground w-14 shrink-0 font-medium">Subject</label>
            <Input
              defaultValue={replyTo ? `Re: ${replyTo.subject}` : ""}
              placeholder="Subject"
              className="border-0 focus-visible:ring-0 h-9 px-1 py-1 text-sm"
            />
          </div>

          {/* Body */}
          <div className="px-5 py-4">
            <Textarea
              placeholder="Write your message..."
              className="min-h-[280px] border-0 focus-visible:ring-0 resize-none px-1 py-2 text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5">
              <Send className="size-4" />
              Send
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Paperclip className="size-4" />
              Attach
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Sparkles className="size-4" />
            AI Draft
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
