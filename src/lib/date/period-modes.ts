import type { PeriodMode } from '@/lib/store/store';

export const DYNAMIC_PERIOD_MODES = ['today', 'this-week', 'this-month', 'this-year'] as const satisfies PeriodMode[];

export type DynamicPeriodMode = typeof DYNAMIC_PERIOD_MODES[number];
