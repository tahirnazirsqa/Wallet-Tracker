import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { fmtRs, monthKey, monthLabel, MONTH_NAMES } from '../lib/format';
import { Card, EmptyState } from './ui';

const DONUT_COLORS = ['#2e7d32', '#1976d2', '#ed6c02', '#6a1b9a', '#00838f', '#c2185b', '#5d4037', '#827717', '#455a64', '#000000'];

export function ReportsPage() {
  const { transactions } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const key = `${year}-${String(month).padStart(2, '0')}`;

  const data = useMemo(() => {
    const txs = transactions.filter((t) => monthKey(t.date) === key);
    const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const byCat = new Map<string, number>();
    txs.filter((t) => t.type === 'expense').forEach((t) => byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount));
    const catData = [...byCat.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);

    const daysInMonth = new Date(year, month, 0).getDate();
    const daily = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, amount: 0 }));
    txs.filter((t) => t.type === 'expense')
      .forEach((t) => { daily[Number(t.date.slice(8, 10)) - 1].amount += t.amount; });

    return { txs, income, expense, net: income - expense, catData, daily };
  }, [transactions, key]);

  const years = useMemo(() => {
    const set = new Set(transactions.map((t) => Number(t.date.slice(0, 4))));
    set.add(now.getFullYear());
    return [...set].sort().reverse();
  }, [transactions]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Month</label>
            <select className="input !w-40" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select className="input !w-32" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <h2 className="ml-auto text-lg font-semibold">{monthLabel(key)}</h2>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Income" value={fmtRs(data.income)} tone="text-brand-600" />
        <StatCard label="Total Expenses" value={fmtRs(data.expense)} tone="text-red-500" />
        <StatCard label="Net Savings" value={fmtRs(data.net)} tone={data.net >= 0 ? 'text-brand-600' : 'text-red-500'} />
        <StatCard label="Transactions" value={String(data.txs.length)} tone="text-slate-700 dark:text-slate-200" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Expense by Category</h2>
          {data.catData.length === 0 ? (
            <EmptyState icon="🥧" text="No expenses in this month." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.catData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {data.catData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtRs(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Income vs Expenses</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: monthLabel(key), Income: Math.round(data.income), Expenses: Math.round(data.expense) }]} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" width={60} />
                <Tooltip formatter={(v) => fmtRs(Number(v))} />
                <Legend />
                <Bar dataKey="Income" fill="#2e7d32" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Daily Spending</h2>
        {data.daily.every((d) => d.amount === 0) ? (
          <EmptyState icon="📈" text="No daily expenses in this month." />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" width={60} />
                <Tooltip formatter={(v) => fmtRs(Number(v))} />
                <Line type="monotone" dataKey="amount" stroke="#ed6c02" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
