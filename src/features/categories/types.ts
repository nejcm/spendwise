export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  sort_order: number;
  created_at: string;
}

export type CategoryFormData = {
  name: string;
  icon: string | null;
  color: string;
  sort_order?: number | null;
};
