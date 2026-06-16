import { z } from "zod";

export interface EmailInput {
  from: string;
  subject: string;
  snippet?: string;
  body?: string;
  labels?: string[];
}

export interface ContactContext {
  name?: string;
  emailCount?: number;
  relationshipStrength?: number;
  lastTopic?: string;
}

export interface BatchEmailInput {
  index: number;
  from: string;
  subject: string;
  snippet?: string;
  contactContext?: ContactContext;
}

export interface ClassifyResult {
  priority: "P1" | "P2" | "P3";
  category:
    | "action_needed"
    | "meeting"
    | "follow_up"
    | "fyi"
    | "newsletter"
    | "promotion"
    | "social";
  reason: string;
  suggestedAction: string;
}

export const classifySchema = z.object({
  priority: z.enum(["P1", "P2", "P3"]),
  category: z.enum([
    "action_needed",
    "meeting",
    "follow_up",
    "fyi",
    "newsletter",
    "promotion",
    "social",
  ]),
  reason: z.string(),
  suggested_action: z.string(),
});

export const batchClassifySchema = z.object({
  classifications: z.array(
    z.object({
      index: z.number(),
      priority: z.enum(["P1", "P2", "P3"]),
      category: z.enum([
        "action_needed",
        "meeting",
        "follow_up",
        "fyi",
        "newsletter",
        "promotion",
        "social",
      ]),
      reason: z.string(),
      suggested_action: z.string(),
    }),
  ),
});

export type BatchClassifyResult = Array<{ index: number; result: ClassifyResult }>;
