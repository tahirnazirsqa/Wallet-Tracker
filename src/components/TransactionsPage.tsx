import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmtRs2 } from '../lib/format';
import { Card, ConfirmDialog, EmptyState } from './ui';
import { TransactionForm } from './TransactionForm';
import type { Transaction } from '../types';

type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest';

export function TransactionsPage() {
  const { transactions, deleteTransaction, toast } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
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
      list = list.filter((t) =>
        t.category.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') list = list.filter((t) => t.type === typeFilter);
    if (catFilter !== 'all') list = list.filter((t) => t.category === catFilter);
    if (monthFilter !== 'all') list = list.filter((t) => t.date.startsWith(monthFilter));
    switch (sort) {
      case 'newest': list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt); break;
      case 'oldest': list.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt); break;
      case 'highest': list.sort((a, b) => b.amount - a.amount); break;
      case 'lowest': list.sort((a, b) => a.amount - b.amount); break;
    }
    return list;
  }, [transactions, search, typeFilter, catFilter, monthFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cats = useMemo(() => [...new Set(transactions.map((t) => t.category))].sort(), [transactions]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <input
            className="input col-span-2 md:col-span-1"
            placeholder="Search description or category…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="input" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1); }}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="input" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="all">All categories</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}>
            <option value="all">All months</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
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
                  <th className="th">Description</th><th className="th text-right">Amount</th><th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="td whitespace-nowrap">{t.date}</td>
                    <td className="td">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        t.type === 'income'
                          ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="td">{t.category}</td>
                    <td className="td text-slate-500 dark:text-slate-400">{t.description || '—'}</td>
                    <td className={`td text-right font-semibold ${t.type === 'income' ? 'text-brand-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '−'}{fmtRs2(t.amount)}
                    </td>
                    <td className="td whitespace-nowrap text-right">
                      <button className="mr-2 text-slate-400 hover:text-brand-600" title="Edit" onClick={() => setEditing(t)}>✏️</button>
                      <button className="text-slate-400 hover:text-red-600" title="Delete" onClick={() => setDeleting(t)}>🗑</button>
                    </td>
                  </tr>
                ))}
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

      <TransactionForm open={!!editing} onClose={() => setEditing(null)} editing={editing} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) { deleteTransaction(deleting.id); toast('Transaction deleted'); }
          setDeleting(null);
        }}
        title="Delete transaction?"
        message={deleting ? `Delete this ${deleting.type} of ${fmtRs2(deleting.amount)} from ${deleting.category}? This cannot be undone.` : ''}
      />
    </div>
  );
}
