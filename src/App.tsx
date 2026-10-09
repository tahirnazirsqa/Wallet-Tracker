import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { ReportsPage } from './components/ReportsPage';
import { BudgetPage } from './components/BudgetPage';
import { CategoriesPage } from './components/CategoriesPage';
import { WalletsPage } from './components/WalletsPage';
import { AuthPage } from './components/AuthPage';
import { auth } from './lib/firebase';
import type { Page } from './types';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    setAuthLoading(false);
  }), []);

  useEffect(() => setPage('dashboard'), [user?.uid]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-500">Connecting securely…</p>
      </main>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <AppProvider key={user.uid} user={user}>
      <Layout page={page} setPage={setPage}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'transactions' && <TransactionsPage />}
        {page === 'reports' && <ReportsPage />}
        {page === 'budget' && <BudgetPage />}
        {page === 'categories' && <CategoriesPage />}
        {page === 'wallets' && <WalletsPage />}
      </Layout>
    </AppProvider>
  );
}
