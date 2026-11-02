export type BudgetState = 'none' | 'normal' | 'warning' | 'over';

const WARNING_RATIO = 0.9;

export function getBudgetState(spent: number, budget: number | null | undefined): BudgetState {
  if (!budget || budget <= 0) return 'none';
  if (spent > budget) return 'over';
  if (spent < budget && spent / budget >= WARNING_RATIO) return 'warning';
  return 'normal';
}

export const BUDGET_STATE_CLASSES: Record<BudgetState, { bar: string; text: string }> = {
  none: { bar: 'bg-accent', text: 'text-foreground' },
  normal: { bar: 'bg-accent', text: 'text-foreground' },
  warning: { bar: 'bg-warning-500 dark:bg-warning-400', text: 'text-warning-700 dark:text-warning-400' },
  over: { bar: 'bg-negative', text: 'text-negative' },
};
