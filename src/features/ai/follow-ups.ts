import { translate } from '@/lib/i18n';

const FOLLOW_UP_KEYS = [
  'ai.followup_top_categories',
  'ai.followup_vs_last_month',
  'ai.followup_biggest_expense',
  'ai.followup_budget_status',
  'ai.followup_income_trend',
  'ai.followup_save_money',
  'ai.followup_recurring',
  'ai.followup_weekly',
] as const;

const NUM_SUGGESTIONS = 3;

export function getFollowUps(lastUserMessage: string): string[] {
  const lastLower = lastUserMessage.toLowerCase();
  const candidates = FOLLOW_UP_KEYS
    .map((key) => translate(key as Parameters<typeof translate>[0]))
    .filter((q) => q.length > 0 && !lastLower.includes(q.toLowerCase().slice(0, 15)));

  if (candidates.length === 0) return [];

  // Deterministic shuffle based on message length so follow-ups feel varied
  const seed = lastUserMessage.length % candidates.length;
  const rotated = [...candidates.slice(seed), ...candidates.slice(0, seed)];
  return rotated.slice(0, NUM_SUGGESTIONS);
}
