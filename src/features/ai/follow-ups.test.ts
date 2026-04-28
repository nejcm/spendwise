import { getFollowUps } from './follow-ups';

jest.mock('@/lib/i18n', () => ({
  translate: jest.fn((key: string) => {
    const map: Record<string, string> = {
      'ai.followup_top_categories': 'What are my top spending categories this month?',
      'ai.followup_vs_last_month': 'How do my expenses compare to last month?',
      'ai.followup_biggest_expense': 'What was my biggest single expense this month?',
      'ai.followup_budget_status': 'How am I tracking against my budget?',
      'ai.followup_income_trend': 'How has my income changed over the last 3 months?',
      'ai.followup_save_money': 'What are my best opportunities to save money?',
      'ai.followup_recurring': 'What recurring payments do I have coming up?',
      'ai.followup_weekly': 'Give me a weekly breakdown of my spending.',
    };
    return map[key] ?? '';
  }),
}));

describe('getFollowUps', () => {
  it('returns exactly 3 suggestions', () => {
    const result = getFollowUps('Tell me about my spending');
    expect(result).toHaveLength(3);
  });

  it('returns an array of non-empty strings', () => {
    const result = getFollowUps('overview');
    expect(result.every((q) => q.length > 0)).toBe(true);
  });

  it('filters out a question whose prefix matches the user message', () => {
    const result = getFollowUps('What are my top spending categories this month?');
    expect(result).not.toContain('What are my top spending categories this month?');
  });

  it('returns different orderings for different message lengths', () => {
    const short = getFollowUps('Hi');
    const long = getFollowUps('Give me a detailed breakdown of all my monthly subscriptions please');
    expect(short).not.toEqual(long);
  });

  it('returns [] when all candidates are empty strings (missing locale)', () => {
    const { translate } = jest.requireMock('@/lib/i18n') as { translate: jest.Mock };
    translate.mockReturnValue('');
    const result = getFollowUps('some message');
    expect(result).toEqual([]);
    translate.mockRestore?.();
  });
});
