import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmtRs, monthKey, monthLabel, MONTH_NAMES } from '../lib/format';
import { Card, ProgressBar } from './ui';

export function BudgetPage() {
  const { transactions, budgets, setBudget, toast } = useApp();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(monthKey(now.toISOString().slice(0, 10)));
  const [amount, setAmount] = useState('');

  const spent = useMemo(
    () => transactions
      .filter((t) => t.type === 'expense' && monthKey(t.date) === selectedMonth)
      .reduce((s, t) => s + t.amount, 0),
    [transactions, selectedMonth],
  );

  const budget = budgets[selectedMonth] ?? 0;
  const remaining = budget - spent;
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const exceeded = budget > 0 && spent > budget;

  const save = () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      toast('Enter a valid budget amount', 'error');
      return;
    }
    setBudget(selectedMonth, amt);
    setAmount('');
    toast(`Budget for ${monthLabel(selectedMonth)} set to ${fmtRs(amt)}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Month</label>
            <select className="input !w-44" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, '0');
                return <option key={m} value={`${now.getFullYear()}-${m}`}>{MONTH_NAMES[i]} {now.getFullYear()}</option>;
              })}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Monthly Budget — {monthLabel(selectedMonth)}</h2>
        {budget === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">No budget set for this month yet.</p>
            <div className="flex gap-2">
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Budget amount (Rs)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button className="btn-primary" onClick={save}>Set Budget</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Budget</p>
                <p className="text-lg font-bold">{fmtRs(budget)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Spent</p>
                <p className="text-lg font-bold text-red-500">{fmtRs(spent)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Remaining</p>
                <p className={`text-lg font-bold ${remaining >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
                  {fmtRs(Math.abs(remaining))}
                </p>
              </div>
            </div>
            <ProgressBar pct={pct} />
            <p className="text-sm text-slate-500 dark:text-slate-400">{pct.toFixed(0)}% of budget used</p>
            {exceeded && (
              <p className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 dark:bg-red-950/40">
                ⚠️ Budget exceeded by {fmtRs(Math.abs(remaining))}
              </p>
            )}
            <div className="flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="New budget amount (Rs)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button className="btn-primary" onClick={save}>Update</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
