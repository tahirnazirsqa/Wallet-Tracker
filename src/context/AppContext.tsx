import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';
import type { Category, Transaction, TxType, Wallet } from '../types';
import { storage } from '../lib/storage';
import { monthKey } from '../lib/format';

interface Toast {
  id: number;
  message: string;
  kind: 'success' | 'error';
}

interface AppState {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  budgets: Record<string, number>;
  theme: 'light' | 'dark';
  toasts: Toast[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addWallet: (name: string, provider: string, openingBalance: number) => string | null;
  deleteWallet: (id: string) => boolean;
  addCategory: (name: string, type: TxType) => void;
  renameCategory: (oldName: string, type: TxType, newName: string) => void;
  deleteCategory: (name: string, type: TxType) => boolean;
  setBudget: (key: string, amount: number) => void;
  toggleTheme: () => void;
  resetAll: () => void;
  toast: (message: string, kind?: Toast['kind']) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(storage.loadTransactions);
  const [wallets, setWallets] = useState<Wallet[]>(storage.loadWallets);
  const [customCats, setCustomCats] = useState<Category[]>(() =>
    storage.loadCategories().filter((c) => c.custom),
  );
  const [budgets, setBudgets] = useState<Record<string, number>>(storage.loadBudgets);
  const [theme, setTheme] = useState<'light' | 'dark'>(storage.loadTheme);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => storage.saveTransactions(transactions), [transactions]);
  useEffect(() => storage.saveWallets(wallets), [wallets]);
  useEffect(() => storage.saveCategories(customCats), [customCats]);
  useEffect(() => storage.saveBudgets(budgets), [budgets]);
  useEffect(() => {
    storage.saveTheme(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    setTransactions((prev) => [
      { ...tx, id: crypto.randomUUID(), createdAt: Date.now() },
      ...prev,
    ]);
  }, []);

  const updateTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addWallet = useCallback((name: string, provider: string, openingBalance: number): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const id = crypto.randomUUID();
    setWallets((prev) => [
      ...prev,
      { id, name: trimmed, provider, openingBalance, createdAt: Date.now() },
    ]);
    return id;
  }, []);

  const deleteWallet = useCallback((id: string): boolean => {
    if (transactions.some((tx) => tx.walletId === id || tx.transferToWalletId === id)) return false;
    setWallets((prev) => prev.filter((wallet) => wallet.id !== id));
    return true;
  }, [transactions]);

  const addCategory = useCallback((name: string, type: TxType) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustomCats((prev) =>
      prev.some((c) => c.name === trimmed && c.type === type)
        ? prev
        : [...prev, { name: trimmed, type, custom: true }],
    );
  }, []);

  const renameCategory = useCallback((oldName: string, type: TxType, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setCustomCats((prev) =>
      prev.map((c) => (c.name === oldName && c.type === type ? { ...c, name: trimmed } : c)),
    );
    setTransactions((prev) =>
      prev.map((t) => (t.category === oldName && t.type === type ? { ...t, category: trimmed } : t)),
    );
  }, []);

  const deleteCategory = useCallback(
    (name: string, type: TxType): boolean => {
      const inUse = transactions.some((t) => t.category === name && t.type === type);
      if (inUse) return false;
      setCustomCats((prev) => prev.filter((c) => !(c.name === name && c.type === type)));
      return true;
    },
    [transactions],
  );

  const setBudget = useCallback((key: string, amount: number) => {
    setBudgets((prev) => ({ ...prev, [key]: amount }));
  }, []);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const resetAll = useCallback(() => {
    storage.clearAll();
    setTransactions([]);
    setWallets([]);
    setCustomCats([]);
    setBudgets({});
  }, []);

  const categories = useMemo(() => {
    const defaults = storage.loadCategories().filter((c) => !c.custom);
    return [...defaults, ...customCats];
  }, [customCats]);

  const value: AppState = {
    transactions, wallets, categories, budgets, theme, toasts,
    addTransaction, updateTransaction, deleteTransaction,
    addWallet, deleteWallet,
    addCategory, renameCategory, deleteCategory,
    setBudget, toggleTheme, resetAll, toast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { monthKey };
