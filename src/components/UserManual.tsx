import { useEffect } from 'react';

export function UserManual({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <section
        aria-labelledby="user-manual-title"
        aria-modal="true"
        className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-0"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 id="user-manual-title" className="text-lg font-bold">Wallet Tracker User Manual</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">A quick guide to tracking your money.</p>
          </div>
          <button aria-label="Close user manual" onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">×</button>
        </header>

        <div className="space-y-6 p-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <section>
            <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">1. Sign in and get started</h3>
            <p>Create an account with your email and password, sign in to an existing account, or choose <strong>Continue with Google</strong>. Your wallets and financial records are saved to your private account and sync when you use the app on another device. Use “Forgot password?” on the sign-in screen if you need to reset your email-account password.</p>
            <p className="mt-2">For the clearest balances, first add each place where you keep money under <strong>Wallets &amp; Accounts</strong>, including its opening balance.</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">2. Add wallets and accounts</h3>
            <p>Open <strong>Wallets &amp; Accounts</strong>, choose a provider such as Cash, JazzCash, Easypaisa, or Bank account, enter a unique account name and its opening balance, then select <strong>Add account</strong>. Choose “Custom provider…” to add a provider not listed.</p>
            <p className="mt-2">Each account card shows its current balance and activity count. The dashboard’s <strong>Current Balance</strong> includes all wallet balances. Accounts linked to transactions cannot be deleted until those transactions are removed or reassigned.</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">3. Record income and expenses</h3>
            <p>From the Dashboard, choose <strong>Add Income</strong> or <strong>Add Expense</strong>. Enter a positive amount, category, date, and optional description. Select the wallet receiving income or paying an expense, then save. Add a wallet first if you have none; income always requires a destination wallet.</p>
            <p className="mt-2">Use <strong>Transactions</strong> to search and filter records by type, category, month, or account. Sort by date or amount, and use the edit or delete controls on a record to correct it.</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">4. Transfer money or withdraw to Cash</h3>
            <p><strong>Transfer between wallets</strong> moves money from one account to another. Select two different accounts and an amount. Transfers update both balances but are not counted as income or expenses.</p>
            <p className="mt-2"><strong>Withdraw to Cash</strong> moves money from a non-Cash wallet into a Cash account. The withdrawal cannot exceed the source account’s available balance. If you have no Cash account, the app creates one automatically.</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">5. Use the Dashboard and Reports</h3>
            <p>The Dashboard summarizes your balances, income, and expenses, and displays monthly spending and top expense categories. Use its month selector to review a different month.</p>
            <p className="mt-2">Open <strong>Reports</strong> to choose a month and year and view income, expenses, net savings, expense categories, and daily spending charts.</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">6. Set budgets and manage categories</h3>
            <p>In <strong>Budget</strong>, select a month and set or update its spending limit. The progress bar shows how much of the budget is used, and the app warns you when spending exceeds it.</p>
            <p className="mt-2">In <strong>Categories</strong>, add custom income or expense categories. You can rename custom categories; transactions that use a renamed category are updated too. A category in use cannot be deleted.</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">7. Account, appearance, and data</h3>
            <p>Use the moon/sun button to switch themes. Open the side menu to sign out. Your cloud records remain in your account when you sign out; your theme preference is saved on this device.</p>
            <p className="mt-2"><strong>Reset all data</strong> permanently deletes your cloud wallets, transactions, budgets, and custom categories, as well as the local copy on this device. This cannot be undone.</p>
          </section>
        </div>

        <footer className="border-t border-slate-200 px-5 py-4 text-right dark:border-slate-800">
          <button className="btn-primary" onClick={onClose}>Got it</button>
        </footer>
      </section>
    </div>
  );
}
