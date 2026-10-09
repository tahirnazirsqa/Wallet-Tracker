import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  useRef, type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { Category, Transaction, TxType, Wallet } from '../types';
import { storage } from '../lib/storage';
import { monthKey } from '../lib/format';
import {
  clearUserData,
  deleteCategory as removeCloudCategory,
  deleteTransaction as removeCloudTransaction,
  deleteWallet as removeCloudWallet,
  loadOrMigrateUserData,
  saveBudget as saveCloudBudget,
  saveCategory as saveCloudCategory,
  saveTransaction as saveCloudTransaction,
  saveWallet as saveCloudWallet,
  subscribeUserData,
} from '../lib/cloudStorage';

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
  userEmail: string | null;
  signOut: () => Promise<void>;
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
  resetAll: () => Promise<void>;
  toast: (message: string, kind?: Toast['kind']) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children, user }: { children: ReactNode; user: User }) {
  const [transactions, setTransactions] = useState<Transaction[]>(storage.loadTransactions);
  const [wallets, setWallets] = useState<Wallet[]>(storage.loadWallets);
  const [customCats, setCustomCats] = useState<Category[]>(() =>
    storage.loadCategories().filter((c) => c.custom),
  );
  const [budgets, setBudgets] = useState<Record<string, number>>(storage.loadBudgets);
  const [theme, setTheme] = useState<'light' | 'dark'>(storage.loadTheme);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const cloudReady = useRef(false);

  const toast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const persistCloud = useCallback((operation: () => Promise<unknown>) => {
    if (!cloudReady.current) return;
    void operation().catch((error: unknown) => {
      console.error('Could not sync Wallet Tracker data with Firebase', error);
      toast('Could not sync changes to Firebase. Check your connection and try again.', 'error');
    });
  }, [toast]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    let loadingTimeout: ReturnType<typeof setTimeout>;
    cloudReady.current = false;
    setDataLoaded(false);
    setLoadError('');
    loadingTimeout = setTimeout(() => {
      if (active) {
        setLoadError(
          'Firebase is taking too long to respond. Confirm Firestore is created, its security rules are published, and your network can reach Firebase.',
        );
      }
    }, 12000);

    const localData = {
      transactions: storage.loadTransactions(),
      wallets: storage.loadWallets(),
      categories: storage.loadCategories().filter((category) => category.custom),
      budgets: storage.loadBudgets(),
    };

    void loadOrMigrateUserData(user.uid, localData).then((cloudData) => {
      if (!active) return;
      clearTimeout(loadingTimeout);
      setTransactions(cloudData.transactions);
      setWallets(cloudData.wallets);
      setCustomCats(cloudData.categories);
      setBudgets(cloudData.budgets);
      cloudReady.current = true;
      setDataLoaded(true);
      unsubscribe = subscribeUserData(user.uid, {
        onTransactions: setTransactions,
        onWallets: setWallets,
        onCategories: setCustomCats,
        onBudgets: setBudgets,
        onError: (error) => {
          console.error('Firebase data subscription failed', error);
          toast('Could not sync the latest Firebase data.', 'error');
        },
      });
    }).catch((error: unknown) => {
      if (!active) return;
      clearTimeout(loadingTimeout);
      console.error('Could not load Wallet Tracker data from Firebase', error);
      setLoadError('Your cloud data could not be loaded. Check your connection and Firestore security rules, then retry.');
    });

    return () => {
      active = false;
      clearTimeout(loadingTimeout);
      cloudReady.current = false;
      unsubscribe?.();
    };
  }, [user.uid, loadAttempt, toast]);

  useEffect(() => { if (dataLoaded) storage.saveTransactions(transactions); }, [transactions, dataLoaded]);
  useEffect(() => { if (dataLoaded) storage.saveWallets(wallets); }, [wallets, dataLoaded]);
  useEffect(() => { if (dataLoaded) storage.saveCategories(customCats); }, [customCats, dataLoaded]);
  useEffect(() => { if (dataLoaded) storage.saveBudgets(budgets); }, [budgets, dataLoaded]);
  useEffect(() => {
    storage.saveTheme(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const transaction = { ...tx, id: crypto.randomUUID(), createdAt: Date.now() };
    setTransactions((prev) => [transaction, ...prev]);
    persistCloud(() => saveCloudTransaction(user.uid, transaction));
  }, [persistCloud, user.uid]);

  const updateTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
    persistCloud(() => saveCloudTransaction(user.uid, tx));
  }, [persistCloud, user.uid]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    persistCloud(() => removeCloudTransaction(user.uid, id));
  }, [persistCloud, user.uid]);

  const addWallet = useCallback((name: string, provider: string, openingBalance: number): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const id = crypto.randomUUID();
    const wallet = { id, name: trimmed, provider, openingBalance, createdAt: Date.now() };
    setWallets((prev) => [...prev, wallet]);
    persistCloud(() => saveCloudWallet(user.uid, wallet));
    return id;
  }, [persistCloud, user.uid]);

  const deleteWallet = useCallback((id: string): boolean => {
    if (transactions.some((tx) => tx.walletId === id || tx.transferToWalletId === id)) return false;
    setWallets((prev) => prev.filter((wallet) => wallet.id !== id));
    persistCloud(() => removeCloudWallet(user.uid, id));
    return true;
  }, [persistCloud, transactions, user.uid]);

  const addCategory = useCallback((name: string, type: TxType) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (customCats.some((category) => category.name === trimmed && category.type === type)) return;
    const category = { name: trimmed, type, custom: true };
    setCustomCats((prev) => [...prev, category]);
    persistCloud(() => saveCloudCategory(user.uid, category));
  }, [customCats, persistCloud, user.uid]);

  const renameCategory = useCallback((oldName: string, type: TxType, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setCustomCats((prev) =>
      prev.map((c) => (c.name === oldName && c.type === type ? { ...c, name: trimmed } : c)),
    );
    const oldCategory = { name: oldName, type, custom: true };
    const newCategory = { name: trimmed, type, custom: true };
    persistCloud(() => removeCloudCategory(user.uid, oldCategory));
    persistCloud(() => saveCloudCategory(user.uid, newCategory));
    const updatedTransactions = transactions
      .filter((transaction) => transaction.category === oldName && transaction.type === type)
      .map((transaction) => ({ ...transaction, category: trimmed }));
    setTransactions((prev) =>
      prev.map((transaction) => updatedTransactions.find((updated) => updated.id === transaction.id) ?? transaction),
    );
    updatedTransactions.forEach((transaction) =>
      persistCloud(() => saveCloudTransaction(user.uid, transaction)),
    );
  }, [persistCloud, transactions, user.uid]);

  const deleteCategory = useCallback(
    (name: string, type: TxType): boolean => {
      const inUse = transactions.some((t) => t.category === name && t.type === type);
      if (inUse) return false;
      setCustomCats((prev) => prev.filter((c) => !(c.name === name && c.type === type)));
      persistCloud(() => removeCloudCategory(user.uid, { name, type, custom: true }));
      return true;
    },
    [persistCloud, transactions, user.uid],
  );

  const setBudget = useCallback((key: string, amount: number) => {
    setBudgets((prev) => ({ ...prev, [key]: amount }));
    persistCloud(() => saveCloudBudget(user.uid, key, amount));
  }, [persistCloud, user.uid]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    storage.clearAll();
  }, []);

  const resetAll = useCallback(async () => {
    await clearUserData(user.uid);
    storage.clearAll();
    setTransactions([]);
    setWallets([]);
    setCustomCats([]);
    setBudgets({});
  }, [user.uid]);

  const categories = useMemo(() => {
    const defaults = storage.loadCategories().filter((c) => !c.custom);
    return [...defaults, ...customCats];
  }, [customCats]);

  const value: AppState = {
    transactions, wallets, categories, budgets, theme, toasts,
    userEmail: user.email,
    signOut,
    addTransaction, updateTransaction, deleteTransaction,
    addWallet, deleteWallet,
    addCategory, renameCategory, deleteCategory,
    setBudget, toggleTheme, resetAll, toast,
  };

  if (!dataLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <section className="card w-full max-w-md p-6 text-center">
          <h1 className="text-xl font-bold">Wallet Tracker</h1>
          {loadError ? (
            <>
              <p role="alert" className="mt-3 text-sm text-red-600">{loadError}</p>
              <div className="mt-5 flex justify-center gap-2">
                <button className="btn-ghost" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry</button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    void signOut().catch((error: unknown) => {
                      console.error('Could not sign out of Firebase', error);
                      setLoadError('Could not sign out. Check your connection and try again.');
                    });
                  }}
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Loading your secure cloud data…</p>
          )}
        </section>
      </main>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { monthKey };
