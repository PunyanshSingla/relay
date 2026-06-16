import type { EmailInput, ContactContext, BatchEmailInput } from "./classifier.types";

export function buildSingleClassifyPrompt(
  email: EmailInput,
  contactContext?: ContactContext,
): string {
  let prompt = `Analyze this email and classify it.

FROM: ${email.from}
SUBJECT: ${email.subject}
`;

  if (email.snippet) {
    prompt += `SNIPPET: ${email.snippet}\n`;
  }

  if (email.body) {
    const body = email.body.slice(0, 2000);
    prompt += `BODY: ${body}\n`;
  }

  if (email.labels?.length) {
    prompt += `GMAIL LABELS: ${email.labels.join(", ")}\n`;
  }

  if (contactContext?.name) {
    prompt += `\nCONTACT INFO:\nName: ${contactContext.name}\n`;
    if (contactContext.emailCount !== undefined) {
      prompt += `Times contacted: ${contactContext.emailCount}\n`;
    }
    if (contactContext.relationshipStrength !== undefined) {
      prompt += `Relationship strength: ${contactContext.relationshipStrength}\n`;
    }
    if (contactContext.lastTopic) {
      prompt += `Last topic: ${contactContext.lastTopic}\n`;
    }
  }

  prompt += `
Return a JSON object with exactly these fields:
- priority: "P1" (urgent/critical), "P2" (important), or "P3" (low priority)
- category: one of "action_needed", "meeting", "follow_up", "fyi", "newsletter", "promotion", "social"
- reason: a brief 1-sentence explanation of why this classification
- suggested_action: a short suggestion for what the user should do`;

  return prompt;
}

export function buildBatchClassifyPrompt(
  emails: BatchEmailInput[],
): string {
  let prompt = `Classify all ${emails.length} emails below. Return a JSON object with a "classifications" array.

`;
  for (const email of emails) {
    prompt += `\nEMAIL #${email.index}:\nFROM: ${email.from}\nSUBJECT: ${email.subject}\n`;
    if (email.snippet) {
      prompt += `SNIPPET: ${email.snippet}\n`;
    }
    if (email.contactContext?.name) {
      prompt += `CONTACT: ${email.contactContext.name}`;
      if (email.contactContext.emailCount !== undefined) {
        prompt += ` (${email.contactContext.emailCount} prior emails)`;
      }
      if (email.contactContext.relationshipStrength !== undefined) {
        prompt += `, relationship: ${email.contactContext.relationshipStrength}`;
      }
      prompt += `\n`;
    }
  }

  prompt += `\nEach classification in the array must have: index, priority (P1/P2/P3), category (action_needed/meeting/follow_up/fyi/newsletter/promotion/social), reason, and suggested_action.`;

  return prompt;
}

// ──────────────────────────────────────────────
// Compose prompts
// ──────────────────────────────────────────────

export function buildSuggestPrompt(text: string, ctxBlock: string): string {
  return `You are an email writing assistant. The user is composing an email.
${ctxBlock}

Current email text:
"""
${text}
"""

Complete what the user is likely trying to say next. Continue naturally from where the text ends.
Rules:
- Return ONLY the continuation text, nothing else
- Do NOT repeat any text the user already wrote
- Keep the same tone and style
- Be concise — suggest 1-3 sentences max
- If the text looks complete, suggest a natural closing line
- Do NOT include greetings or sign-offs unless the text is clearly leading to one`;
}

export function buildFixSpellingPrompt(text: string): string {
  return `You are a grammar and spelling checker. Fix all spelling mistakes, grammar errors, and punctuation issues in the following email text.

Rules:
- Fix ONLY spelling, grammar, and punctuation
- Do NOT change the meaning, tone, or content
- Do NOT add or remove any sentences
- Do NOT add explanations — return only the corrected text
- If the text is already correct, return it unchanged

Text:
"""
${text}
"""`;
}

export function buildImprovePrompt(
  text: string,
  ctxBlock: string,
  customPrompt?: string,
): string {
  const instruction = customPrompt
    ? `The user wants: ${customPrompt}\nImprove the writing accordingly while following the rules below.`
    : "Improve the writing quality of this email.";

  const rules = customPrompt
    ? `- Apply the user's requested changes
- Fix any grammar/spelling issues
- Keep the core message intact
- Return ONLY the improved text, no explanations`
    : `- Improve clarity, flow, and readability
- Fix any awkward phrasing
- Keep the original meaning and tone
- Do NOT add new content or change the message
- Return ONLY the improved text, no explanations`;

  return `You are a professional email editor. ${instruction}
${ctxBlock}

Email text:
"""
${text}
"""

Rules:
${rules}`;
}

export function buildWritePrompt(
  text: string,
  ctxBlock: string,
  customPrompt?: string,
): string {
  const instruction = customPrompt
    ? `The user wants: ${customPrompt}`
    : "Write a professional email based on the context below.";

  const textSection = text.trim()
    ? `\nExisting draft:\n"""\n${text}\n"""\n\nRewrite or extend this draft according to the user's request.`
    : "\nWrite the email from scratch.";

  return `You are a professional email writer. ${instruction}
${ctxBlock}
${textSection}

Rules:
- Write clear, professional email content
- Use the subject line and recipient context to inform the tone and content
- If a draft exists, rewrite it according to the user's request
- If no draft exists, generate a complete email body
- Return ONLY the email text, no subject line, no explanations`;
}

export function buildChangeTonePrompt(
  text: string,
  tone: string,
  ctxBlock: string,
): string {
  const toneDescriptions: Record<string, string> = {
    formal: "professional, business-appropriate, respectful",
    casual: "relaxed, informal, conversational",
    friendly: "warm, approachable, personable",
  };

  return `Rewrite this email in a ${toneDescriptions[tone] ?? tone} tone.
${ctxBlock}

Email text:
"""
${text}
"""

Rules:
- Change ONLY the tone — keep the same message and content
- Do NOT add or remove information
- Return ONLY the rewritten text, no explanations`;
}

export function buildShortenPrompt(text: string, ctxBlock: string): string {
  return `Condense this email to be shorter and more direct while keeping the key message.
${ctxBlock}

Email text:
"""
${text}
"""

Rules:
- Keep all essential information
- Remove filler words and redundancy
- Be concise but still polite
- Return ONLY the shortened text, no explanations`;
}

export function buildExpandPrompt(text: string, ctxBlock: string): string {
  return `Expand this email with more detail, context, or polite elaboration.
${ctxBlock}

Email text:
"""
${text}
"""

Rules:
- Add relevant details or context
- Maintain the original tone
- Do NOT change the core message
- Return ONLY the expanded text, no explanations`;
}

// ──────────────────────────────────────────────
// Spell check prompts
// ──────────────────────────────────────────────

export function buildSpellCheckPrompt(text: string): string {
  return `You are a spelling and grammar checker. Analyze the following text and return ALL spelling mistakes, grammar errors, and punctuation issues.

Rules:
- Find EVERY error, no matter how small
- For each error, provide the exact character offset and length in the original text
- The offset is 0-based (first character is offset 0)
- The length is the number of characters of the erroneous text
- Provide a clear message describing the error
- Provide the corrected text for that specific span
- If the text has no errors, return an empty errors array
- Do NOT suggest stylistic changes — only fix actual errors (misspellings, wrong grammar, missing punctuation)

Text:
"""
${text}
"""`;
}

export function buildSpellRankPrompt(
  sentence: string,
  misspellingList: string,
): string {
  return `You are a spell checker with context awareness. Given a sentence and misspelled words with their dictionary suggestions, determine which suggestion best fits the sentence context.

Sentence:
"""
${sentence}
"""

Misspelled words:
${misspellingList}

For each misspelled word:
1. Look at the sentence context to understand the meaning
2. Pick the suggestion that best fits the context
3. If none of the suggestions fit well, suggest a better word
4. Provide a brief reason for your choice
5. List alternative suggestions that could also work

Return the fixes as a JSON array.`;
}

// ──────────────────────────────────────────────
// Reply generation prompts
// ──────────────────────────────────────────────

import type { ReplyEmailInput, ReplyMode } from "./reply-generator.types";

export function buildReplyPrompt(email: ReplyEmailInput, mode: ReplyMode): string {
  const modeInstructions: Record<ReplyMode, string> = {
    short: "Write a short, concise reply (1-2 sentences). Just acknowledge or answer directly.",
    professional: "Write a formal, professional reply. Use proper business structure with greeting, body, and sign-off.",
    friendly: "Write a warm, conversational reply. Be approachable and personable while staying on-topic.",
    generate: "Write the best reply given the context. Match the tone of the original email.",
  };

  let prompt = `You are an email reply assistant. Generate a reply to the following email.

FROM: ${email.from}
SUBJECT: ${email.subject}
${email.category ? `CATEGORY: ${email.category}` : ""}

EMAIL BODY:
"""
${email.body.slice(0, 3000)}
"""
`;

  if (email.threadReplies.length > 0) {
    prompt += `\nTHREAD HISTORY (previous replies in this conversation):\n`;
    for (const reply of email.threadReplies.slice(-5)) {
      prompt += `\nFrom: ${reply.from}\n${reply.body.slice(0, 1000)}\n`;
    }
  }

  prompt += `
TASK: Determine if this email needs a reply, and if so, generate one.

RULES:
- Set needsReply to false for: OTP/verification codes, automated notifications, newsletters, promotional emails, system alerts, no-reply senders, or emails that are purely informational with no action expected
- Set needsReply to true for: any email from a real person expecting a response, questions, meeting requests, work discussions, requests for information, or anything requiring acknowledgement
- If needsReply is false, set reply to null
- If needsReply is true, generate the reply text
- Reply should NOT include subject line, just the email body text
- Reply should NOT include the sender's greeting (e.g., don't start with "Hi [name],")
- Reply should be ready to send as-is

MODE INSTRUCTIONS: ${modeInstructions[mode]}

Return a JSON object with: needsReply (boolean), reply (string or null), reason (brief explanation).`;

  return prompt;
}
