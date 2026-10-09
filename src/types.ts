export type TxType = 'income' | 'expense';
export type TransactionType = TxType | 'transfer' | 'withdrawal';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // yyyy-mm-dd
  createdAt: number;
  walletId?: string;
  transferToWalletId?: string;
}

export type WalletProvider = 'Cash' | 'JazzCash' | 'Easypaisa' | 'Bank account' | 'Other';

export interface Wallet {
  id: string;
  name: string;
  provider: string;
  openingBalance: number;
  createdAt: number;
}

export interface Category {
  name: string;
  type: TxType;
  custom?: boolean;
}

export type Page = 'dashboard' | 'transactions' | 'reports' | 'budget' | 'categories' | 'wallets';
