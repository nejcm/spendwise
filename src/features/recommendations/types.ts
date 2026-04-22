import type { CurrencyKey } from '@/features/currencies';

export type RecommendationKind
  = | 'unusual_spending'
    | 'upcoming_cashflow'
    | 'category_anomaly'
    | 'subscription_reminder'
    | 'budget_suggestion';

export type RecommendationSeverity
  = | 'high'
    | 'medium'
    | 'low';

export type RecommendationActionTarget
  = | 'transactions'
    | 'scheduled'
    | 'accounts'
    | 'categories'
    | 'stats';

export type Recommendation = {
  id: string;
  kind: RecommendationKind;
  severity: RecommendationSeverity;
  primaryTarget: RecommendationActionTarget;
  question: string;
  categoryId?: string | null;
  categoryName?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  label?: string | null;
  amountCents?: number | null;
  comparisonAmountCents?: number | null;
  currency?: CurrencyKey | null;
  dueDate?: number | null;
  count?: number | null;
  days?: number | null;
  ratio?: number | null;
};
