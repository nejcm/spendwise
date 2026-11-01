export type NotificationSettings = {
  global?: boolean;
  budgetAlerts?: boolean;
  recommendations?: boolean;
  upcomingBills?: boolean;
  upcomingBillsDays?: 1 | 3 | 7;
  /** Recurring rule ids whose bill reminders are off. */
  mutedBillRules?: string[];
  lowBalance?: boolean;
  lowBalanceThresholdCents?: number;
  weeklyDigest?: boolean;
};
