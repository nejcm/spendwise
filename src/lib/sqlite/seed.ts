import type { SQLiteDatabase } from 'expo-sqlite';

export async function seedDefaults(db: SQLiteDatabase): Promise<void> {
  // clear existing categories
  await db.execAsync('DELETE FROM categories');

  const expenseCategories = [
    {
      id: 'cat_food',
      name: 'Food & Dining',
      icon: '🍽️',
      color: '#FF6B6B',
    },
    {
      id: 'cat_transport',
      name: 'Transportation',
      icon: '🚗',
      color: '#4ECDC4',
    },
    { id: 'cat_housing', name: 'Housing', icon: '🏠', color: '#45B7D1' },
    { id: 'cat_utilities', name: 'Utilities', icon: '💡', color: '#96CEB4' },
    {
      id: 'cat_entertainment',
      name: 'Entertainment',
      icon: '🎬',
      color: '#FFEAA7',
    },
    {
      id: 'cat_shopping',
      name: 'Shopping',
      icon: '🛒',
      color: '#DDA0DD',
    },
    {
      id: 'cat_healthcare',
      name: 'Healthcare',
      icon: '🩺',
      color: '#FF8A80',
    },
    { id: 'cat_education', name: 'Education', icon: '🎓', color: '#82B1FF' },
    {
      id: 'cat_personal',
      name: 'Personal Care',
      icon: '🧴',
      color: '#EA80FC',
    },
    {
      id: 'cat_subscriptions',
      name: 'Subscriptions',
      icon: '🔁',
      color: '#B388FF',
    },
    {
      id: 'cat_other_expense',
      name: 'Other',
      icon: '📦',
      color: '#90A4AE',
    },
    {
      id: '_unknown',
      name: 'Unknown',
      icon: '?',
      color: '#333333',
    },
  ];

  const incomeCategories = [
    { id: 'cat_salary', name: 'Salary', icon: '💼', color: '#66BB6A',
    },
    {
      id: 'cat_freelance',
      name: 'Freelance',
      icon: '💻',
      color: '#26A69A',
    },
    {
      id: 'cat_investment',
      name: 'Investment',
      icon: '📈',
      color: '#42A5F5',
    },
    {
      id: 'cat_other_income',
      name: 'Other Income',
      icon: '💰',
      color: '#78909C',
    },
  ];

  for (const cat of expenseCategories) {
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)',
      [cat.id, cat.name, cat.icon, cat.color, expenseCategories.indexOf(cat)],
    );
  }

  for (const cat of incomeCategories) {
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)',
      [cat.id, cat.name, cat.icon, cat.color, incomeCategories.indexOf(cat)],
    );
  }
}
