import type { Category, Transaction, Wallet } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Food', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Bills', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Education', type: 'expense' },
  { name: 'Health', type: 'expense' },
  { name: 'Rent', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Family', type: 'expense' },
  { name: 'Other', type: 'expense' },
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Business', type: 'income' },
  { name: 'Gift', type: 'income' },
  { name: 'Other', type: 'income' },
];

const TX_KEY = 'wt_transactions';
const CAT_KEY = 'wt_categories';
const BUDGET_KEY = 'wt_budgets';
const THEME_KEY = 'wt_theme';
const WALLET_KEY = 'wt_wallets';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveCollection<T>(key: string, value: T[], isEmpty: (items: T[]) => boolean = (items) => items.length === 0) {
  if (isEmpty(value)) {
    localStorage.removeItem(key);
    return;
  }
  save(key, value);
}

export const storage = {
  loadTransactions: (): Transaction[] => load<Transaction[]>(TX_KEY, []),
  saveTransactions: (txs: Transaction[]) => saveCollection(TX_KEY, txs),

  loadWallets: (): Wallet[] => load<Wallet[]>(WALLET_KEY, []),
  saveWallets: (wallets: Wallet[]) => saveCollection(WALLET_KEY, wallets),

  loadCategories: (): Category[] => {
    const custom = load<Category[]>(CAT_KEY, []);
    return [...DEFAULT_CATEGORIES, ...custom];
  },
  saveCategories: (cats: Category[]) => saveCollection(CAT_KEY, cats),

  loadBudgets: (): Record<string, number> => load<Record<string, number>>(BUDGET_KEY, {}),
  saveBudgets: (b: Record<string, number>) => saveCollection(BUDGET_KEY, Object.entries(b), (entries) => entries.length === 0),

  loadTheme: (): 'light' | 'dark' => load<'light' | 'dark'>(THEME_KEY, 'light'),
  saveTheme: (t: 'light' | 'dark') => save(THEME_KEY, t),

  clearAll: () => {
    localStorage.removeItem(TX_KEY);
    localStorage.removeItem(CAT_KEY);
    localStorage.removeItem(BUDGET_KEY);
    localStorage.removeItem(WALLET_KEY);
  },
};
