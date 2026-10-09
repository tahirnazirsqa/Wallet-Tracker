import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Page } from '../types';
import { Toasts } from './ui';

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'transactions', label: 'Transactions', icon: '🧾' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'budget', label: 'Budget', icon: '🎯' },
  { id: 'categories', label: 'Categories', icon: '🏷️' },
  { id: 'wallets', label: 'Wallets & Accounts', icon: '👛' },
];

export function Layout({ page, setPage, children }: {
  page: Page;
  setPage: (p: Page) => void;
  children: React.ReactNode;
}) {
  const { theme, toggleTheme, toasts, resetAll, toast } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetAcknowledged, setResetAcknowledged] = useState(false);

  const go = (p: Page) => {
    setPage(p);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h1 className="text-lg font-bold">Wallet Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost !px-3" title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setMenuOpen(true)} className="btn-ghost !px-3" title="Open menu">☰</button>
          </div>
        </div>
      </header>

      <aside className={`fixed right-0 top-0 z-40 flex h-full w-64 flex-col transform border-l border-slate-200 bg-white p-4 shadow-xl transition-transform dark:border-slate-800 dark:bg-slate-900 ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Menu</h2>
          <button onClick={() => setMenuOpen(false)} className="text-xl text-slate-400">×</button>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                page === n.id
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            onClick={() => { setConfirmReset(true); setMenuOpen(false); }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            ⚠️ Reset all data
          </button>
        </div>
        <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Developer</p>
          <p className="mt-1 text-sm font-medium">Tahir Nazir</p>
          <a
            href="mailto:tahirnazir.sqa@gmail.com"
            className="text-sm text-brand-600 hover:underline dark:text-brand-400"
          >
            tahirnazir.sqa@gmail.com
          </a>
        </div>
      </aside>
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setMenuOpen(false)} />
      )}

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmReset(false)}>
          <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 font-semibold text-red-600">Reset all data?</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              This permanently deletes all transactions, wallets, budgets, and custom categories stored in this browser.
            </p>
            <label className="mb-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={resetAcknowledged}
                onChange={(e) => setResetAcknowledged(e.target.checked)}
              />
              I understand this cannot be undone
            </label>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => { setConfirmReset(false); setResetAcknowledged(false); }}>Cancel</button>
              <button
                className="btn-danger"
                disabled={!resetAcknowledged}
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                  setResetAcknowledged(false);
                  toast('All data reset');
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}
