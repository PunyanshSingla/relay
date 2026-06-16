import { z } from "zod";

export type ReplyMode = "short" | "professional" | "friendly" | "generate";

export interface ReplyEmailInput {
  from: string;
  subject: string;
  body: string;
  threadReplies: Array<{
    from: string;
    body: string;
  }>;
  category?: string;
}

export const replyGenerateSchema = z.object({
  needsReply: z.boolean(),
  reply: z.string().nullable(),
  reason: z.string(),
});

export type ReplyGenerateResult = z.infer<typeof replyGenerateSchema>;

export interface NeedsReplyResult {
  needsReply: boolean;
  reason: string;
}
