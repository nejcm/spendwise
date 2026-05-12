import type { Recommendation } from './types';
import type { CurrencyKey } from '@/features/currencies';

import { formatCurrency, formatDate } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';

export type RecommendationCopy = {
  actionLabel: string;
  askAiLabel: string;
  summary: string;
  title: string;
};

function formatRatio(ratio: number | null | undefined) {
  if (!ratio || ratio < 1) return '1.0';
  return ratio.toFixed(1);
}

function formatMoney(amountCents: number | null | undefined, currency: CurrencyKey) {
  return formatCurrency(amountCents ?? 0, currency);
}

export function getPrimaryActionLabel(target: Recommendation['primaryTarget']) {
  switch (target) {
    case 'accounts':
      return translate('recommendations.actions.review_accounts');
    case 'categories':
      return translate('recommendations.actions.review_categories');
    case 'scheduled':
      return translate('recommendations.actions.review_schedule');
    case 'stats':
      return translate('recommendations.actions.review_stats');
    case 'transactions':
    default:
      return translate('recommendations.actions.review_transactions');
  }
}

export function getRecommendationCopy(recommendation: Recommendation, currency: CurrencyKey): RecommendationCopy {
  const recommendationCurrency = recommendation.currency ?? currency;

  switch (recommendation.kind) {
    case 'unusual_spending':
      return {
        title: translate('recommendations.unusual_spending.title'),
        summary: translate('recommendations.unusual_spending.summary', {
          amount: formatMoney(recommendation.amountCents, recommendationCurrency),
          label: recommendation.label ?? recommendation.categoryName ?? translate('transactions.title'),
          multiple: formatRatio(recommendation.ratio),
        }),
        actionLabel: getPrimaryActionLabel(recommendation.primaryTarget),
        askAiLabel: translate('recommendations.actions.ask_ai'),
      };
    case 'upcoming_cashflow':
      return {
        title: translate('recommendations.upcoming_cashflow.title', {
          account: recommendation.accountName ?? translate('accounts.total_balance'),
        }),
        summary: translate('recommendations.upcoming_cashflow.summary', {
          amount: formatMoney(recommendation.amountCents, recommendationCurrency),
          balance: formatMoney(recommendation.comparisonAmountCents, recommendationCurrency),
          count: recommendation.count ?? 0,
          days: recommendation.days ?? 0,
        }),
        actionLabel: getPrimaryActionLabel(recommendation.primaryTarget),
        askAiLabel: translate('recommendations.actions.ask_ai'),
      };
    case 'category_anomaly':
      return {
        title: translate('recommendations.category_anomaly.title', {
          category: recommendation.categoryName ?? translate('common.category'),
        }),
        summary: translate('recommendations.category_anomaly.summary', {
          amount: formatMoney(recommendation.amountCents, currency),
          average: formatMoney(recommendation.comparisonAmountCents, currency),
        }),
        actionLabel: getPrimaryActionLabel(recommendation.primaryTarget),
        askAiLabel: translate('recommendations.actions.ask_ai'),
      };
    case 'subscription_reminder':
      return {
        title: translate('recommendations.subscription_reminder.title', {
          name: recommendation.label ?? recommendation.categoryName ?? translate('scheduled.this_rule'),
        }),
        summary: translate('recommendations.subscription_reminder.summary', {
          amount: formatMoney(recommendation.amountCents, recommendationCurrency),
          date: recommendation.dueDate ? formatDate(recommendation.dueDate) : '-',
          count: recommendation.count ?? 1,
        }),
        actionLabel: getPrimaryActionLabel(recommendation.primaryTarget),
        askAiLabel: translate('recommendations.actions.ask_ai'),
      };
    case 'budget_suggestion':
      return {
        title: translate('recommendations.budget_suggestion.title', {
          category: recommendation.categoryName ?? translate('common.category'),
        }),
        summary: translate('recommendations.budget_suggestion.summary', {
          amount: formatMoney(recommendation.amountCents, currency),
        }),
        actionLabel: getPrimaryActionLabel(recommendation.primaryTarget),
        askAiLabel: translate('recommendations.actions.ask_ai'),
      };
  }
}
