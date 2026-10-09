import { useMemo, useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import type { WalletProvider } from '../types';
import { fmtRs } from '../lib/format';
import { Card, ConfirmDialog, EmptyState } from './ui';

const PROVIDERS: WalletProvider[] = ['Cash', 'JazzCash', 'Easypaisa', 'Bank account', 'Other'];

export function WalletsPage() {
  const { wallets, transactions, addWallet, deleteWallet, toast } = useApp();
  const [provider, setProvider] = useState<WalletProvider | 'custom'>('JazzCash');
  const [customProvider, setCustomProvider] = useState('');
  const [name, setName] = useState('JazzCash');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const balances = useMemo(() => wallets.map((wallet) => {
    const activity = transactions
      .filter((tx) => tx.walletId === wallet.id || tx.transferToWalletId === wallet.id)
      .reduce((balance, tx) => {
        if (tx.type === 'transfer' || tx.type === 'withdrawal') {
          return balance + (tx.walletId === wallet.id ? -tx.amount : tx.amount);
        }
        if (tx.walletId !== wallet.id) return balance;
        return balance + (tx.type === 'income' ? tx.amount : -tx.amount);
      }, 0);
    return { wallet, balance: wallet.openingBalance + activity };
  }), [wallets, transactions]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    const providerName = provider === 'custom' ? customProvider.trim() : provider;
    const amount = Number(openingBalance);
    if (!trimmed) {
      setError('Enter a name for this wallet or account.');
      return;
    }
    if (!providerName) {
      setError('Enter a name for the custom provider.');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Opening balance must be zero or more.');
      return;
    }
    if (wallets.some((wallet) => wallet.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A wallet or account with this name already exists.');
      return;
    }

    addWallet(trimmed, providerName, amount);
    setProvider('JazzCash');
    setCustomProvider('');
    setName('JazzCash');
    setOpeningBalance('0');
    setError('');
    toast(`${trimmed} added`);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    const wallet = wallets.find((item) => item.id === deletingId);
    if (!deleteWallet(deletingId)) {
      toast('This account has transactions. Reassign or delete them before removing it.', 'error');
    } else if (wallet) {
      toast(`${wallet.name} deleted`);
    }
    setDeletingId(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <h2 className="mb-1 font-semibold">Add a wallet or account</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Add JazzCash, Easypaisa, bank accounts, cash, or another payment source.
        </p>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="wallet-provider">Provider</label>
            <select
              id="wallet-provider"
              className="input"
              value={provider}
              onChange={(event) => {
                const next = event.target.value as WalletProvider | 'custom';
                setProvider(next);
                if (next !== 'custom') setName(next);
              }}
            >
              {PROVIDERS.map((item) => <option key={item} value={item}>{item}</option>)}
              <option value="custom">Custom provider…</option>
            </select>
          </div>
          {provider === 'custom' && (
            <div>
              <label className="label" htmlFor="custom-provider">Provider name</label>
              <input
                id="custom-provider"
                className="input"
                placeholder="e.g. SadaPay"
                value={customProvider}
                onChange={(event) => setCustomProvider(event.target.value)}
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="wallet-name">Account name</label>
            <input
              id="wallet-name"
              className="input"
              placeholder="e.g. Easypaisa"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="wallet-balance">Opening balance (Rs)</label>
            <input
              id="wallet-balance"
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={openingBalance}
              onChange={(event) => setOpeningBalance(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" type="submit">＋ Add account</button>
          </div>
        </form>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </Card>

      {balances.length === 0 ? (
        <Card>
          <EmptyState icon="👛" text="No wallets or accounts yet. Add one above to track its balance and transactions." />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map(({ wallet, balance }) => {
              const count = transactions.filter((tx) => tx.walletId === wallet.id || tx.transferToWalletId === wallet.id).length;
              return (
                <Card key={wallet.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{wallet.provider}</p>
                      <h3 className="mt-1 font-semibold">{wallet.name}</h3>
                    </div>
                    <button
                      className="text-slate-400 hover:text-red-600"
                      title={`Delete ${wallet.name}`}
                      aria-label={`Delete ${wallet.name}`}
                      onClick={() => setDeletingId(wallet.id)}
                    >
                      🗑
                    </button>
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Current balance</p>
                  <p className={`mt-1 text-2xl font-bold ${balance < 0 ? 'text-red-500' : 'text-brand-600'}`}>{fmtRs(balance)}</p>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Opening {fmtRs(wallet.openingBalance)} · {count} {count === 1 ? 'transaction' : 'transactions'}
                  </p>
                </Card>
              );
            })}
          </div>
          <Card className="flex items-center justify-between gap-4">
            <span className="font-semibold">Total across wallets</span>
            <span className="text-xl font-bold text-brand-600">
              {fmtRs(balances.reduce((total, item) => total + item.balance, 0))}
            </span>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Delete wallet or account?"
        message="Accounts with linked transactions cannot be deleted. The transactions must be reassigned or removed first."
      />
    </div>
  );
}
