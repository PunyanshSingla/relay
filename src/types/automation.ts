export type ActionType =
  | "send_email"
  | "forward_email"
  | "star_email"
  | "unstar_email"
  | "archive_email"
  | "trash_email"
  | "mark_important"
  | "open_email"
  | "ai_reply"
  | "ai_reply_accepted"
  | "ai_reply_edited"
  | "create_event"
  | "update_event"
  | "accept_invite"
  | "decline_invite"
  | "create_task"
  | "complete_task"
  | "add_contact"
  | "mute_thread"
  | "apply_label"
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
  forward_email: "Forward email to",
  star_email: "Star emails from",
  unstar_email: "Unstar emails from",
  archive_email: "Archive emails from",
  trash_email: "Delete emails from",
  mark_important: "Mark as important",
  open_email: "Open email",
  ai_reply: "AI reply mode",
  ai_reply_accepted: "AI reply accepted",
  ai_reply_edited: "AI reply edited",
  create_event: "Create calendar event",
  update_event: "Update calendar event",
  accept_invite: "Accept meeting invite",
  decline_invite: "Decline meeting invite",
  create_task: "Create task",
  complete_task: "Complete task",
  add_contact: "Add contact",
  mute_thread: "Mute thread",
  apply_label: "Apply label",
  dismiss_followup: "Dismiss follow-up from",
};
