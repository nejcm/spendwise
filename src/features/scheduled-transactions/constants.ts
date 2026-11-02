import type { ScheduledTransactionFrequency, ScheduledTransactionType } from './types';
import type { OptionType } from '@/components/ui';
import { translate } from '@/lib/i18n';

export const FREQUENCY_OPTIONS = [
  { label: translate('scheduled.frequencyOptions.daily'), value: 'daily' },
  { label: translate('scheduled.frequencyOptions.weekly'), value: 'weekly' },
  { label: translate('scheduled.frequencyOptions.biweekly'), value: 'biweekly' },
  { label: translate('scheduled.frequencyOptions.monthly'), value: 'monthly' },
  { label: translate('scheduled.frequencyOptions.yearly'), value: 'yearly' },
] satisfies OptionType<string>[];

export type RecurringTemplate = {
  key: 'rent' | 'salary' | 'streaming' | 'gym' | 'phone' | 'insurance';
  icon: string;
  color: string;
  type: ScheduledTransactionType;
  frequency: ScheduledTransactionFrequency;
  /** Cents in Preferred Currency. */
  amount?: number;
  startsOnFirst?: boolean;
  /** Lowercase name fragments (en + de) tried in order against categories of the same kind. */
  categoryHints: string[];
};

export const RECURRING_TEMPLATES: RecurringTemplate[] = [
  { key: 'rent', icon: '🏠', color: '#5b8def', type: 'expense', frequency: 'monthly', startsOnFirst: true, categoryHints: ['rent', 'miete', 'housing', 'wohnen'] },
  { key: 'salary', icon: '💼', color: '#3fb27f', type: 'income', frequency: 'monthly', categoryHints: ['salary', 'gehalt', 'lohn'] },
  { key: 'streaming', icon: '🎬', color: '#5aa8b5', type: 'expense', frequency: 'monthly', amount: 1399, categoryHints: ['subscription', 'abo', 'entertainment', 'unterhaltung'] },
  { key: 'gym', icon: '🏋️', color: '#e86aa0', type: 'expense', frequency: 'monthly', categoryHints: ['gym', 'fitness', 'sport', 'health', 'gesundheit'] },
  { key: 'phone', icon: '📱', color: '#4cb3d4', type: 'expense', frequency: 'monthly', categoryHints: ['phone', 'telefon', 'handy', 'utilities', 'nebenkosten'] },
  { key: 'insurance', icon: '🛡️', color: '#e0a526', type: 'expense', frequency: 'yearly', categoryHints: ['insurance', 'versicherung'] },
];
