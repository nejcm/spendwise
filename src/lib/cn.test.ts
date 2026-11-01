import fs from 'node:fs';
import path from 'node:path';
import { cn, tv, twMergeConfig } from './cn';

describe('cn', () => {
  it('treats custom text-* tokens as font sizes, not colours', () => {
    expect(cn('text-base text-foreground', 'text-hero')).toBe('text-foreground text-hero');
    expect(cn('text-row text-muted-foreground', 'text-meta')).toBe('text-muted-foreground text-meta');
  });

  it('merges custom radius and tracking tokens', () => {
    expect(cn('rounded-lg', 'rounded-card')).toBe('rounded-card');
    expect(cn('tracking-tight', 'tracking-hero')).toBe('tracking-hero');
  });

  it('applies the same config to tv()', () => {
    const text = tv({ base: 'text-base text-foreground' });
    expect(text({ className: 'text-page-title' })).toBe('text-foreground text-page-title');
  });

  it('registers every custom token defined in global.css', () => {
    const css = fs.readFileSync(path.join(__dirname, '../global.css'), 'utf8');
    const tokens = (prefix: string) =>
      [...css.matchAll(new RegExp(`--${prefix}-([a-z0-9-]+):`, 'g'))]
        .map((m) => m[1])
        .filter((name) => !name.includes('--'));
    const { theme } = twMergeConfig.extend;
    expect(theme.text).toEqual(expect.arrayContaining(tokens('text')));
    expect(theme.radius).toEqual(expect.arrayContaining(tokens('radius')));
    expect(theme.tracking).toEqual(expect.arrayContaining(tokens('tracking')));
  });
});
