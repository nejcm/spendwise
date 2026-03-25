export type NotificationSettings = {
  global?: boolean;
  budgetAlerts?: boolean;
  upcomingBills?: boolean;
  upcomingBillsDays?: 1 | 3 | 7;
  lowBalance?: boolean;
  lowBalanceThresholdCents?: number;
  weeklyDigest?: boolean;
};
