export type Priority = "P1" | "P2" | "P3";

export type Category =
  | "action_needed"
  | "meeting"
  | "follow_up"
  | "fyi"
  | "newsletter"
  | "promotion"
  | "social";

export interface EmailAddress {
  name: string;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface EmailReply {
  id: string;
  from: EmailAddress;
  body: string;
  bodyHtml?: string;
  timestamp: Date;
}

export interface Email {
  id: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  subject: string;
  preview: string;
  body: string;
  bodyHtml?: string;
  timestamp: Date;
  read: boolean;
  starred: boolean;
  priority: Priority;
  category: Category;
  labels: string[];
  hasAttachment: boolean;
  attachments: EmailAttachment[];
  threadId: string;
  replies: EmailReply[];
}

export interface FilterOption {
  id: "all" | "unread" | "P1" | "P2" | "P3";
  label: string;
  count: number;
}
