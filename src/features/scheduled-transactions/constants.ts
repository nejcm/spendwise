import type { OptionType } from '@/components/ui';
import { translate } from '@/lib/i18n';

export const FREQUENCY_OPTIONS = [
  { label: translate('scheduled.frequencyOptions.daily'), value: 'daily' },
  { label: translate('scheduled.frequencyOptions.weekly'), value: 'weekly' },
  { label: translate('scheduled.frequencyOptions.biweekly'), value: 'biweekly' },
  { label: translate('scheduled.frequencyOptions.monthly'), value: 'monthly' },
  { label: translate('scheduled.frequencyOptions.yearly'), value: 'yearly' },
] satisfies OptionType<string>[];
