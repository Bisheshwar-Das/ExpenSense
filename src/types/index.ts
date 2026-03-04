// src/types/index.ts
export const DEFAULT_CREATED_AT = '2025-01-01T00:00:00.000Z';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  wallet: string;
  type: 'income' | 'expense' | 'transfer';
  notes?: string;
  toWalletId?: string; // if transferring to another wallet
  toGoalId?: string; // if transferring to a savings goal (earmarked)
  hasTime?: boolean;
  receiptUri?: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export type WalletType = 'checking' | 'savings' | 'cash' | 'credit' | 'investment';

export interface Wallet {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: WalletType;
  creditLimit?: number; // credit wallets only
  createdAt: string;
}

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

// Wallet type metadata — labels, icons, descriptions for UI
export const WALLET_TYPES: {
  type: WalletType;
  label: string;
  icon: string;
  description: string;
}[] = [
  { type: 'checking', label: 'Checking', icon: '👛', description: 'Everyday spending account' },
  { type: 'savings', label: 'Savings', icon: '🏦', description: 'Digital savings account' },
  { type: 'cash', label: 'Cash', icon: '💵', description: 'Physical cash on hand' },
  { type: 'credit', label: 'Credit', icon: '💳', description: 'Credit card or line of credit' },
  { type: 'investment', label: 'Investment', icon: '📈', description: 'Investments & brokerage' },
];

// Which wallet types trigger the "which goal is this for?" prompt on incoming transfers
export const SAVINGS_WALLET_TYPES: WalletType[] = ['savings', 'cash'];

// Default wallets
export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: '1',
    name: 'Main Wallet',
    icon: '👛',
    color: '#0891B2',
    type: 'checking',
    createdAt: DEFAULT_CREATED_AT,
  },
  {
    id: '2',
    name: 'Cash',
    icon: '💵',
    color: '#10B981',
    type: 'cash',
    createdAt: DEFAULT_CREATED_AT,
  },
  {
    id: '3',
    name: 'Credit Card',
    icon: '💳',
    color: '#F59E0B',
    type: 'credit',
    createdAt: DEFAULT_CREATED_AT,
  },
  {
    id: '4',
    name: 'Savings',
    icon: '🏦',
    color: '#8B5CF6',
    type: 'savings',
    createdAt: DEFAULT_CREATED_AT,
  },
];

export const WALLET_COLORS = [
  { name: 'Teal', value: '#0891B2' },
  { name: 'Green', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#64748B' },
  { name: 'Black', value: '#0F172A' },
];

export const WALLET_ICONS = [
  '👛', // Wallet
  '💵', // Cash
  '💳', // Credit Card
  '🏦', // Bank
  '💰', // Money bag
  '📱', // Digital wallet
  '🪙', // Coins
  '💎', // Premium / Savings
  '🎯', // Goals
  '📦', // Other
];

export type GoalType = 'savings' | 'budget';

export interface Goal {
  id: string;
  type: GoalType;
  name: string;
  targetAmount: number;
  category?: string; // budget goals only
  period?: 'weekly' | 'monthly' | 'yearly'; // budget goals only
  icon: string;
  color: string;
  deadline?: string; // ISO date string, savings goals only
  createdAt: string;
}

// Helper type for creating new goals (without id and createdAt)
export type NewGoal = Omit<Goal, 'id' | 'createdAt'>;
