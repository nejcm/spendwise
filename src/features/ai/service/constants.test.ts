import { buildSystemPrompt } from './constants';

describe('buildSystemPrompt', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses the local date, not the UTC one, and the focus period as default range', () => {
    // 20:00 in Los Angeles (jest TZ) is already the next day in UTC.
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 31, 20, 0));

    const prompt = buildSystemPrompt({ mode: 'this-month' }, false);

    expect(prompt).toContain('Today\'s date is 2026-10-31.');
    expect(prompt).toContain('focus period is 2026-10-01 (inclusive) to 2026-11-01 (exclusive)');
    expect(prompt).toContain('all of the user\'s active accounts');
  });

  it('has no focus range for all time and says when accounts are limited', () => {
    const prompt = buildSystemPrompt({ mode: 'all' }, true);

    expect(prompt).toContain('no focus period');
    expect(prompt).toContain('limited tool data to some of their accounts');
  });
});
