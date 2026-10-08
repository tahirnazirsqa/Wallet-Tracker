import { useState, type FormEvent } from 'react';
import type { Transaction, TxType } from '../types';
import { useApp } from '../context/AppContext';
import { todayISO } from '../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Transaction | null;
  defaultType?: TxType;
}

export function TransactionForm({ open, onClose, editing, defaultType = 'expense' }: Props) {
  const { categories, addTransaction, updateTransaction, toast } = useApp();
  const [type, setType] = useState<TxType>(editing?.type ?? defaultType);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [category, setCategory] = useState(editing?.category ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cats = categories.filter((c) => c.type === type);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = 'Amount must be greater than 0';
    if (!category) errs.category = 'Category is required';
    if (!date) errs.date = 'Date is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = { type, amount: amt, category, description: description.trim(), date };
    if (editing) {
      updateTransaction({ ...editing, ...payload });
      toast('Transaction updated');
    } else {
      addTransaction(payload);
      toast('Transaction saved');
    }
    setAmount(''); setCategory(''); setDescription(''); setDate(todayISO());
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 ${open ? '' : 'hidden'}`}
      onClick={onClose}>
      <div className="card w-full max-w-md p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <h3 className="font-semibold">{editing ? 'Edit Transaction' : 'Add Transaction'}</h3>
          <button onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-600">×</button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(['expense', 'income'] as TxType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategory(''); }}
                className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${
                  type === t
                    ? t === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-brand-600 text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="label">Amount (Rs)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
          </div>

          <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              {cats.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>

          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <input className="input" type="text" placeholder="e.g. Dinner with family"
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary w-full">
            {editing ? 'Save Changes' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
