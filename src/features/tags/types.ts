export type Tag = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: number;
};

export type TagFormData = {
  name: string;
  color: string;
};
