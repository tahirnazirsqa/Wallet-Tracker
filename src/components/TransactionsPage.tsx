import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmtRs2 } from '../lib/format';
import { Card, ConfirmDialog, EmptyState } from './ui';
import { TransactionForm } from './TransactionForm';
import type { Transaction } from '../types';

type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest';

export function TransactionsPage() {
  const { transactions, wallets, deleteTransaction, toast } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer' | 'withdrawal'>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const PAGE_SIZE = 10;

  const months = useMemo(
    () => [...new Set(transactions.map((t) => t.date.slice(0, 7)))].sort().reverse(),
    [transactions],
  );

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const walletName = wallets.find((wallet) => wallet.id === t.walletId)?.name ?? '';
        const destinationName = wallets.find((wallet) => wallet.id === t.transferToWalletId)?.name ?? '';
        return t.category.toLowerCase().includes(q)
          || t.description.toLowerCase().includes(q)
          || walletName.toLowerCase().includes(q)
          || destinationName.toLowerCase().includes(q);
      });
    }
    if (typeFilter !== 'all') list = list.filter((t) => t.type === typeFilter);
    if (catFilter !== 'all') list = list.filter((t) => t.category === catFilter);
    if (monthFilter !== 'all') list = list.filter((t) => t.date.startsWith(monthFilter));
    if (walletFilter === 'unassigned') list = list.filter((t) => !t.walletId);
    else if (walletFilter !== 'all') list = list.filter((t) => t.walletId === walletFilter || t.transferToWalletId === walletFilter);
    switch (sort) {
      case 'newest': list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt); break;
      case 'oldest': list.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt); break;
      case 'highest': list.sort((a, b) => b.amount - a.amount); break;
      case 'lowest': list.sort((a, b) => a.amount - b.amount); break;
    }
    return list;
  }, [transactions, wallets, search, typeFilter, catFilter, monthFilter, walletFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cats = useMemo(() => [...new Set(transactions.map((t) => t.category))].sort(), [transactions]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <input
            className="input col-span-2 md:col-span-2"
            placeholder="Search category, account, or description…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="input" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1); }}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
          <select className="input" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="all">All categories</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}>
            <option value="all">All months</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input" value={walletFilter} onChange={(e) => { setWalletFilter(e.target.value); setPage(1); }}>
            <option value="all">All accounts</option>
            <option value="unassigned">Unassigned</option>
            {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest amount</option>
            <option value="lowest">Lowest amount</option>
          </select>
        </div>
      </Card>

      <Card>
        {pageItems.length === 0 ? (
          <EmptyState icon="🧾" text="No transactions match your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="th">Date</th><th className="th">Type</th><th className="th">Category</th>
                  <th className="th">Account</th><th className="th">Description</th><th className="th text-right">Amount</th><th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((t) => {
                  const sourceWallet = wallets.find((wallet) => wallet.id === t.walletId);
                  const destinationWallet = wallets.find((wallet) => wallet.id === t.transferToWalletId);
                  return (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="td whitespace-nowrap">{t.date}</td>
                    <td className="td">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        t.type === 'income'
                          ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
                          : t.type === 'transfer'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
                            : t.type === 'withdrawal'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="td">{t.category}</td>
                    <td className="td">
                      {t.type === 'transfer' || t.type === 'withdrawal'
                        ? `${sourceWallet?.name ?? 'Account'} → ${destinationWallet?.name ?? 'Account'}`
                        : sourceWallet?.name ?? 'Unassigned'}
                    </td>
                    <td className="td text-slate-500 dark:text-slate-400">{t.description || '—'}</td>
                    <td className={`td text-right font-semibold ${
                      t.type === 'income' ? 'text-brand-600'
                        : t.type === 'transfer' ? 'text-sky-600'
                          : t.type === 'withdrawal' ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      {t.type === 'transfer' ? '↔ ' : t.type === 'withdrawal' ? '↓ ' : t.type === 'income' ? '+' : '−'}{fmtRs2(t.amount)}
                    </td>
                    <td className="td whitespace-nowrap text-right">
                      <button className="mr-2 text-slate-400 hover:text-brand-600" title="Edit" onClick={() => setEditing(t)}>✏️</button>
                      <button className="text-slate-400 hover:text-red-600" title="Delete" onClick={() => setDeleting(t)}>🗑</button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages} · {filtered.length} transactions
          </p>
          <div className="flex gap-2">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
            <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next ›</button>
          </div>
        </div>
      </Card>

      <TransactionForm key={editing?.id ?? 'new'} open={!!editing} onClose={() => setEditing(null)} editing={editing} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) { deleteTransaction(deleting.id); toast('Transaction deleted'); }
          setDeleting(null);
        }}
        title="Delete transaction?"
        message={deleting ? `Delete this ${deleting.type === 'transfer' ? 'transfer' : deleting.type === 'withdrawal' ? 'withdrawal' : deleting.type} of ${fmtRs2(deleting.amount)} from ${deleting.category}? This cannot be undone.` : ''}
      />
    </div>
  );
}
