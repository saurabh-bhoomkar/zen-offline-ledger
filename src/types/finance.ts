export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  note?: string;
  type: 'income' | 'expense' | 'transfer';
}

export type AccountType = 
  | 'checking'
  | 'savings' 
  | 'credit_card'
  | 'investment'
  | 'cash'
  | 'loan'
  | 'other';

export type Currency = 
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'CNY'
  | 'INR';

export interface UserSettings {
  defaultCurrency: Currency;
  pinHash?: string;
  biometricEnabled: boolean;
  isFirstLaunch: boolean;
}