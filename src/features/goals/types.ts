export type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string | null;
  color: string;
  is_completed: number;
  created_at: string;
  updated_at: string;
};

export type GoalFormData = {
  name: string;
  target_amount: string;
  deadline: string;
  color: string;
};

export const GOAL_COLORS = [
  '#4ECDC4',
  '#45B7D1',
  '#66BB6A',
  '#FF6B6B',
  '#FFEAA7',
  '#B388FF',
  '#FF8A80',
  '#82B1FF',
];
