import type { PeriodSelection } from '@/lib/store';
import { endOfISOWeek, format, setISOWeek, startOfISOWeek, startOfYear } from 'date-fns';
import { translate } from '../i18n';

export function getPeriodLabel(selection: PeriodSelection): string {
  switch (selection.mode) {
    case 'year':
      return String(selection.year);
    case 'month': {
      const d = new Date(selection.year, selection.month - 1, 1);
      return format(d, 'MMMM yyyy');
    }
    case 'week': {
      const weekStart = startOfISOWeek(setISOWeek(startOfYear(new Date(selection.year, 0, 4)), selection.week));
      const weekEnd = endOfISOWeek(weekStart);
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`;
    }
    case 'custom': {
      const start = new Date(selection.startDate);
      const end = new Date(selection.endDate);
      if (start.getFullYear() === end.getFullYear()) {
        return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
      }
      return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
    }
    case 'all':
      return translate('common.all-time');
    default:
      return translate(`common.${selection.mode}`);
  }
}
