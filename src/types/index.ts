// src/types/index.ts

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  wallet: string;
  type: 'income' | 'expense';
  notes?:string; //(optional)
}

export interface Wallet {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
}

export type TransactionType = 'income' | 'expense';

export type Category = {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
};

// Predefined categories
export const EXPENSE_CATEGORIES: Category[] = [
  { id: '1', name: 'Food', icon: '🍔', type: 'expense' },
  { id: '2', name: 'Transport', icon: '🚗', type: 'expense' },
  { id: '3', name: 'Shopping', icon: '🛍️', type: 'expense' },
  { id: '4', name: 'Bills', icon: '📄', type: 'expense' },
  { id: '5', name: 'Education', icon: '📚', type: 'expense' },
  { id: '6', name: 'Entertainment', icon: '🎬', type: 'expense' },
  { id: '7', name: 'Health', icon: '💊', type: 'expense' },
  { id: '8', name: 'Other', icon: '📦', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: '9', name: 'Salary', icon: '💰', type: 'income' },
  { id: '10', name: 'Freelance', icon: '💼', type: 'income' },
  { id: '11', name: 'Gift', icon: '🎁', type: 'income' },
  { id: '12', name: 'Investment', icon: '📈', type: 'income' },
  { id: '13', name: 'Other', icon: '💵', type: 'income' },
];

// Default wallets
export const DEFAULT_WALLETS: Wallet[] = [
  { id: '1', name: 'Main Wallet', icon: '👛', color: '#0891B2' },
  { id: '2', name: 'Cash', icon: '💵', color: '#10B981' },
  { id: '3', name: 'Credit Card', icon: '💳', color: '#F59E0B' },
  { id: '4', name: 'Savings', icon: '🏦', color: '#8B5CF6' },
];