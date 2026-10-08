import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { fmtRs, monthKey, monthLabel, MONTH_NAMES } from '../lib/format';
import { Card, EmptyState } from './ui';
import { TransactionForm } from './TransactionForm';
import type { TxType } from '../types';

const DONUT_COLORS = ['#2e7d32', '#1976d2', '#ed6c02', '#6a1b9a', '#00838f', '#c2185b', '#5d4037', '#827717', '#455a64', '#000000'];

export function Dashboard() {
  const { transactions } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<TxType>('expense');
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date().toISOString().slice(0, 10)));

  const stats = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const mIncome = transactions.filter((t) => t.type === 'income' && monthKey(t.date) === selectedMonth)
      .reduce((s, t) => s + t.amount, 0);
    const mExpense = transactions.filter((t) => t.type === 'expense' && monthKey(t.date) === selectedMonth)
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense, mIncome, mExpense };
  }, [transactions, selectedMonth]);

  const monthlyChart = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const byDay = new Array(daysInMonth).fill(0);
    transactions
      .filter((t) => t.type === 'expense' && monthKey(t.date) === selectedMonth)
      .forEach((t) => { byDay[Number(t.date.slice(8, 10)) - 1] += t.amount; });
    return byDay.map((v, i) => ({ day: i + 1, amount: Math.round(v) }));
  }, [transactions, selectedMonth]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === 'expense' && monthKey(t.date) === selectedMonth)
      .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return [...map.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions, selectedMonth]);

  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 5),
    [transactions],
  );

  const openForm = (type: TxType) => { setDefaultType(type); setFormOpen(true); };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryCard label="Current Balance" value={fmtRs(stats.balance)} tone="brand" icon="💰" />
        <SummaryCard label="Total Income" value={fmtRs(stats.income)} tone="income" icon="⬆️" />
        <SummaryCard label="Total Expenses" value={fmtRs(stats.expense)} tone="expense" icon="⬇️" />
        <SummaryCard label="This Month's Income" value={fmtRs(stats.mIncome)} tone="income" icon="📅" />
        <SummaryCard label="This Month's Expenses" value={fmtRs(stats.mExpense)} tone="expense" icon="🗓️" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => openForm('expense')}>＋ Add Expense</button>
        <button className="btn-primary" onClick={() => openForm('income')}>＋ Add Income</button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Spending Overview</h2>
          <select
            className="input !w-auto"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, '0');
              return <option key={m} value={`${new Date().getFullYear()}-${m}`}>{MONTH_NAMES[i]} {new Date().getFullYear()}</option>;
            })}
          </select>
        </div>
        {monthlyChart.every((d) => d.amount === 0) ? (
          <EmptyState icon="📊" text={`No expenses recorded in ${monthLabel(selectedMonth)}.`} />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" width={60} />
                <Tooltip formatter={(v) => fmtRs(Number(v))} />
                <Line type="monotone" dataKey="amount" stroke="#2e7d32" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Top Categories — {monthLabel(selectedMonth)}</h2>
          {categoryData.length === 0 ? (
            <EmptyState icon="🏷️" text="No spending in this month yet." />
          ) : (
            <ul className="space-y-3">
              {categoryData.map((c, i) => {
                const total = categoryData.reduce((s, x) => s + x.value, 0) || 1;
                const pct = (c.value / total) * 100;
                return (
                  <li key={c.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        {c.name}
                      </span>
                      <span className="font-medium">{fmtRs(c.value)} <span className="text-slate-400">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Recent Transactions</h2>
          {recent.length === 0 ? (
            <EmptyState icon="🧾" text="No transactions yet. Add your first one above." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{t.category}</p>
                    <p className="text-xs text-slate-400">
                      {t.date}{t.description ? ` · ${t.description}` : ''}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-brand-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '−'}{fmtRs(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <TransactionForm open={formOpen} onClose={() => setFormOpen(false)} defaultType={defaultType} />
    </div>
  );
}

function SummaryCard({ label, value, tone, icon }: { label: string; value: string; tone: 'brand' | 'income' | 'expense'; icon: string }) {
  const tones = {
    brand: 'from-brand-500 to-brand-700 text-white',
    income: 'from-emerald-500 to-emerald-700 text-white',
    expense: 'from-red-500 to-red-700 text-white',
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br p-4 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-90">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
