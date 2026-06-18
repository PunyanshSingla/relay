interface ScoringInput {
  frequency: number;
  consistency: number;
  recency: number;
  timeSavedPerOccurrence: number; // in minutes
}

export function calculateConfidence(input: ScoringInput): number {
  const {
    frequency,
    consistency,
    recency,
    timeSavedPerOccurrence,
  } = input;

  // Frequency score: logarithmic scale, 100 at ~50 occurrences
  const frequencyScore = Math.min(100, 20 * Math.log(frequency + 1));

  // Consistency: 0-1 scale, already provided
  const consistencyScore = consistency * 100;

  // Recency: 0-1 scale, already provided
  const recencyScore = recency * 100;

  // Time saved: 100 at ~5 hours/month (30 mins/week)
  const timeSavedScore = Math.min(100, (timeSavedPerOccurrence * frequency * 4) / 30 * 100);

  const confidence =
    frequencyScore * 0.3 +
    consistencyScore * 0.3 +
    recencyScore * 0.2 +
    timeSavedScore * 0.2;

  return Math.round(Math.min(100, Math.max(0, confidence)));
}

export function calculateConsistency(actionCounts: number[], totalCount: number): number {
  if (totalCount === 0) return 0;
  const maxCount = Math.max(...actionCounts);
  return maxCount / totalCount;
}

export function calculateRecency(timestamps: Date[]): number {
  if (timestamps.length === 0) return 0;
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * oneDay;

  // Average age of actions
  const avgAge = timestamps.reduce((sum, ts) => sum + (now - ts.getTime()), 0) / timestamps.length;

  // Score: 1.0 if all actions today, decays over 30 days
  return Math.max(0, 1 - avgAge / thirtyDays);
}

export function estimateTimeSavedPerOccurrence(actionType: string): number {
  const estimates: Record<string, number> = {
    star_email: 0.1,
    archive_email: 0.2,
    trash_email: 0.2,
    send_email: 5.0,
    forward_email: 2.0,
    ai_reply: 3.0,
    create_event: 3.0,
    accept_invite: 1.0,
    decline_invite: 0.5,
    create_task: 2.0,
    complete_task: 0.5,
    dismiss_followup: 0.5,
    mark_important: 0.1,
  };
  return estimates[actionType] ?? 1.0;
}
