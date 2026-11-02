// Mock data migration for the development environment
import type { SQLiteDatabase } from 'expo-sqlite';

const PAST_MONTHS_TRANSACTIONS = `
    INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note)
    VALUES
      ('tx_food_015', 'acc_main_checking', 'cat_food', 'expense', 14899, 'EUR', 15490, 'USD', strftime('%s', date('now', '-63 days')), 'Groceries'),
      ('tx_entertainment_006', 'acc_main_checking', 'cat_entertainment', 'expense', 999, 'EUR', 1049, 'USD', strftime('%s', date('now', '-66 days')), 'Streaming service'),
      ('tx_food_021', 'acc_cash_wallet', 'cat_food', 'expense', 759, 'EUR', 797, 'USD', strftime('%s', date('now', '-68 days')), 'Coffee & pastry'),
      ('tx_transport_007', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2580, 'USD', strftime('%s', date('now', '-68 days')), 'Monthly bus pass'),
      ('tx_utilities_006', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 8030, 'USD', strftime('%s', date('now', '-70 days')), 'Internet'),
      ('tx_food_016', 'acc_main_checking', 'cat_food', 'expense', 6269, 'EUR', 6650, 'USD', strftime('%s', date('now', '-70 days')), 'Supermarket'),
      ('tx_utilities_005', 'acc_main_checking', 'cat_utilities', 'expense', 10830, 'EUR', 11150, 'USD', strftime('%s', date('now', '-72 days')), 'Electricity & water'),
      ('tx_shopping_007', 'acc_main_checking', 'cat_shopping', 'expense', 2259, 'EUR', 2330, 'USD', strftime('%s', date('now', '-73 days')), 'Household items'),
      ('tx_rent_003', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 848000, 'USD', strftime('%s', date('now', '-74 days')), 'Rent'),
      ('tx_salary_003', 'acc_main_checking', 'cat_salary', 'income', 510000, 'EUR', 530400, 'USD', strftime('%s', date('now', '-75 days')), 'Monthly salary'),
      ('tx_utilities_007', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4720, 'USD', strftime('%s', date('now', '-76 days')), 'Phone plan'),
      ('tx_food_017', 'acc_cash_wallet', 'cat_food', 'expense', 5939, 'EUR', 6180, 'USD', strftime('%s', date('now', '-77 days')), 'Groceries'),
      ('tx_transport_008', 'acc_main_checking', 'cat_transport', 'expense', 3859, 'EUR', 4090, 'USD', strftime('%s', date('now', '-78 days')), 'Fuel'),
      ('tx_food_019', 'acc_main_checking', 'cat_food', 'expense', 4739, 'EUR', 4880, 'USD', strftime('%s', date('now', '-79 days')), 'Lunch with friends'),
      ('tx_entertainment_007', 'acc_main_checking', 'cat_entertainment', 'expense', 4269, 'EUR', 4440, 'USD', strftime('%s', date('now', '-79 days')), 'Cinema tickets'),
      ('tx_personal_005', 'acc_cash_wallet', 'cat_personal', 'expense', 2090, 'EUR', 2150, 'USD', strftime('%s', date('now', '-80 days')), 'Haircut'),
      ('tx_food_020', 'acc_main_checking', 'cat_food', 'expense', 3729, 'EUR', 3840, 'USD', strftime('%s', date('now', '-81 days')), 'Dinner'),
      ('tx_food_018', 'acc_main_checking', 'cat_food', 'expense', 15789, 'EUR', 16740, 'USD', strftime('%s', date('now', '-84 days')), 'Big grocery run'),
      ('tx_food_027', 'acc_cash_wallet', 'cat_food', 'expense', 2659, 'EUR', 2740, 'USD', strftime('%s', date('now', '-92 days')), 'Dinner'),
      ('tx_food_022', 'acc_main_checking', 'cat_food', 'expense', 6179, 'EUR', 6490, 'USD', strftime('%s', date('now', '-93 days')), 'Groceries'),
      ('tx_shopping_008', 'acc_main_checking', 'cat_shopping', 'expense', 8339, 'EUR', 8760, 'USD', strftime('%s', date('now', '-93 days')), 'Online shopping'),
      ('tx_entertainment_008', 'acc_main_checking', 'cat_entertainment', 'expense', 1299, 'EUR', 1380, 'USD', strftime('%s', date('now', '-96 days')), 'Streaming service'),
      ('tx_transport_009', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2650, 'USD', strftime('%s', date('now', '-98 days')), 'Monthly bus pass'),
      ('tx_utilities_009', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 8270, 'USD', strftime('%s', date('now', '-100 days')), 'Internet'),
      ('tx_freelance_004', 'acc_main_checking', 'cat_freelance', 'income', 86000, 'EUR', 89440, 'USD', strftime('%s', date('now', '-100 days')), 'Freelance: website fixes'),
      ('tx_food_023', 'acc_cash_wallet', 'cat_food', 'expense', 11539, 'EUR', 12230, 'USD', strftime('%s', date('now', '-100 days')), 'Supermarket'),
      ('tx_food_026', 'acc_main_checking', 'cat_food', 'expense', 4379, 'EUR', 4550, 'USD', strftime('%s', date('now', '-101 days')), 'Lunch with friends'),
      ('tx_transport_010', 'acc_main_checking', 'cat_transport', 'expense', 3969, 'EUR', 4090, 'USD', strftime('%s', date('now', '-101 days')), 'Train tickets'),
      ('tx_utilities_008', 'acc_main_checking', 'cat_utilities', 'expense', 10980, 'EUR', 11530, 'USD', strftime('%s', date('now', '-102 days')), 'Gas'),
      ('tx_rent_004', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 848000, 'USD', strftime('%s', date('now', '-104 days')), 'Rent'),
      ('tx_salary_004', 'acc_main_checking', 'cat_salary', 'income', 519000, 'EUR', 539760, 'USD', strftime('%s', date('now', '-105 days')), 'Monthly salary'),
      ('tx_utilities_010', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4770, 'USD', strftime('%s', date('now', '-106 days')), 'Phone plan'),
      ('tx_health_005', 'acc_main_checking', 'cat_healthcare', 'expense', 4240, 'EUR', 4450, 'USD', strftime('%s', date('now', '-106 days')), 'Dentist co-pay'),
      ('tx_food_024', 'acc_cash_wallet', 'cat_food', 'expense', 16979, 'EUR', 17490, 'USD', strftime('%s', date('now', '-107 days')), 'Groceries'),
      ('tx_food_028', 'acc_cash_wallet', 'cat_food', 'expense', 2249, 'EUR', 2360, 'USD', strftime('%s', date('now', '-113 days')), 'Coffee & pastry'),
      ('tx_personal_006', 'acc_cash_wallet', 'cat_personal', 'expense', 2520, 'EUR', 2650, 'USD', strftime('%s', date('now', '-113 days')), 'Skincare'),
      ('tx_food_025', 'acc_main_checking', 'cat_food', 'expense', 14989, 'EUR', 15890, 'USD', strftime('%s', date('now', '-114 days')), 'Big grocery run'),
      ('tx_food_029', 'acc_cash_wallet', 'cat_food', 'expense', 7149, 'EUR', 7430, 'USD', strftime('%s', date('now', '-123 days')), 'Groceries'),
      ('tx_food_035', 'acc_main_checking', 'cat_food', 'expense', 1279, 'EUR', 1330, 'USD', strftime('%s', date('now', '-123 days')), 'Coffee & pastry'),
      ('tx_entertainment_009', 'acc_main_checking', 'cat_entertainment', 'expense', 1299, 'EUR', 1350, 'USD', strftime('%s', date('now', '-126 days')), 'Streaming service'),
      ('tx_transport_011', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2600, 'USD', strftime('%s', date('now', '-128 days')), 'Monthly bus pass'),
      ('tx_utilities_012', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 8030, 'USD', strftime('%s', date('now', '-130 days')), 'Internet'),
      ('tx_food_030', 'acc_cash_wallet', 'cat_food', 'expense', 12509, 'EUR', 13260, 'USD', strftime('%s', date('now', '-130 days')), 'Supermarket'),
      ('tx_entertainment_010', 'acc_main_checking', 'cat_entertainment', 'expense', 2849, 'EUR', 2960, 'USD', strftime('%s', date('now', '-130 days')), 'Concert ticket'),
      ('tx_utilities_011', 'acc_main_checking', 'cat_utilities', 'expense', 8360, 'EUR', 8860, 'USD', strftime('%s', date('now', '-132 days')), 'Electricity & water'),
      ('tx_rent_005', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 840000, 'USD', strftime('%s', date('now', '-134 days')), 'Rent'),
      ('tx_food_033', 'acc_main_checking', 'cat_food', 'expense', 4699, 'EUR', 4930, 'USD', strftime('%s', date('now', '-134 days')), 'Lunch with friends'),
      ('tx_salary_005', 'acc_main_checking', 'cat_salary', 'income', 500000, 'EUR', 530000, 'USD', strftime('%s', date('now', '-135 days')), 'Monthly salary'),
      ('tx_utilities_013', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4680, 'USD', strftime('%s', date('now', '-136 days')), 'Phone plan'),
      ('tx_transport_012', 'acc_main_checking', 'cat_transport', 'expense', 2189, 'EUR', 2250, 'USD', strftime('%s', date('now', '-136 days')), 'Taxi share'),
      ('tx_personal_007', 'acc_cash_wallet', 'cat_personal', 'expense', 1010, 'EUR', 1070, 'USD', strftime('%s', date('now', '-136 days')), 'Haircut'),
      ('tx_food_031', 'acc_main_checking', 'cat_food', 'expense', 7909, 'EUR', 8380, 'USD', strftime('%s', date('now', '-137 days')), 'Groceries'),
      ('tx_shopping_009', 'acc_main_checking', 'cat_shopping', 'expense', 5499, 'EUR', 5770, 'USD', strftime('%s', date('now', '-141 days')), 'Books'),
      ('tx_food_034', 'acc_cash_wallet', 'cat_food', 'expense', 2339, 'EUR', 2480, 'USD', strftime('%s', date('now', '-142 days')), 'Dinner'),
      ('tx_food_032', 'acc_cash_wallet', 'cat_food', 'expense', 15759, 'EUR', 16550, 'USD', strftime('%s', date('now', '-144 days')), 'Big grocery run'),
      ('tx_food_040', 'acc_cash_wallet', 'cat_food', 'expense', 3649, 'EUR', 3760, 'USD', strftime('%s', date('now', '-151 days')), 'Lunch with friends'),
      ('tx_food_036', 'acc_main_checking', 'cat_food', 'expense', 8779, 'EUR', 9310, 'USD', strftime('%s', date('now', '-153 days')), 'Groceries'),
      ('tx_entertainment_011', 'acc_main_checking', 'cat_entertainment', 'expense', 1299, 'EUR', 1380, 'USD', strftime('%s', date('now', '-156 days')), 'Streaming service'),
      ('tx_shopping_010', 'acc_main_checking', 'cat_shopping', 'expense', 4399, 'EUR', 4530, 'USD', strftime('%s', date('now', '-156 days')), 'Online shopping'),
      ('tx_transport_013', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2650, 'USD', strftime('%s', date('now', '-158 days')), 'Monthly bus pass'),
      ('tx_utilities_015', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 8030, 'USD', strftime('%s', date('now', '-160 days')), 'Internet'),
      ('tx_food_037', 'acc_main_checking', 'cat_food', 'expense', 6759, 'EUR', 7100, 'USD', strftime('%s', date('now', '-160 days')), 'Supermarket'),
      ('tx_health_006', 'acc_main_checking', 'cat_healthcare', 'expense', 3040, 'EUR', 3220, 'USD', strftime('%s', date('now', '-160 days')), 'Dentist co-pay'),
      ('tx_utilities_014', 'acc_main_checking', 'cat_utilities', 'expense', 8030, 'EUR', 8510, 'USD', strftime('%s', date('now', '-162 days')), 'Gas'),
      ('tx_food_042', 'acc_cash_wallet', 'cat_food', 'expense', 5399, 'EUR', 5670, 'USD', strftime('%s', date('now', '-162 days')), 'Coffee & pastry'),
      ('tx_food_041', 'acc_main_checking', 'cat_food', 'expense', 3649, 'EUR', 3790, 'USD', strftime('%s', date('now', '-163 days')), 'Dinner'),
      ('tx_rent_006', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 848000, 'USD', strftime('%s', date('now', '-164 days')), 'Rent'),
      ('tx_salary_006', 'acc_main_checking', 'cat_salary', 'income', 512000, 'EUR', 542720, 'USD', strftime('%s', date('now', '-165 days')), 'Monthly salary'),
      ('tx_utilities_016', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4680, 'USD', strftime('%s', date('now', '-166 days')), 'Phone plan'),
      ('tx_food_038', 'acc_main_checking', 'cat_food', 'expense', 6599, 'EUR', 6800, 'USD', strftime('%s', date('now', '-167 days')), 'Groceries'),
      ('tx_personal_008', 'acc_cash_wallet', 'cat_personal', 'expense', 2810, 'EUR', 2890, 'USD', strftime('%s', date('now', '-168 days')), 'Toiletries'),
      ('tx_food_039', 'acc_main_checking', 'cat_food', 'expense', 15489, 'EUR', 15950, 'USD', strftime('%s', date('now', '-174 days')), 'Big grocery run'),
      ('tx_transport_014', 'acc_main_checking', 'cat_transport', 'expense', 1629, 'EUR', 1730, 'USD', strftime('%s', date('now', '-174 days')), 'Fuel'),
      ('tx_food_047', 'acc_cash_wallet', 'cat_food', 'expense', 4249, 'EUR', 4380, 'USD', strftime('%s', date('now', '-181 days')), 'Lunch with friends'),
      ('tx_food_043', 'acc_main_checking', 'cat_food', 'expense', 15409, 'EUR', 16180, 'USD', strftime('%s', date('now', '-183 days')), 'Groceries'),
      ('tx_entertainment_012', 'acc_main_checking', 'cat_entertainment', 'expense', 1299, 'EUR', 1350, 'USD', strftime('%s', date('now', '-186 days')), 'Streaming service'),
      ('tx_freelance_005', 'acc_main_checking', 'cat_freelance', 'income', 106000, 'EUR', 111300, 'USD', strftime('%s', date('now', '-188 days')), 'Freelance: website fixes'),
      ('tx_transport_015', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2620, 'USD', strftime('%s', date('now', '-188 days')), 'Monthly bus pass'),
      ('tx_food_048', 'acc_cash_wallet', 'cat_food', 'expense', 2919, 'EUR', 3040, 'USD', strftime('%s', date('now', '-189 days')), 'Dinner'),
      ('tx_utilities_018', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 8030, 'USD', strftime('%s', date('now', '-190 days')), 'Internet'),
      ('tx_food_044', 'acc_main_checking', 'cat_food', 'expense', 17059, 'EUR', 17740, 'USD', strftime('%s', date('now', '-190 days')), 'Supermarket'),
      ('tx_utilities_017', 'acc_main_checking', 'cat_utilities', 'expense', 11030, 'EUR', 11580, 'USD', strftime('%s', date('now', '-192 days')), 'Electricity & water'),
      ('tx_transport_016', 'acc_main_checking', 'cat_transport', 'expense', 1419, 'EUR', 1480, 'USD', strftime('%s', date('now', '-192 days')), 'Fuel'),
      ('tx_rent_007', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 832000, 'USD', strftime('%s', date('now', '-194 days')), 'Rent'),
      ('tx_personal_009', 'acc_cash_wallet', 'cat_personal', 'expense', 2820, 'EUR', 2930, 'USD', strftime('%s', date('now', '-194 days')), 'Haircut'),
      ('tx_salary_007', 'acc_main_checking', 'cat_salary', 'income', 506000, 'EUR', 531300, 'USD', strftime('%s', date('now', '-195 days')), 'Monthly salary'),
      ('tx_utilities_019', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4720, 'USD', strftime('%s', date('now', '-196 days')), 'Phone plan'),
      ('tx_food_045', 'acc_main_checking', 'cat_food', 'expense', 12709, 'EUR', 13220, 'USD', strftime('%s', date('now', '-197 days')), 'Groceries'),
      ('tx_food_046', 'acc_main_checking', 'cat_food', 'expense', 15109, 'EUR', 16020, 'USD', strftime('%s', date('now', '-204 days')), 'Big grocery run'),
      ('tx_entertainment_013', 'acc_main_checking', 'cat_entertainment', 'expense', 3229, 'EUR', 3330, 'USD', strftime('%s', date('now', '-205 days')), 'Cinema tickets'),
      ('tx_food_049', 'acc_cash_wallet', 'cat_food', 'expense', 2789, 'EUR', 2930, 'USD', strftime('%s', date('now', '-206 days')), 'Coffee & pastry'),
      ('tx_shopping_011', 'acc_main_checking', 'cat_shopping', 'expense', 6109, 'EUR', 6290, 'USD', strftime('%s', date('now', '-207 days')), 'Books'),
      ('tx_food_050', 'acc_cash_wallet', 'cat_food', 'expense', 6239, 'EUR', 6490, 'USD', strftime('%s', date('now', '-213 days')), 'Groceries'),
      ('tx_entertainment_014', 'acc_main_checking', 'cat_entertainment', 'expense', 999, 'EUR', 1049, 'USD', strftime('%s', date('now', '-216 days')), 'Streaming service'),
      ('tx_transport_017', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2650, 'USD', strftime('%s', date('now', '-218 days')), 'Monthly bus pass'),
      ('tx_transport_018', 'acc_main_checking', 'cat_transport', 'expense', 1999, 'EUR', 2100, 'USD', strftime('%s', date('now', '-219 days')), 'Fuel'),
      ('tx_utilities_021', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 8270, 'USD', strftime('%s', date('now', '-220 days')), 'Internet'),
      ('tx_food_051', 'acc_main_checking', 'cat_food', 'expense', 7109, 'EUR', 7320, 'USD', strftime('%s', date('now', '-220 days')), 'Supermarket'),
      ('tx_utilities_020', 'acc_main_checking', 'cat_utilities', 'expense', 11540, 'EUR', 11890, 'USD', strftime('%s', date('now', '-222 days')), 'Gas'),
      ('tx_rent_008', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 848000, 'USD', strftime('%s', date('now', '-224 days')), 'Rent'),
      ('tx_salary_008', 'acc_main_checking', 'cat_salary', 'income', 515000, 'EUR', 535600, 'USD', strftime('%s', date('now', '-225 days')), 'Monthly salary'),
      ('tx_health_007', 'acc_main_checking', 'cat_healthcare', 'expense', 2610, 'EUR', 2710, 'USD', strftime('%s', date('now', '-225 days')), 'Dentist co-pay'),
      ('tx_utilities_022', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4770, 'USD', strftime('%s', date('now', '-226 days')), 'Phone plan'),
      ('tx_personal_010', 'acc_cash_wallet', 'cat_personal', 'expense', 840, 'EUR', 882, 'USD', strftime('%s', date('now', '-226 days')), 'Gym day pass'),
      ('tx_food_052', 'acc_main_checking', 'cat_food', 'expense', 16599, 'EUR', 17590, 'USD', strftime('%s', date('now', '-227 days')), 'Groceries'),
      ('tx_food_054', 'acc_cash_wallet', 'cat_food', 'expense', 1299, 'EUR', 1350, 'USD', strftime('%s', date('now', '-228 days')), 'Lunch with friends'),
      ('tx_food_053', 'acc_main_checking', 'cat_food', 'expense', 17029, 'EUR', 18050, 'USD', strftime('%s', date('now', '-234 days')), 'Big grocery run'),
      ('tx_food_056', 'acc_main_checking', 'cat_food', 'expense', 3199, 'EUR', 3330, 'USD', strftime('%s', date('now', '-234 days')), 'Coffee & pastry'),
      ('tx_food_055', 'acc_main_checking', 'cat_food', 'expense', 579, 'EUR', 608, 'USD', strftime('%s', date('now', '-236 days')), 'Dinner'),
      ('tx_shopping_012', 'acc_main_checking', 'cat_shopping', 'expense', 4199, 'EUR', 4410, 'USD', strftime('%s', date('now', '-236 days')), 'Household items'),
      ('tx_food_057', 'acc_main_checking', 'cat_food', 'expense', 7569, 'EUR', 7870, 'USD', strftime('%s', date('now', '-243 days')), 'Groceries'),
      ('tx_entertainment_015', 'acc_main_checking', 'cat_entertainment', 'expense', 999, 'EUR', 1049, 'USD', strftime('%s', date('now', '-246 days')), 'Streaming service'),
      ('tx_transport_019', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2620, 'USD', strftime('%s', date('now', '-248 days')), 'Monthly bus pass'),
      ('tx_food_061', 'acc_main_checking', 'cat_food', 'expense', 1479, 'EUR', 1520, 'USD', strftime('%s', date('now', '-249 days')), 'Lunch with friends'),
      ('tx_utilities_024', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 8270, 'USD', strftime('%s', date('now', '-250 days')), 'Internet'),
      ('tx_food_058', 'acc_main_checking', 'cat_food', 'expense', 14199, 'EUR', 14620, 'USD', strftime('%s', date('now', '-250 days')), 'Supermarket'),
      ('tx_food_063', 'acc_main_checking', 'cat_food', 'expense', 2769, 'EUR', 2880, 'USD', strftime('%s', date('now', '-251 days')), 'Coffee & pastry'),
      ('tx_utilities_023', 'acc_main_checking', 'cat_utilities', 'expense', 10220, 'EUR', 10530, 'USD', strftime('%s', date('now', '-252 days')), 'Electricity & water'),
      ('tx_personal_011', 'acc_cash_wallet', 'cat_personal', 'expense', 1690, 'EUR', 1740, 'USD', strftime('%s', date('now', '-252 days')), 'Skincare'),
      ('tx_rent_009', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 832000, 'USD', strftime('%s', date('now', '-254 days')), 'Rent'),
      ('tx_salary_009', 'acc_main_checking', 'cat_salary', 'income', 521000, 'EUR', 552260, 'USD', strftime('%s', date('now', '-255 days')), 'Monthly salary'),
      ('tx_food_062', 'acc_main_checking', 'cat_food', 'expense', 3099, 'EUR', 3190, 'USD', strftime('%s', date('now', '-255 days')), 'Dinner'),
      ('tx_shopping_013', 'acc_main_checking', 'cat_shopping', 'expense', 5789, 'EUR', 5960, 'USD', strftime('%s', date('now', '-255 days')), 'Household items'),
      ('tx_utilities_025', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4680, 'USD', strftime('%s', date('now', '-256 days')), 'Phone plan'),
      ('tx_food_059', 'acc_main_checking', 'cat_food', 'expense', 11179, 'EUR', 11850, 'USD', strftime('%s', date('now', '-257 days')), 'Groceries'),
      ('tx_food_060', 'acc_main_checking', 'cat_food', 'expense', 15979, 'EUR', 16460, 'USD', strftime('%s', date('now', '-264 days')), 'Big grocery run'),
      ('tx_transport_020', 'acc_main_checking', 'cat_transport', 'expense', 3319, 'EUR', 3520, 'USD', strftime('%s', date('now', '-266 days')), 'Taxi share'),
      ('tx_entertainment_016', 'acc_main_checking', 'cat_entertainment', 'expense', 4179, 'EUR', 4350, 'USD', strftime('%s', date('now', '-267 days')), 'Concert ticket'),
      ('tx_food_064', 'acc_cash_wallet', 'cat_food', 'expense', 7319, 'EUR', 7760, 'USD', strftime('%s', date('now', '-273 days')), 'Groceries'),
      ('tx_food_069', 'acc_cash_wallet', 'cat_food', 'expense', 2139, 'EUR', 2250, 'USD', strftime('%s', date('now', '-273 days')), 'Dinner'),
      ('tx_health_008', 'acc_main_checking', 'cat_healthcare', 'expense', 2640, 'EUR', 2750, 'USD', strftime('%s', date('now', '-273 days')), 'Doctor visit'),
      ('tx_shopping_014', 'acc_main_checking', 'cat_shopping', 'expense', 2359, 'EUR', 2430, 'USD', strftime('%s', date('now', '-275 days')), 'Household items'),
      ('tx_entertainment_017', 'acc_main_checking', 'cat_entertainment', 'expense', 1299, 'EUR', 1340, 'USD', strftime('%s', date('now', '-276 days')), 'Streaming service'),
      ('tx_transport_021', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2650, 'USD', strftime('%s', date('now', '-278 days')), 'Monthly bus pass'),
      ('tx_utilities_027', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 8030, 'USD', strftime('%s', date('now', '-280 days')), 'Internet'),
      ('tx_food_065', 'acc_main_checking', 'cat_food', 'expense', 6429, 'EUR', 6810, 'USD', strftime('%s', date('now', '-280 days')), 'Supermarket'),
      ('tx_utilities_026', 'acc_main_checking', 'cat_utilities', 'expense', 7870, 'EUR', 8260, 'USD', strftime('%s', date('now', '-282 days')), 'Electricity & water'),
      ('tx_rent_010', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 848000, 'USD', strftime('%s', date('now', '-284 days')), 'Rent'),
      ('tx_freelance_006', 'acc_main_checking', 'cat_freelance', 'income', 122000, 'EUR', 126880, 'USD', strftime('%s', date('now', '-284 days')), 'Freelance: mobile app feature'),
      ('tx_food_068', 'acc_cash_wallet', 'cat_food', 'expense', 2239, 'EUR', 2330, 'USD', strftime('%s', date('now', '-284 days')), 'Lunch with friends'),
      ('tx_salary_010', 'acc_main_checking', 'cat_salary', 'income', 521000, 'EUR', 541840, 'USD', strftime('%s', date('now', '-285 days')), 'Monthly salary'),
      ('tx_personal_012', 'acc_cash_wallet', 'cat_personal', 'expense', 1380, 'EUR', 1450, 'USD', strftime('%s', date('now', '-285 days')), 'Toiletries'),
      ('tx_utilities_028', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4680, 'USD', strftime('%s', date('now', '-286 days')), 'Phone plan'),
      ('tx_food_066', 'acc_cash_wallet', 'cat_food', 'expense', 7839, 'EUR', 8150, 'USD', strftime('%s', date('now', '-287 days')), 'Groceries'),
      ('tx_food_070', 'acc_main_checking', 'cat_food', 'expense', 2239, 'EUR', 2370, 'USD', strftime('%s', date('now', '-288 days')), 'Coffee & pastry'),
      ('tx_transport_022', 'acc_main_checking', 'cat_transport', 'expense', 4609, 'EUR', 4840, 'USD', strftime('%s', date('now', '-291 days')), 'Fuel'),
      ('tx_food_067', 'acc_main_checking', 'cat_food', 'expense', 18969, 'EUR', 20110, 'USD', strftime('%s', date('now', '-294 days')), 'Big grocery run'),
      ('tx_food_071', 'acc_main_checking', 'cat_food', 'expense', 13219, 'EUR', 13620, 'USD', strftime('%s', date('now', '-303 days')), 'Groceries'),
      ('tx_entertainment_018', 'acc_main_checking', 'cat_entertainment', 'expense', 999, 'EUR', 1049, 'USD', strftime('%s', date('now', '-306 days')), 'Streaming service'),
      ('tx_transport_023', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2580, 'USD', strftime('%s', date('now', '-308 days')), 'Monthly bus pass'),
      ('tx_food_076', 'acc_cash_wallet', 'cat_food', 'expense', 5249, 'EUR', 5460, 'USD', strftime('%s', date('now', '-309 days')), 'Dinner'),
      ('tx_utilities_030', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 8190, 'USD', strftime('%s', date('now', '-310 days')), 'Internet'),
      ('tx_food_072', 'acc_cash_wallet', 'cat_food', 'expense', 4849, 'EUR', 4990, 'USD', strftime('%s', date('now', '-310 days')), 'Supermarket'),
      ('tx_transport_024', 'acc_main_checking', 'cat_transport', 'expense', 1829, 'EUR', 1900, 'USD', strftime('%s', date('now', '-310 days')), 'Train tickets'),
      ('tx_food_075', 'acc_cash_wallet', 'cat_food', 'expense', 559, 'EUR', 587, 'USD', strftime('%s', date('now', '-311 days')), 'Lunch with friends'),
      ('tx_utilities_029', 'acc_main_checking', 'cat_utilities', 'expense', 11080, 'EUR', 11410, 'USD', strftime('%s', date('now', '-312 days')), 'Gas'),
      ('tx_rent_011', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 848000, 'USD', strftime('%s', date('now', '-314 days')), 'Rent'),
      ('tx_salary_011', 'acc_main_checking', 'cat_salary', 'income', 512000, 'EUR', 532480, 'USD', strftime('%s', date('now', '-315 days')), 'Monthly salary'),
      ('tx_utilities_031', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4640, 'USD', strftime('%s', date('now', '-316 days')), 'Phone plan'),
      ('tx_food_073', 'acc_cash_wallet', 'cat_food', 'expense', 6219, 'EUR', 6470, 'USD', strftime('%s', date('now', '-317 days')), 'Groceries'),
      ('tx_shopping_015', 'acc_main_checking', 'cat_shopping', 'expense', 4169, 'EUR', 4340, 'USD', strftime('%s', date('now', '-318 days')), 'Accessories'),
      ('tx_food_077', 'acc_main_checking', 'cat_food', 'expense', 3199, 'EUR', 3330, 'USD', strftime('%s', date('now', '-323 days')), 'Coffee & pastry'),
      ('tx_food_074', 'acc_main_checking', 'cat_food', 'expense', 9919, 'EUR', 10220, 'USD', strftime('%s', date('now', '-324 days')), 'Big grocery run'),
      ('tx_entertainment_019', 'acc_main_checking', 'cat_entertainment', 'expense', 3099, 'EUR', 3220, 'USD', strftime('%s', date('now', '-326 days')), 'Concert ticket'),
      ('tx_personal_013', 'acc_cash_wallet', 'cat_personal', 'expense', 1380, 'EUR', 1420, 'USD', strftime('%s', date('now', '-327 days')), 'Gym day pass'),
      ('tx_food_078', 'acc_main_checking', 'cat_food', 'expense', 17989, 'EUR', 19070, 'USD', strftime('%s', date('now', '-333 days')), 'Groceries'),
      ('tx_food_083', 'acc_main_checking', 'cat_food', 'expense', 579, 'EUR', 608, 'USD', strftime('%s', date('now', '-333 days')), 'Dinner'),
      ('tx_shopping_016', 'acc_main_checking', 'cat_shopping', 'expense', 8299, 'EUR', 8800, 'USD', strftime('%s', date('now', '-333 days')), 'Books'),
      ('tx_food_084', 'acc_cash_wallet', 'cat_food', 'expense', 2709, 'EUR', 2790, 'USD', strftime('%s', date('now', '-336 days')), 'Coffee & pastry'),
      ('tx_entertainment_020', 'acc_main_checking', 'cat_entertainment', 'expense', 999, 'EUR', 1049, 'USD', strftime('%s', date('now', '-336 days')), 'Streaming service'),
      ('tx_transport_025', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2580, 'USD', strftime('%s', date('now', '-338 days')), 'Monthly bus pass'),
      ('tx_utilities_033', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 8110, 'USD', strftime('%s', date('now', '-340 days')), 'Internet'),
      ('tx_food_079', 'acc_cash_wallet', 'cat_food', 'expense', 15689, 'EUR', 16630, 'USD', strftime('%s', date('now', '-340 days')), 'Supermarket'),
      ('tx_health_009', 'acc_main_checking', 'cat_healthcare', 'expense', 2230, 'EUR', 2360, 'USD', strftime('%s', date('now', '-340 days')), 'Pharmacy'),
      ('tx_utilities_032', 'acc_main_checking', 'cat_utilities', 'expense', 7590, 'EUR', 8050, 'USD', strftime('%s', date('now', '-342 days')), 'Electricity & water'),
      ('tx_food_082', 'acc_main_checking', 'cat_food', 'expense', 2579, 'EUR', 2660, 'USD', strftime('%s', date('now', '-342 days')), 'Lunch with friends'),
      ('tx_personal_014', 'acc_cash_wallet', 'cat_personal', 'expense', 690, 'EUR', 724, 'USD', strftime('%s', date('now', '-343 days')), 'Gym day pass'),
      ('tx_rent_012', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 824000, 'USD', strftime('%s', date('now', '-344 days')), 'Rent'),
      ('tx_salary_012', 'acc_main_checking', 'cat_salary', 'income', 508000, 'EUR', 523240, 'USD', strftime('%s', date('now', '-345 days')), 'Monthly salary'),
      ('tx_utilities_034', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4770, 'USD', strftime('%s', date('now', '-346 days')), 'Phone plan'),
      ('tx_food_080', 'acc_cash_wallet', 'cat_food', 'expense', 18589, 'EUR', 19330, 'USD', strftime('%s', date('now', '-347 days')), 'Groceries'),
      ('tx_food_081', 'acc_main_checking', 'cat_food', 'expense', 11519, 'EUR', 11980, 'USD', strftime('%s', date('now', '-354 days')), 'Big grocery run'),
      ('tx_transport_026', 'acc_main_checking', 'cat_transport', 'expense', 4409, 'EUR', 4630, 'USD', strftime('%s', date('now', '-355 days')), 'Train tickets');
`;

export async function mockData(db: SQLiteDatabase): Promise<void> {
  // Clear existing mock data (safe order for foreign keys)
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM recurring_rule_runs;
    DELETE FROM recurring_rules;
    DELETE FROM accounts WHERE id = 'acc_cash_wallet' OR id = 'acc_savings'; 
  `);

  // Basic accounts
  await db.execAsync(`
    INSERT INTO accounts (id, name, type, icon, color, currency, budget)
    VALUES
      ('acc_cash_wallet', 'Cash Wallet', 'cash', '💵', '#66BB6A', 'EUR', NULL),
      ('acc_savings', 'Emergency Savings', 'savings', '💰', '#45B7D1', 'EUR', 100000);
  `);

  // Sample transactions (amounts are in cents)
  await db.execAsync(`
    INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note)
    VALUES
      -- Income
      ('tx_salary_001', 'acc_main_checking', 'cat_salary', 'income', 500000, 'EUR', 520000, 'USD', strftime('%s', date('now', '-15 days')), 'Monthly salary'),
      ('tx_freelance_001', 'acc_main_checking', 'cat_freelance', 'income', 120000, 'EUR', 128000, 'USD', strftime('%s', date('now', '-10 days')), 'Freelance project'),
      ('tx_salary_002', 'acc_main_checking', 'cat_salary', 'income', 520000, 'EUR', 545000, 'USD', strftime('%s', date('now', '-55 days')), 'Monthly salary'),
      ('tx_freelance_002', 'acc_main_checking', 'cat_freelance', 'income', 42000, 'EUR', 44200, 'USD', strftime('%s', date('now', '-33 days')), 'Freelance: website fixes'),
      ('tx_freelance_003', 'acc_main_checking', 'cat_freelance', 'income', 90000, 'EUR', 96000, 'USD', strftime('%s', date('now', '-21 days')), 'Freelance: mobile app feature'),

      -- Food & dining
      ('tx_food_001', 'acc_cash_wallet', 'cat_food', 'expense', 8500, 'EUR', 8900, 'USD', strftime('%s', date('now', '0 days')), 'Lunch with friends'),
      ('tx_food_002', 'acc_cash_wallet', 'cat_food', 'expense', 6000, 'EUR', 6400, 'USD', strftime('%s', date('now', '-9 days')), 'Lunch with friends'),
      ('tx_food_003', 'acc_cash_wallet', 'cat_food', 'expense', 23000, 'EUR', 25400, 'USD', strftime('%s', date('now', '-3 days')), 'Groceries'),
      ('tx_food_004', 'acc_cash_wallet', 'cat_food', 'expense', 12000, 'EUR', 12700, 'USD', strftime('%s', date('now', '0 days')), 'Groceries'),
      ('tx_food_005', 'acc_main_checking', 'cat_food', 'expense', 5690, 'EUR', 5990, 'USD', strftime('%s', date('now', '-2 days')), 'Supermarket'),
      ('tx_food_006', 'acc_main_checking', 'cat_food', 'expense', 1890, 'EUR', 1990, 'USD', strftime('%s', date('now', '-4 days')), 'Coffee & pastry'),
      ('tx_food_007', 'acc_cash_wallet', 'cat_food', 'expense', 950, 'EUR', 970, 'USD', strftime('%s', date('now', '-5 days')), 'Lunch'),
      ('tx_food_008', 'acc_main_checking', 'cat_food', 'expense', 7420, 'EUR', 7620, 'USD', strftime('%s', date('now', '-11 days')), 'Groceries'),
      ('tx_food_009', 'acc_cash_wallet', 'cat_food', 'expense', 430, 'EUR', 460, 'USD', strftime('%s', date('now', '-13 days')), 'Snack'),
      ('tx_food_010', 'acc_main_checking', 'cat_food', 'expense', 3250, 'EUR', 3350, 'USD', strftime('%s', date('now', '-18 days')), 'Dinner'),
      ('tx_food_011', 'acc_main_checking', 'cat_food', 'expense', 6120, 'EUR', 6320, 'USD', strftime('%s', date('now', '-24 days')), 'Groceries'),
      ('tx_food_012', 'acc_cash_wallet', 'cat_food', 'expense', 1290, 'EUR', 1490, 'USD', strftime('%s', date('now', '-28 days')), 'Lunch'),
      ('tx_food_013', 'acc_main_checking', 'cat_food', 'expense', 860, 'EUR', 880, 'USD', strftime('%s', date('now', '-36 days')), 'Coffee'),
      ('tx_food_014', 'acc_main_checking', 'cat_food', 'expense', 15450, 'EUR', 15950, 'USD', strftime('%s', date('now', '-41 days')), 'Big grocery run'),

      -- Transportation
      ('tx_transport_001', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2700, 'USD', strftime('%s', date('now', '-8 days')), 'Monthly bus pass'),
      ('tx_transport_002', 'acc_main_checking', 'cat_transport', 'expense', 189, 'EUR', 199, 'USD', strftime('%s', date('now', '-1 days')), 'Bus ticket'),
      ('tx_transport_003', 'acc_cash_wallet', 'cat_transport', 'expense', 650, 'EUR', 690, 'USD', strftime('%s', date('now', '-6 days')), 'Taxi share'),
      ('tx_transport_004', 'acc_main_checking', 'cat_transport', 'expense', 4800, 'EUR', 4900, 'USD', strftime('%s', date('now', '-20 days')), 'Train tickets'),
      ('tx_transport_005', 'acc_main_checking', 'cat_transport', 'expense', 2500, 'EUR', 2700, 'USD', strftime('%s', date('now', '-38 days')), 'Monthly bus pass'),
      ('tx_transport_006', 'acc_main_checking', 'cat_transport', 'expense', 1200, 'EUR', 1350, 'USD', strftime('%s', date('now', '-26 days')), 'Fuel'),

      -- Housing & utilities
      ('tx_rent_001', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 810000, 'USD', strftime('%s', date('now', '-14 days')), 'Rent'),
      ('tx_utilities_001', 'acc_main_checking', 'cat_utilities', 'expense', 9500, 'EUR', 9700, 'USD', strftime('%s', date('now', '-12 days')), 'Electricity & water'),
      ('tx_rent_002', 'acc_main_checking', 'cat_housing', 'expense', 800000, 'EUR', 810000, 'USD', strftime('%s', date('now', '-44 days')), 'Rent'),
      ('tx_utilities_002', 'acc_main_checking', 'cat_utilities', 'expense', 7800, 'EUR', 7950, 'USD', strftime('%s', date('now', '-40 days')), 'Internet'),
      ('tx_utilities_003', 'acc_main_checking', 'cat_utilities', 'expense', 11200, 'EUR', 12200, 'USD', strftime('%s', date('now', '-22 days')), 'Gas'),
      ('tx_utilities_004', 'acc_main_checking', 'cat_utilities', 'expense', 4500, 'EUR', 4750, 'USD', strftime('%s', date('now', '-16 days')), 'Phone plan'),

      -- Entertainment & subscriptions
      ('tx_entertainment_001', 'acc_main_checking', 'cat_entertainment', 'expense', 1299, 'EUR', 1399, 'USD', strftime('%s', date('now', '-6 days')), 'Streaming service'),
      ('tx_shopping_001', 'acc_main_checking', 'cat_shopping', 'expense', 3499, 'EUR', 3699, 'USD', strftime('%s', date('now', '-5 days')), 'Online shopping'),
      ('tx_entertainment_002', 'acc_main_checking', 'cat_entertainment', 'expense', 1899, 'EUR', 1999, 'USD', strftime('%s', date('now', '-9 days')), 'Cinema tickets'),
      ('tx_entertainment_003', 'acc_cash_wallet', 'cat_entertainment', 'expense', 750, 'EUR', 780, 'USD', strftime('%s', date('now', '-12 days')), 'Arcade'),
      ('tx_entertainment_004', 'acc_main_checking', 'cat_entertainment', 'expense', 999, 'EUR', 1190, 'USD', strftime('%s', date('now', '-30 days')), 'Streaming service'),
      ('tx_entertainment_005', 'acc_main_checking', 'cat_entertainment', 'expense', 2599, 'EUR', 2799, 'USD', strftime('%s', date('now', '-34 days')), 'Concert ticket'),
      ('tx_shopping_002', 'acc_main_checking', 'cat_shopping', 'expense', 1299, 'EUR', 1399, 'USD', strftime('%s', date('now', '-3 days')), 'Household items'),
      ('tx_shopping_003', 'acc_main_checking', 'cat_shopping', 'expense', 5999, 'EUR', 6151, 'USD', strftime('%s', date('now', '-17 days')), 'Shoes'),
      ('tx_shopping_004', 'acc_cash_wallet', 'cat_shopping', 'expense', 1190, 'EUR', 1322, 'USD', strftime('%s', date('now', '-19 days')), 'Accessories'),
      ('tx_shopping_005', 'acc_main_checking', 'cat_shopping', 'expense', 2499, 'EUR', 2632, 'USD', strftime('%s', date('now', '-27 days')), 'Books'),
      ('tx_shopping_006', 'acc_main_checking', 'cat_shopping', 'expense', 8999, 'EUR', 9144, 'USD', strftime('%s', date('now', '-47 days')), 'Jacket'),

      -- Health & personal care
      ('tx_health_001', 'acc_main_checking', 'cat_healthcare', 'expense', 2200, 'EUR', 2356, 'USD', strftime('%s', date('now', '-7 days')), 'Pharmacy'),
      ('tx_personal_001', 'acc_cash_wallet', 'cat_personal', 'expense', 1500, 'EUR', 1705, 'USD', strftime('%s', date('now', '-2 days')), 'Haircut'),
      ('tx_health_002', 'acc_main_checking', 'cat_healthcare', 'expense', 4500, 'EUR', 4690, 'USD', strftime('%s', date('now', '-14 days')), 'Doctor visit'),
      ('tx_health_003', 'acc_main_checking', 'cat_healthcare', 'expense', 1290, 'EUR', 1381, 'USD', strftime('%s', date('now', '-23 days')), 'Pharmacy'),
      ('tx_health_004', 'acc_main_checking', 'cat_healthcare', 'expense', 3990, 'EUR', 4167, 'USD', strftime('%s', date('now', '-37 days')), 'Dentist co-pay'),
      ('tx_personal_002', 'acc_cash_wallet', 'cat_personal', 'expense', 690, 'EUR', 745, 'USD', strftime('%s', date('now', '-8 days')), 'Toiletries'),
      ('tx_personal_003', 'acc_main_checking', 'cat_personal', 'expense', 2990, 'EUR', 3149, 'USD', strftime('%s', date('now', '-29 days')), 'Gym day pass'),
      ('tx_personal_004', 'acc_main_checking', 'cat_personal', 'expense', 1590, 'EUR', 1743, 'USD', strftime('%s', date('now', '-31 days')), 'Skincare');

    ${PAST_MONTHS_TRANSACTIONS}

    INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note, transfer_id)
    VALUES
      ('tx_transfer_out_savings', 'acc_main_checking', NULL, 'transfer', -50000, 'EUR', 51200, 'USD', strftime('%s', date('now', '-4 days')), 'Monthly savings', 'tr_savings_001'),
      ('tx_transfer_in_savings', 'acc_savings', NULL, 'transfer', 50000, 'EUR', 51200, 'USD', strftime('%s', date('now', '-4 days')), 'Monthly savings', 'tr_savings_001');

    INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note, is_adjustment)
    VALUES
      ('tx_opening_savings', 'acc_savings', NULL, 'transfer', 250000, 'EUR', 262000, 'USD', strftime('%s', date('now', '-60 days')), NULL, 1);
  `);

  // Sample recurring rules
  await db.execAsync(`
    INSERT INTO recurring_rules (id, account_id, category_id, type, amount, currency, note, frequency, start_date, end_date, next_due_date, is_active)
    VALUES
      ('rule_salary', 'acc_main_checking', 'cat_salary', 'income', 920000, 'EUR', 'Monthly salary', 'monthly', strftime('%s', date('now', '-100 days')), NULL, strftime('%s', date('now', '-15 days')), 1);
  `);
}
