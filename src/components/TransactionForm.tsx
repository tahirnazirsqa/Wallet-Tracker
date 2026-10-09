import { useMemo, useState, type FormEvent } from 'react';
import type { Transaction, TransactionType } from '../types';
import { useApp } from '../context/AppContext';
import { fmtRs2, todayISO } from '../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Transaction | null;
  defaultType?: TransactionType;
}

export function TransactionForm({ open, onClose, editing, defaultType = 'expense' }: Props) {
  const { categories, wallets, transactions, addWallet, addTransaction, updateTransaction, toast } = useApp();
  const [type, setType] = useState<TransactionType>(editing?.type ?? defaultType);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [category, setCategory] = useState(editing?.category ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [walletId, setWalletId] = useState(editing?.walletId ?? '');
  const [transferToWalletId, setTransferToWalletId] = useState(
    editing?.transferToWalletId
      ?? (defaultType === 'withdrawal'
        ? wallets.find((wallet) => wallet.provider.trim().toLowerCase() === 'cash')?.id ?? ''
        : ''),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cats = type === 'transfer' || type === 'withdrawal' ? [] : categories.filter((c) => c.type === type);
  const cashWallets = wallets.filter((wallet) => wallet.provider.trim().toLowerCase() === 'cash');
  const availableBalance = useMemo(() => {
    const wallet = wallets.find((item) => item.id === walletId);
    if (!wallet) return null;

    const balance = transactions.reduce((total, tx) => {
      if (tx.type === 'transfer' || tx.type === 'withdrawal') {
        return total
          + (tx.walletId === walletId ? -tx.amount : 0)
          + (tx.transferToWalletId === walletId ? tx.amount : 0);
      }
      if (tx.walletId !== walletId) return total;
      return total + (tx.type === 'income' ? tx.amount : -tx.amount);
    }, wallet.openingBalance);

    if (!editing) return balance;
    const previousEffect = editing.type === 'transfer' || editing.type === 'withdrawal'
      ? (editing.walletId === walletId ? -editing.amount : 0)
        + (editing.transferToWalletId === walletId ? editing.amount : 0)
      : editing.walletId === walletId
        ? editing.type === 'income' ? editing.amount : -editing.amount
        : 0;
    return balance - previousEffect;
  }, [wallets, transactions, walletId, editing]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = 'Amount must be greater than 0';
    if (type !== 'transfer' && type !== 'withdrawal' && !category) errs.category = 'Category is required';
    if ((wallets.length > 0 || type === 'income') && !walletId) {
      errs.walletId = type === 'income'
        ? wallets.length > 0
          ? 'Select the wallet or account receiving this income'
          : 'Add a wallet or account before recording income'
        : 'Wallet or account is required';
    }
    if (type === 'withdrawal' && !walletId) {
      errs.walletId = wallets.some((wallet) => wallet.provider.trim().toLowerCase() !== 'cash')
        ? 'Choose the wallet to withdraw from'
        : 'Add a non-Cash wallet before recording a withdrawal';
    }
    if (type === 'withdrawal' && walletId && !wallets.some(
      (wallet) => wallet.id === walletId && wallet.provider.trim().toLowerCase() !== 'cash',
    )) errs.walletId = 'Choose a non-Cash wallet to withdraw from';
    if (type === 'withdrawal' && walletId && availableBalance !== null
      && Number.isFinite(amt) && amt > availableBalance + Number.EPSILON) {
      errs.amount = `Withdrawal cannot exceed the available balance of ${fmtRs2(Math.max(0, availableBalance))}.`;
    }
    if (type === 'transfer') {
      if (!transferToWalletId) errs.transferToWalletId = 'Choose a destination account';
      else if (walletId && walletId === transferToWalletId) errs.transferToWalletId = 'Choose a different destination account';
      if (wallets.length < 2) errs.transferToWalletId = 'Add at least two wallets to record a transfer';
    }
    if (type === 'withdrawal' && cashWallets.some((wallet) => wallet.id !== walletId) && !transferToWalletId) {
      errs.transferToWalletId = 'Choose the Cash account to add the withdrawal to';
    }
    if (type === 'withdrawal' && transferToWalletId === walletId && transferToWalletId) {
      errs.transferToWalletId = 'Choose a Cash account different from the source wallet';
    }
    if (!date) errs.date = 'Date is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    let destinationWalletId = type === 'transfer' || type === 'withdrawal' ? transferToWalletId : undefined;
    if (type === 'withdrawal' && !destinationWalletId) {
      const names = new Set(wallets.map((wallet) => wallet.name.toLowerCase()));
      let cashName = 'Cash';
      let suffix = 2;
      while (names.has(cashName.toLowerCase())) cashName = `Cash ${suffix++}`;
      destinationWalletId = addWallet(cashName, 'Cash', 0) ?? undefined;
      if (!destinationWalletId) {
        toast('Could not create a Cash account for this withdrawal', 'error');
        return;
      }
    }

    const payload = {
      type,
      amount: amt,
      category: type === 'transfer' ? 'Transfer' : type === 'withdrawal' ? 'Withdrawal' : category,
      description: description.trim(),
      date,
      walletId: walletId || undefined,
      transferToWalletId: destinationWalletId,
    };
    if (editing) {
      updateTransaction({ ...editing, ...payload });
      toast('Transaction updated');
    } else {
      addTransaction(payload);
      toast(type === 'transfer' ? 'Transfer recorded' : type === 'withdrawal' ? 'Withdrawal recorded and added to Cash' : 'Transaction saved');
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
            {(['expense', 'income', 'transfer', 'withdrawal'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategory('');
                  if (t === 'withdrawal') {
                    const sourceWallet = wallets.find((wallet) => wallet.provider.trim().toLowerCase() !== 'cash');
                    setWalletId(sourceWallet?.id ?? '');
                    if (!cashWallets.some((wallet) => wallet.id === transferToWalletId)) {
                      setTransferToWalletId(cashWallets[0]?.id ?? '');
                    }
                  }
                }}
                className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${
                  type === t
                    ? t === 'expense'
                      ? 'bg-red-600 text-white'
                      : t === 'income'
                        ? 'bg-brand-600 text-white'
                        : t === 'transfer' ? 'bg-sky-600 text-white' : 'bg-amber-600 text-white'
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

          {type !== 'transfer' && type !== 'withdrawal' && <div>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              {cats.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>}

          <div>
            <label className="label">
              {type === 'withdrawal'
                ? 'Withdraw from'
                : type === 'income' ? 'Deposit income into' : 'Wallet or account'}
            </label>
            <select className="input" value={walletId} onChange={(e) => {
              const sourceId = e.target.value;
              setWalletId(sourceId);
              if (sourceId === transferToWalletId) setTransferToWalletId('');
            }}>
              {wallets.length > 0 && <option value="">Select wallet or account</option>}
              {wallets.length === 0 && <option value="">No wallet selected</option>}
              {editing && !editing.walletId && <option value="">Unassigned</option>}
              {wallets.filter((wallet) => type !== 'withdrawal' || wallet.provider.trim().toLowerCase() !== 'cash').map((wallet) => (
                <option key={wallet.id} value={wallet.id}>{wallet.name} · {wallet.provider}</option>
              ))}
            </select>
            {errors.walletId && <p className="mt-1 text-xs text-red-500">{errors.walletId}</p>}
            {type === 'income' && wallets.length === 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Add a wallet or account before recording income.
              </p>
            )}
            {type === 'withdrawal' && availableBalance !== null && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Available balance: {fmtRs2(Math.max(0, availableBalance))}
              </p>
            )}
          </div>

          {(type === 'transfer' || type === 'withdrawal') && (
            <div>
              <label className="label">{type === 'withdrawal' ? 'Add cash to' : 'Transfer to'}</label>
              <select
                className="input"
                value={transferToWalletId}
                onChange={(e) => setTransferToWalletId(e.target.value)}
              >
                <option value="">
                  {type === 'withdrawal' && cashWallets.length === 0
                    ? 'Create a Cash account automatically'
                    : type === 'withdrawal' ? 'Select Cash account' : 'Select destination account'}
                </option>
                {wallets.filter((wallet) => wallet.id !== walletId
                  && (type !== 'withdrawal' || wallet.provider.trim().toLowerCase() === 'cash')).map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>{wallet.name} · {wallet.provider}</option>
                ))}
              </select>
              {errors.transferToWalletId && <p className="mt-1 text-xs text-red-500">{errors.transferToWalletId}</p>}
              {type === 'withdrawal' && cashWallets.length === 0 && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  A Cash account will be created automatically if you don’t already have one.
                </p>
              )}
            </div>
          )}

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
            {editing ? 'Save Changes' : type === 'transfer' ? 'Record Transfer' : type === 'withdrawal' ? 'Withdraw to Cash' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
