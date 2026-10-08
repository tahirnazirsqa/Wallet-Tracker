export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  description: string;
  date: string; // yyyy-mm-dd
  createdAt: number;
}

export interface Category {
  name: string;
  type: TxType;
  custom?: boolean;
}

export type Page = 'dashboard' | 'transactions' | 'reports' | 'budget' | 'categories';
