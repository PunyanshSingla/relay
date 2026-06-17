export type EnhanceMode = "none" | "simple" | "clarity" | "draft";

const MODE_PROMPTS: Record<Exclude<EnhanceMode, "none">, string> = {
  simple: (prompt: string) =>
    `Enhance this user prompt to be clearer and more specific for an AI email assistant. Keep it concise. User's original prompt: "${prompt}"`,
  clarity: (prompt: string) =>
    `Improve this prompt for an AI email assistant. Resolve vague references using common sense (e.g., "tomorrow" = next day, "him" = the person mentioned). Only add specificity where the original is genuinely ambiguous. Do NOT ask questions. Return the improved prompt directly. User's prompt: "${prompt}"`,
  draft: (prompt: string) =>
    `The user has given a rough idea for an email. Generate a complete, professional draft based on their idea. Include subject line and body. User's idea: "${prompt}"`,
};

export async function enhancePrompt(
  prompt: string,
  mode: Exclude<EnhanceMode, "none">,
): Promise<string> {
  try {
    const res = await fetch("/api/ai/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "write", prompt: MODE_PROMPTS[mode](prompt) }),
    });
    if (!res.ok) return prompt;
    const data = await res.json();
    return data.result || prompt;
  } catch {
    return prompt;
  }
}
