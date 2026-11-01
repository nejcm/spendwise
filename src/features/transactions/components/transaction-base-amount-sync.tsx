import type { CurrencyKey } from '@/features/currencies';

import * as React from 'react';

import { computeBaseAmount } from '@/features/currencies/conversion';
import { useRatesForDate } from '@/features/currencies/hooks';
import { amountToCents, formatMajorUnitsInputFromCents } from '@/features/formatting/helpers';
import { dateToUnix } from '@/lib/date/helpers';
import { toNumber } from '@/lib/number';
import { useAppStore } from '@/lib/store/store';

type FormLike = { setFieldValue: (name: 'baseAmount', value: string, opts: { dontUpdateMeta: boolean }) => void };
// A derived value must not mark the form touched, or late defaults (accounts, categories) stop applying.
const DERIVED = { dontUpdateMeta: true };

export function TransactionBaseAmountSync({
  form,
  amount,
  currency,
  date,
  baseAmountIsManual,
  onDriversChanged,
}: {
  form: FormLike;
  amount: string;
  currency: CurrencyKey;
  date: string;
  baseAmountIsManual: boolean;
  onDriversChanged: () => void;
}) {
  const preferredCurrency = useAppStore((s) => s.currency);
  const prevDriversRef = React.useRef({ amount, currency, date });
  const applyAutoAfterDriverChangeRef = React.useRef(false);

  const dateUnix = React.useMemo(() => dateToUnix(date), [date]);

  const { data: rates } = useRatesForDate(Number.isFinite(dateUnix) ? dateUnix : null);

  React.useEffect(() => {
    const prev = prevDriversRef.current;
    const driversChanged
      = prev.amount !== amount || prev.currency !== currency || prev.date !== date;
    if (driversChanged) {
      applyAutoAfterDriverChangeRef.current = true;
      onDriversChanged();
      prevDriversRef.current = { amount, currency, date };
    }

    const useAutoBase = !baseAmountIsManual || applyAutoAfterDriverChangeRef.current;
    applyAutoAfterDriverChangeRef.current = false;
    if (!useAutoBase) return;

    const amountNum = toNumber(amount);
    if (!amountNum) {
      form.setFieldValue('baseAmount', '', DERIVED);
      return;
    }

    if (!rates) return;

    const amountCents = amountToCents(Math.abs(amountNum));
    const baseCents = computeBaseAmount(amountCents, currency, preferredCurrency, rates);
    form.setFieldValue('baseAmount', formatMajorUnitsInputFromCents(baseCents), DERIVED);
  }, [amount, currency, date, rates, preferredCurrency, form, baseAmountIsManual, onDriversChanged]);

  return null;
}
