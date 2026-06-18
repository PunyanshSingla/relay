"use client";

import { useState, useEffect } from "react";
import { Zap, Plus, Trash2, Power, PowerOff, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: string;
  triggerValue: string;
  actionType: string;
  actionTarget: string;
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  sender_email: "Sender email",
  sender_domain: "Sender domain",
  subject_contains: "Subject contains",
  category: "AI category",
};

const ACTION_LABELS: Record<string, string> = {
  forward_to: "Forward to",
  auto_reply: "Auto reply",
};

const CATEGORY_OPTIONS = [
  "action_needed",
  "meeting",
  "follow_up",
  "fyi",
  "newsletter",
  "promotion",
  "social",
];

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    triggerType: "sender_email",
    triggerValue: "",
    actionType: "forward_to",
    actionTarget: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/automations/rules");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (!cancelled) {
          setRules(data.rules);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRules([]);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/automations/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRules((prev) => [data.rule, ...prev]);
      setCreateOpen(false);
      setForm({ name: "", triggerType: "sender_email", triggerValue: "", actionType: "forward_to", actionTarget: "" });
      setCreating(false);
    } catch {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
    try {
      await fetch(`/api/automations/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
    } catch {
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !enabled } : r)));
    }
  };

  const handleDelete = async (id: string) => {
    const prev = rules;
    setRules((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch(`/api/automations/rules/${id}`, { method: "DELETE" });
    } catch {
      setRules(prev);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Zap className="size-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Automations</h1>
            <p className="text-xs text-muted-foreground">
              Create rules to automatically act on incoming emails
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-1" />
          Create Rule
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}

        {!loading && rules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Zap className="size-8 mb-3" />
            <p className="text-sm">No automation rules yet.</p>
            <p className="text-xs mt-1">Create a rule to get started.</p>
          </div>
        )}

        {!loading &&
          rules.map((rule) => (
            <Card key={rule.id} className={cn("border-border", !rule.enabled && "opacity-60")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{rule.name}</h3>
                      {!rule.enabled && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When {TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType}{" "}
                      <span className="font-medium text-foreground">{rule.triggerValue}</span>
                      {" "}→ {ACTION_LABELS[rule.actionType] ?? rule.actionType}{" "}
                      <span className="font-medium text-foreground">{rule.actionTarget}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Executed {rule.executionCount} time{rule.executionCount !== 1 ? "s" : ""}
                      {rule.lastExecutedAt && ` · Last: ${new Date(rule.lastExecutedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleToggle(rule.id, !rule.enabled)}
                    >
                      {rule.enabled ? (
                        <Power className="size-3 text-green-500" />
                      ) : (
                        <PowerOff className="size-3 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Automation Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="rule-name" className="text-sm font-medium">Rule Name</label>
              <Input
                id="rule-name"
                placeholder="e.g., Forward support emails"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="trigger-type" className="text-sm font-medium">When this happens</label>
              <Select
                value={form.triggerType}
                onValueChange={(v) => setForm({ ...form, triggerType: v, triggerValue: "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sender_email">Sender email is</SelectItem>
                  <SelectItem value="sender_domain">Sender domain is</SelectItem>
                  <SelectItem value="subject_contains">Subject contains</SelectItem>
                  <SelectItem value="category">AI category is</SelectItem>
                </SelectContent>
              </Select>

              {form.triggerType === "category" ? (
                <Select
                  value={form.triggerValue}
                  onValueChange={(v) => setForm({ ...form, triggerValue: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder={
                    form.triggerType === "sender_email"
                      ? "support@company.com"
                      : form.triggerType === "sender_domain"
                      ? "company.com"
                      : "urgent"
                  }
                  value={form.triggerValue}
                  onChange={(e) => setForm({ ...form, triggerValue: e.target.value })}
                />
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="action-type" className="text-sm font-medium">Then do this</label>
              <Select
                value={form.actionType}
                onValueChange={(v) => setForm({ ...form, actionType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forward_to">Forward to</SelectItem>
                  <SelectItem value="auto_reply">Auto reply</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder={
                  form.actionType === "forward_to"
                    ? "hitesh@gmail.com"
                    : "Thank you for your email. We'll get back to you shortly."
                }
                value={form.actionTarget}
                onChange={(e) => setForm({ ...form, actionTarget: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !form.name || !form.triggerValue || !form.actionTarget}
            >
              {creating && <Loader2 className="size-4 mr-1 animate-spin" />}
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
