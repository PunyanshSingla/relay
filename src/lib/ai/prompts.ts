export function buildSingleClassifyPrompt(
  email: {
    from: string;
    subject: string;
    snippet?: string;
    body?: string;
    labels?: string[];
  },
  contactContext?: {
    name?: string;
    emailCount?: number;
    relationshipStrength?: number;
    lastTopic?: string;
  },
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
  emails: Array<{
    index: number;
    from: string;
    subject: string;
    snippet?: string;
    contactContext?: {
      name?: string;
      emailCount?: number;
      relationshipStrength?: number;
      lastTopic?: string;
    };
  }>,
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
