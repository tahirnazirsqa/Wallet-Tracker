import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { ReportsPage } from './components/ReportsPage';
import { BudgetPage } from './components/BudgetPage';
import { CategoriesPage } from './components/CategoriesPage';
import { WalletsPage } from './components/WalletsPage';
import type { Page } from './types';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <AppProvider>
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
