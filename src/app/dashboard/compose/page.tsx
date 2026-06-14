"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComposeEditor, type ComposeEditorRef } from "@/components/inbox/compose-editor";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { cn } from "@/lib/utils";
import type { Email } from "@/types/email";
import { authClient } from "@/lib/auth-client";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data?: ArrayBuffer;
  url?: string;
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

function ComposeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "new" | "reply" | "replyAll" | "forward" | null ?? "new";
  const replyToId = searchParams.get("replyToId");

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [title, setTitle] = useState("New Message");

  const [originalEmail, setOriginalEmail] = useState<Email | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  const editorRef = useRef<ComposeEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch email context if replyToId is present
  useEffect(() => {
    if (!replyToId) {
      setTo("");
      setCc("");
      setBcc("");
      setSubject("");
      setBodyHtml("");
      setShowCcBcc(false);
      setTitle("New Message");
      setOriginalEmail(null);
      setThreadId(null);
      return;
    }

    async function fetchReplyContext() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/emails/${replyToId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load email thread context");
        }
        const data = await response.json();
        const original: Email = data.email;
        setOriginalEmail(original);
        if (original.threadId) {
          setThreadId(original.threadId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load thread details");
      } finally {
        setLoading(false);
      }
    }

    fetchReplyContext();
  }, [replyToId]);

  // Parse and pre-populate fields once email context and user session are loaded
  useEffect(() => {
    if (!originalEmail) return;

    const normalizedSubject = originalEmail.subject.replace(/^(Re:\s*|Fwd:\s*)+/i, "");
    const userEmail = user?.email?.toLowerCase();

    if (mode === "reply") {
      setTo(originalEmail.from.email);
      setSubject(`Re: ${normalizedSubject}`);
      setBodyHtml(
        `<br><br><blockquote style="border-left: 2px solid #ddd; padding-left: 12px; color: #555;">${
          originalEmail.bodyHtml || originalEmail.body
        }</blockquote>`
      );
      setTitle(`Reply to ${originalEmail.from.name}`);
    } else if (mode === "replyAll") {
      setTo(originalEmail.from.email);
      
      // Populate CC with all CCs and other TO recipients, excluding self
      const allRecipients = [
        ...originalEmail.to.map((t) => t.email),
        ...(originalEmail.cc?.map((c) => c.email) || []),
      ];
      const ccList = allRecipients
        .filter((email) => {
          const lowerEmail = email.toLowerCase();
          const isFrom = lowerEmail === originalEmail.from.email.toLowerCase();
          const isSelf = userEmail ? lowerEmail === userEmail : false;
          return !isFrom && !isSelf;
        })
        .join(", ");
      
      setCc(ccList);
      setSubject(`Re: ${normalizedSubject}`);
      setBodyHtml(
        `<br><br><blockquote style="border-left: 2px solid #ddd; padding-left: 12px; color: #555;">${
          originalEmail.bodyHtml || originalEmail.body
        }</blockquote>`
      );
      setShowCcBcc(!!ccList);
      setTitle(`Reply All to ${originalEmail.from.name}`);
    } else if (mode === "forward") {
      setTo("");
      setSubject(`Fwd: ${normalizedSubject}`);
      const dateStr = new Date(originalEmail.timestamp).toLocaleString();
      const forwardHeader = `
        <br><br>---------- Forwarded message ----------<br>
        From: <b>${originalEmail.from.name}</b> &lt;${originalEmail.from.email}&gt;<br>
        Date: ${dateStr}<br>
        Subject: ${originalEmail.subject}<br>
        To: ${originalEmail.to.map((t) => `${t.name} &lt;${t.email}&gt;`).join(", ")}<br>
        ${originalEmail.cc && originalEmail.cc.length > 0 ? `Cc: ${originalEmail.cc.map((c) => `${c.name} &lt;${c.email}&gt;`).join(", ")}<br>` : ""}
        <br>
        ${originalEmail.bodyHtml || originalEmail.body}
      `;
      setBodyHtml(forwardHeader);
      setTitle(`Forward: ${normalizedSubject}`);
    }
  }, [originalEmail, mode, user]);

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
      
      if (threadId) {
        formData.append("threadId", threadId);
      }

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

      router.push("/dashboard/inbox");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  }, [to, cc, bcc, subject, bodyHtml, attachments, threadId, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading email context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background p-4 sm:p-6">
      {/* Back to Inbox Link */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/inbox")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Inbox
        </Button>
        <span className="text-xs text-muted-foreground font-mono">Compose View</span>
      </div>

      {/* Editor Main Card */}
      <div className="flex flex-col flex-1 bg-card border border-border rounded-lg shadow-sm overflow-hidden min-h-[500px]">
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
          <h2 className="text-base font-semibold">{title}</h2>
        </div>

        {/* Sender details and Recipient fields */}
        <div className="flex flex-col bg-card">
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border">
            <label className="text-sm text-muted-foreground w-16 shrink-0 font-medium">From</label>
            <span className="text-sm text-foreground">
              {user ? `${user.name || "You"} <${user.email}>` : "You <you@email.com>"}
            </span>
          </div>

          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border">
            <label className="text-sm text-muted-foreground w-16 shrink-0 font-medium">To</label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@email.com"
              className="border-0 focus-visible:ring-0 h-8 px-1 py-1 text-sm flex-1 bg-transparent"
            />
            {!showCcBcc && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
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
                  className="border-0 focus-visible:ring-0 h-8 px-1 py-1 text-sm flex-1 bg-transparent"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCcBcc(false)}
                >
                  Hide
                  <ChevronUp className="size-3 ml-1" />
                </Button>
              </div>
              <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border">
                <label className="text-sm text-muted-foreground w-16 shrink-0 font-medium">Bcc</label>
                <Input
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@email.com"
                  className="border-0 focus-visible:ring-0 h-8 px-1 py-1 text-sm flex-1 bg-transparent"
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
              className="border-0 focus-visible:ring-0 h-8 px-1 py-1 text-sm flex-1 bg-transparent"
            />
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          {(!replyToId || (replyToId && bodyHtml)) && (
            <ComposeEditor
              ref={editorRef}
              content={bodyHtml}
              onChange={setBodyHtml}
            />
          )}
        </div>

        {/* Attachments Preview Area */}
        {attachments.length > 0 && (
          <div className="border-t border-border px-5 py-3 space-y-2 max-h-[160px] overflow-y-auto bg-muted/10">
            {attachments.map((att) => {
              const Icon = getFileIcon(att.type);
              return (
                <div
                  key={att.id}
                  className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 border border-border"
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

        {error && (
          <div className="px-5 py-2.5 text-sm text-destructive bg-destructive/10 border-t border-border flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="icon" className="size-6 text-destructive" onClick={() => setError(null)}>
              <X className="size-3" />
            </Button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-1.5 px-4"
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
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-4" />
              Attach File
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
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

        {/* URL Attachment Input Box */}
        {showUrlInput && (
          <div className="flex items-center gap-2 px-5 py-3 border-t border-border bg-muted/20">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/file.pdf"
              className="h-8 text-xs flex-1 bg-background"
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
              className="h-8 text-xs px-3"
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
      </div>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <ComposeContent />
    </Suspense>
  );
}
