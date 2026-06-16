"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  X,
  Send,
  Paperclip,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  File,
  ImageIcon,
  FileText,
  Film,
  Music,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComposeEditor, type ComposeEditorRef } from "@/components/inbox/compose-editor";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { cn } from "@/lib/utils";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data?: ArrayBuffer;
  url?: string;
}

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "new" | "reply" | "replyAll" | "forward";
  replyTo?: {
    name: string;
    email: string;
    subject: string;
    threadId?: string;
    bodyHtml?: string;
    to?: string;
    cc?: string;
  };
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.startsWith("text/")) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
  };
  return mimeMap[ext] ?? "application/octet-stream";
}

export function ComposeModal({
  open,
  onOpenChange,
  mode = "new",
  replyTo,
}: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const editorRef = useRef<ComposeEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      if (mode === "reply" && replyTo) {
        setTo(replyTo.email);
        setSubject(`Re: ${replyTo.subject.replace(/^Re:\s*/i, "")}`);
        setBodyHtml(
          replyTo.bodyHtml
            ? `<br><br><blockquote style="border-left: 2px solid #ddd; padding-left: 12px; color: #555;">${replyTo.bodyHtml}</blockquote>`
            : ""
        );
        setShowCcBcc(false);
      } else if (mode === "replyAll" && replyTo) {
        setTo(replyTo.email);
        setCc(replyTo.cc || "");
        setSubject(`Re: ${replyTo.subject.replace(/^Re:\s*/i, "")}`);
        setBodyHtml(
          replyTo.bodyHtml
            ? `<br><br><blockquote style="border-left: 2px solid #ddd; padding-left: 12px; color: #555;">${replyTo.bodyHtml}</blockquote>`
            : ""
        );
        setShowCcBcc(!!replyTo.cc);
      } else if (mode === "forward" && replyTo) {
        setTo("");
        setSubject(`Fwd: ${replyTo.subject.replace(/^Fwd:\s*/i, "")}`);
        setBodyHtml(
          replyTo.bodyHtml
            ? `<br><br>---------- Forwarded message ----------<br>${replyTo.bodyHtml}`
            : ""
        );
        setShowCcBcc(false);
      } else {
        setTo("");
        setCc("");
        setBcc("");
        setSubject("");
        setBodyHtml("");
        setShowCcBcc(false);
      }
      setAttachments([]);
      setError(null);
      setSending(false);
      setUrlInput("");
      setShowUrlInput(false);
    }
  }, [open, mode, replyTo]);

  const addAttachments = useCallback((files: FileList | File[]) => {
    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      type: file.type || guessMimeType(file.name),
      size: file.size,
      data: undefined,
    }));

    const readFiles = Array.from(files).map((file, i) =>
      file.arrayBuffer().then((data) => {
        newAttachments[i].data = data;
      })
    );

    Promise.all(readFiles).then(() => {
      setAttachments((prev) => [...prev, ...newAttachments]);
    });
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addUrlAttachment = useCallback(() => {
    if (!urlInput.trim()) return;
    const name = urlInput.split("/").pop()?.split("?")[0] ?? "attachment";
    const mimeType = guessMimeType(name);
    setAttachments((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name,
        type: mimeType,
        size: 0,
        url: urlInput.trim(),
      },
    ]);
    setUrlInput("");
    setShowUrlInput(false);
  }, [urlInput]);

  const totalSize = attachments.reduce((sum, a) => sum + a.size, 0);
  const MAX_SIZE = 25 * 1024 * 1024;

  const handleSend = useCallback(async () => {
    if (!to.trim()) {
      setError("Please enter a recipient");
      return;
    }

    const currentHtml = editorRef.current?.getHTML() ?? bodyHtml;
    if (!currentHtml || currentHtml === "<p></p>") {
      setError("Please write a message");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("to", to);
      if (cc) formData.append("cc", cc);
      if (bcc) formData.append("bcc", bcc);
      formData.append("subject", subject);
      formData.append("bodyHtml", currentHtml);
      if (replyTo?.threadId) formData.append("threadId", replyTo.threadId);

      const fileAttachments = attachments.filter((a) => a.data);
      const urlAttachments = attachments.filter((a) => a.url);

      for (const att of fileAttachments) {
        formData.append("attachments", new Blob([att.data!], { type: att.type }), att.name);
      }

      if (urlAttachments.length > 0) {
        formData.append("attachmentUrls", JSON.stringify(urlAttachments.map((a) => a.url)));
      }

      const response = await fetch("/api/emails/send", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  }, [to, cc, bcc, subject, bodyHtml, attachments, replyTo, onOpenChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  const modeTitle =
    mode === "reply"
      ? `Reply to ${replyTo?.name}`
      : mode === "replyAll"
        ? `Reply all to ${replyTo?.name}`
        : mode === "forward"
          ? "Forward"
          : "New Message";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[720px] p-0 gap-0"
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between px-5 py-3 border-b border-border">
          <DialogTitle className="text-base font-semibold">{modeTitle}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </DialogHeader>

        <div className="flex flex-col max-h-[calc(100vh-200px)]">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border">
              <label className="text-sm text-muted-foreground w-16 shrink-0 font-medium">From</label>
              <span className="text-sm text-foreground">You</span>
            </div>

            <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border">
              <label className="text-sm text-muted-foreground w-16 shrink-0 font-medium">To</label>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@email.com"
                className="border-0 focus-visible:ring-0 h-8 px-1 py-1 text-sm flex-1"
              />
              {!showCcBcc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setShowCcBcc(true)}
                >
                  Cc / Bcc
                  <ChevronDown className="size-3 ml-1" />
                </Button>
              )}
            </div>

            {showCcBcc && (
              <>
                <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border">
                  <label className="text-sm text-muted-foreground w-16 shrink-0 font-medium">Cc</label>
                  <Input
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@email.com"
                    className="border-0 focus-visible:ring-0 h-8 px-1 py-1 text-sm flex-1"
                  />
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border">
                  <label className="text-sm text-muted-foreground w-16 shrink-0 font-medium">Bcc</label>
                  <Input
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@email.com"
                    className="border-0 focus-visible:ring-0 h-8 px-1 py-1 text-sm flex-1"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border">
              <label className="text-sm text-muted-foreground w-16 shrink-0 font-medium">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="border-0 focus-visible:ring-0 h-8 px-1 py-1 text-sm flex-1"
              />
            </div>
          </div>

          <div
            ref={dropRef}
            className={cn(
              "relative flex-1 overflow-y-auto overflow-x-hidden",
              "min-h-[250px]"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dropRef.current?.classList.add("ring-2", "ring-primary", "ring-offset-2");
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dropRef.current?.classList.remove("ring-2", "ring-primary", "ring-offset-2");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dropRef.current?.classList.remove("ring-2", "ring-primary", "ring-offset-2");
              if (e.dataTransfer.files.length > 0) {
                addAttachments(e.dataTransfer.files);
              }
            }}
          >
            <ComposeEditor
              ref={editorRef}
              content={bodyHtml}
              onChange={setBodyHtml}
              emailContext={{ subject, to, thread: replyTo?.bodyHtml }}
            />
          </div>

          {attachments.length > 0 && (
            <div className="border-t border-border px-5 py-3 space-y-2 max-h-[120px] overflow-y-auto">
              {attachments.map((att) => {
                const Icon = getFileIcon(att.type);
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{att.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {att.size > 0 ? formatFileSize(att.size) : "URL attachment"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeAttachment(att.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {totalSize > MAX_SIZE * 0.8 && (
            <div className="px-5 py-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-t border-border">
              Attachment size: {formatFileSize(totalSize)} / {formatFileSize(MAX_SIZE)} max
            </div>
          )}
        </div>

        {error && (
          <div className="px-5 py-2 text-sm text-destructive bg-destructive/10 border-t border-border">
            {error}
          </div>
        )}

        <div className="relative z-10 flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={handleSend}
              disabled={sending || !to.trim()}
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {sending ? "Sending..." : "Send"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-4" />
              File
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              <LinkIcon className="size-4" />
              URL
            </Button>
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                editorRef.current?.focus();
                document.execCommand("insertText", false, emoji);
              }}
            />
          </div>
        </div>

        {showUrlInput && (
          <div className="flex items-center gap-2 px-5 py-2 border-t border-border bg-muted/20">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/file.pdf"
              className="h-8 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrlAttachment();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={addUrlAttachment}
              disabled={!urlInput.trim()}
            >
              Attach
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              addAttachments(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
