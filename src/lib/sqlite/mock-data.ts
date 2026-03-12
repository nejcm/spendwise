// Mock data for the development environment
import { format, subDays } from 'date-fns';

import { db } from '@/lib/drizzle/db';
import { accounts, budgetLines, budgets, goals, recurringRules, transactions } from '@/lib/drizzle/schema';

function daysAgo(n: number): string {
  return format(subDays(new Date(), n), 'yyyy-MM-dd');
}

export async function mockData(): Promise<void> {
  // Clear all tables in FK-safe order
  await db.delete(transactions);
  await db.delete(budgetLines);
  await db.delete(budgets);
  await db.delete(goals);
  await db.delete(recurringRules);
  await db.delete(accounts);

  // Basic accounts
  await db.insert(accounts).values([
    { id: 'acc_cash_wallet', name: 'Cash Wallet', type: 'cash', currency: 'EUR' },
    { id: 'acc_main_checking', name: 'Main Checking', type: 'checking', currency: 'EUR' },
    { id: 'acc_savings', name: 'Emergency Savings', type: 'savings', currency: 'EUR' },
  ]);

  // Sample transactions (amounts are in cents)
  await db.insert(transactions).values([
    // Income
    { id: 'tx_salary_001', accountId: 'acc_main_checking', categoryId: 'cat_salary', type: 'income', amount: 320000, currency: 'EUR', date: daysAgo(15), note: 'Monthly salary' },
    { id: 'tx_freelance_001', accountId: 'acc_main_checking', categoryId: 'cat_freelance', type: 'income', amount: 65000, currency: 'EUR', date: daysAgo(10), note: 'Freelance project' },
    { id: 'tx_salary_002', accountId: 'acc_main_checking', categoryId: 'cat_salary', type: 'income', amount: 320000, currency: 'EUR', date: daysAgo(45), note: 'Monthly salary' },
    { id: 'tx_freelance_002', accountId: 'acc_main_checking', categoryId: 'cat_freelance', type: 'income', amount: 42000, currency: 'EUR', date: daysAgo(33), note: 'Freelance: website fixes' },
    { id: 'tx_freelance_003', accountId: 'acc_main_checking', categoryId: 'cat_freelance', type: 'income', amount: 90000, currency: 'EUR', date: daysAgo(21), note: 'Freelance: mobile app feature' },
    // Food & dining
    { id: 'tx_food_001', accountId: 'acc_cash_wallet', categoryId: 'cat_food', type: 'expense', amount: 8500, currency: 'EUR', date: daysAgo(0), note: 'Lunch with friends' },
    { id: 'tx_food_002', accountId: 'acc_cash_wallet', categoryId: 'cat_food', type: 'expense', amount: 6000, currency: 'EUR', date: daysAgo(9), note: 'Lunch with friends' },
    { id: 'tx_food_003', accountId: 'acc_cash_wallet', categoryId: 'cat_food', type: 'expense', amount: 23000, currency: 'EUR', date: daysAgo(3), note: 'Groceries' },
    { id: 'tx_food_004', accountId: 'acc_cash_wallet', categoryId: 'cat_food', type: 'expense', amount: 12000, currency: 'EUR', date: daysAgo(0), note: 'Groceries' },
    { id: 'tx_food_005', accountId: 'acc_main_checking', categoryId: 'cat_food', type: 'expense', amount: 5690, currency: 'EUR', date: daysAgo(2), note: 'Supermarket' },
    { id: 'tx_food_006', accountId: 'acc_main_checking', categoryId: 'cat_food', type: 'expense', amount: 1890, currency: 'EUR', date: daysAgo(4), note: 'Coffee & pastry' },
    { id: 'tx_food_007', accountId: 'acc_cash_wallet', categoryId: 'cat_food', type: 'expense', amount: 950, currency: 'EUR', date: daysAgo(5), note: 'Lunch' },
    { id: 'tx_food_008', accountId: 'acc_main_checking', categoryId: 'cat_food', type: 'expense', amount: 7420, currency: 'EUR', date: daysAgo(11), note: 'Groceries' },
    { id: 'tx_food_009', accountId: 'acc_cash_wallet', categoryId: 'cat_food', type: 'expense', amount: 430, currency: 'EUR', date: daysAgo(13), note: 'Snack' },
    { id: 'tx_food_010', accountId: 'acc_main_checking', categoryId: 'cat_food', type: 'expense', amount: 3250, currency: 'EUR', date: daysAgo(18), note: 'Dinner' },
    { id: 'tx_food_011', accountId: 'acc_main_checking', categoryId: 'cat_food', type: 'expense', amount: 6120, currency: 'EUR', date: daysAgo(24), note: 'Groceries' },
    { id: 'tx_food_012', accountId: 'acc_cash_wallet', categoryId: 'cat_food', type: 'expense', amount: 1290, currency: 'EUR', date: daysAgo(28), note: 'Lunch' },
    { id: 'tx_food_013', accountId: 'acc_main_checking', categoryId: 'cat_food', type: 'expense', amount: 860, currency: 'EUR', date: daysAgo(36), note: 'Coffee' },
    { id: 'tx_food_014', accountId: 'acc_main_checking', categoryId: 'cat_food', type: 'expense', amount: 15450, currency: 'EUR', date: daysAgo(41), note: 'Big grocery run' },
    // Transportation
    { id: 'tx_transport_001', accountId: 'acc_main_checking', categoryId: 'cat_transport', type: 'expense', amount: 2500, currency: 'EUR', date: daysAgo(8), note: 'Monthly bus pass' },
    { id: 'tx_transport_002', accountId: 'acc_main_checking', categoryId: 'cat_transport', type: 'expense', amount: 189, currency: 'EUR', date: daysAgo(1), note: 'Bus ticket' },
    { id: 'tx_transport_003', accountId: 'acc_cash_wallet', categoryId: 'cat_transport', type: 'expense', amount: 650, currency: 'EUR', date: daysAgo(6), note: 'Taxi share' },
    { id: 'tx_transport_004', accountId: 'acc_main_checking', categoryId: 'cat_transport', type: 'expense', amount: 4800, currency: 'EUR', date: daysAgo(20), note: 'Train tickets' },
    { id: 'tx_transport_005', accountId: 'acc_main_checking', categoryId: 'cat_transport', type: 'expense', amount: 2500, currency: 'EUR', date: daysAgo(38), note: 'Monthly bus pass' },
    { id: 'tx_transport_006', accountId: 'acc_main_checking', categoryId: 'cat_transport', type: 'expense', amount: 1200, currency: 'EUR', date: daysAgo(26), note: 'Fuel' },
    // Housing & utilities
    { id: 'tx_rent_001', accountId: 'acc_main_checking', categoryId: 'cat_housing', type: 'expense', amount: 800000, currency: 'EUR', date: daysAgo(14), note: 'Rent' },
    { id: 'tx_utilities_001', accountId: 'acc_main_checking', categoryId: 'cat_utilities', type: 'expense', amount: 9500, currency: 'EUR', date: daysAgo(12), note: 'Electricity & water' },
    { id: 'tx_rent_002', accountId: 'acc_main_checking', categoryId: 'cat_housing', type: 'expense', amount: 800000, currency: 'EUR', date: daysAgo(44), note: 'Rent' },
    { id: 'tx_utilities_002', accountId: 'acc_main_checking', categoryId: 'cat_utilities', type: 'expense', amount: 7800, currency: 'EUR', date: daysAgo(40), note: 'Internet' },
    { id: 'tx_utilities_003', accountId: 'acc_main_checking', categoryId: 'cat_utilities', type: 'expense', amount: 11200, currency: 'EUR', date: daysAgo(22), note: 'Gas' },
    { id: 'tx_utilities_004', accountId: 'acc_main_checking', categoryId: 'cat_utilities', type: 'expense', amount: 4500, currency: 'EUR', date: daysAgo(16), note: 'Phone plan' },
    // Entertainment & subscriptions
    { id: 'tx_entertainment_001', accountId: 'acc_main_checking', categoryId: 'cat_entertainment', type: 'expense', amount: 1299, currency: 'EUR', date: daysAgo(6), note: 'Streaming service' },
    { id: 'tx_shopping_001', accountId: 'acc_main_checking', categoryId: 'cat_shopping', type: 'expense', amount: 3499, currency: 'EUR', date: daysAgo(5), note: 'Online shopping' },
    { id: 'tx_entertainment_002', accountId: 'acc_main_checking', categoryId: 'cat_entertainment', type: 'expense', amount: 1899, currency: 'EUR', date: daysAgo(9), note: 'Cinema tickets' },
    { id: 'tx_entertainment_003', accountId: 'acc_cash_wallet', categoryId: 'cat_entertainment', type: 'expense', amount: 750, currency: 'EUR', date: daysAgo(12), note: 'Arcade' },
    { id: 'tx_entertainment_004', accountId: 'acc_main_checking', categoryId: 'cat_entertainment', type: 'expense', amount: 999, currency: 'EUR', date: daysAgo(30), note: 'Streaming service' },
    { id: 'tx_entertainment_005', accountId: 'acc_main_checking', categoryId: 'cat_entertainment', type: 'expense', amount: 2599, currency: 'EUR', date: daysAgo(34), note: 'Concert ticket' },
    { id: 'tx_shopping_002', accountId: 'acc_main_checking', categoryId: 'cat_shopping', type: 'expense', amount: 1299, currency: 'EUR', date: daysAgo(3), note: 'Household items' },
    { id: 'tx_shopping_003', accountId: 'acc_main_checking', categoryId: 'cat_shopping', type: 'expense', amount: 5999, currency: 'EUR', date: daysAgo(17), note: 'Shoes' },
    { id: 'tx_shopping_004', accountId: 'acc_cash_wallet', categoryId: 'cat_shopping', type: 'expense', amount: 1190, currency: 'EUR', date: daysAgo(19), note: 'Accessories' },
    { id: 'tx_shopping_005', accountId: 'acc_main_checking', categoryId: 'cat_shopping', type: 'expense', amount: 2499, currency: 'EUR', date: daysAgo(27), note: 'Books' },
    { id: 'tx_shopping_006', accountId: 'acc_main_checking', categoryId: 'cat_shopping', type: 'expense', amount: 8999, currency: 'EUR', date: daysAgo(47), note: 'Jacket' },
    // Health & personal care
    { id: 'tx_health_001', accountId: 'acc_main_checking', categoryId: 'cat_healthcare', type: 'expense', amount: 2200, currency: 'EUR', date: daysAgo(7), note: 'Pharmacy' },
    { id: 'tx_personal_001', accountId: 'acc_cash_wallet', categoryId: 'cat_personal', type: 'expense', amount: 1500, currency: 'EUR', date: daysAgo(2), note: 'Haircut' },
    { id: 'tx_health_002', accountId: 'acc_main_checking', categoryId: 'cat_healthcare', type: 'expense', amount: 4500, currency: 'EUR', date: daysAgo(14), note: 'Doctor visit' },
    { id: 'tx_health_003', accountId: 'acc_main_checking', categoryId: 'cat_healthcare', type: 'expense', amount: 1290, currency: 'EUR', date: daysAgo(23), note: 'Pharmacy' },
    { id: 'tx_health_004', accountId: 'acc_main_checking', categoryId: 'cat_healthcare', type: 'expense', amount: 3990, currency: 'EUR', date: daysAgo(37), note: 'Dentist co-pay' },
    { id: 'tx_personal_002', accountId: 'acc_cash_wallet', categoryId: 'cat_personal', type: 'expense', amount: 690, currency: 'EUR', date: daysAgo(8), note: 'Toiletries' },
    { id: 'tx_personal_003', accountId: 'acc_main_checking', categoryId: 'cat_personal', type: 'expense', amount: 2990, currency: 'EUR', date: daysAgo(29), note: 'Gym day pass' },
    { id: 'tx_personal_004', accountId: 'acc_main_checking', categoryId: 'cat_personal', type: 'expense', amount: 1590, currency: 'EUR', date: daysAgo(31), note: 'Skincare' },
    // Savings transfer
    { id: 'tx_transfer_out_savings', accountId: 'acc_main_checking', categoryId: null, type: 'transfer', amount: -50000, currency: 'EUR', date: daysAgo(4), note: 'Transfer to savings' },
    { id: 'tx_transfer_in_savings', accountId: 'acc_savings', categoryId: null, type: 'transfer', amount: 50000, currency: 'EUR', date: daysAgo(4), note: 'Transfer from checking' },
  ]);
}
