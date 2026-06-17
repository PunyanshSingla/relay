export type ActionType =
  | "send_email"
  | "star_email"
  | "archive_email"
  | "trash_email"
  | "ai_reply"
  | "dismiss_followup";

export type AutomationStatus = "suggested" | "accepted" | "dismissed";

export interface AutomationRule {
  id: string;
  actionType: ActionType;
  target: string;
  description: string;
  count: number;
  status: AutomationStatus;
  suppressedUntil: Date | null;
  createdAt: Date;
}

export const ACTION_LABELS: Record<ActionType, string> = {
  send_email: "Send email to",
  star_email: "Star emails from",
  archive_email: "Archive emails from",
  trash_email: "Delete emails from",
  ai_reply: "AI reply mode",
  dismiss_followup: "Dismiss follow-up from",
};
