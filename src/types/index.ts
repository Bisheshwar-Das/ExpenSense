// src/types/index.ts

export const DEFAULT_CREATED_AT = '2025-01-01T00:00:00.000Z';

// ─── Primitives ───────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense';
export type WalletType = 'checking' | 'savings' | 'cash' | 'credit' | 'investment';
export type GoalType = 'savings' | 'budget';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';
export type TransactionStatus = 'pending' | 'cleared' | 'reconciled';

// ─── Attachment ───────────────────────────────────────────────────────────────

export interface Attachment {
  uri: string;
  type: 'image' | 'pdf';
  label?: string;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  title: string;
  amount: number; // in wallet's currency
  type: TransactionType;
  categoryId: string; // 'transfer' for transfers, use TRANSFER_CATEGORY_ID
  walletId: string; // source wallet id
  date: string; // ISO string
  hasTime?: boolean;
  notes?: string;
  attachments?: Attachment[];
  status?: TransactionStatus;
  merchant?: string;
  tagIds?: string[];
  recurringId?: string; // links to RecurringTransaction when built
  toWalletId?: string; // transfer destination wallet
  toGoalId?: string; // transfer destination goal
  currency?: string; // only set if premium + different from home currency
  amountInHomeCurrency?: number; // only set if currency differs
  exchangeRate?: number; // only set if currency differs
}

export type NewTransaction = Omit<Transaction, 'id'>;

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isDefault?: boolean;
}

export const TRANSFER_CATEGORY_ID = 'transfer';

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Food', icon: '🍔', color: '#EF4444', type: 'expense', isDefault: true },
  {
    id: 'cat_2',
    name: 'Transport',
    icon: '🚗',
    color: '#F59E0B',
    type: 'expense',
    isDefault: true,
  },
  { id: 'cat_3', name: 'Shopping', icon: '🛍️', color: '#8B5CF6', type: 'expense', isDefault: true },
  { id: 'cat_4', name: 'Bills', icon: '📄', color: '#0891B2', type: 'expense', isDefault: true },
  {
    id: 'cat_5',
    name: 'Education',
    icon: '📚',
    color: '#10B981',
    type: 'expense',
    isDefault: true,
  },
  {
    id: 'cat_6',
    name: 'Entertainment',
    icon: '🎬',
    color: '#EC4899',
    type: 'expense',
    isDefault: true,
  },
  { id: 'cat_7', name: 'Health', icon: '💊', color: '#22C55E', type: 'expense', isDefault: true },
  { id: 'cat_8', name: 'Other', icon: '📦', color: '#64748B', type: 'expense', isDefault: true },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'cat_9', name: 'Salary', icon: '💰', color: '#22C55E', type: 'income', isDefault: true },
  {
    id: 'cat_10',
    name: 'Freelance',
    icon: '💼',
    color: '#14B8A6',
    type: 'income',
    isDefault: true,
  },
  { id: 'cat_11', name: 'Gift', icon: '🎁', color: '#EC4899', type: 'income', isDefault: true },
  {
    id: 'cat_12',
    name: 'Investment',
    icon: '📈',
    color: '#8B5CF6',
    type: 'income',
    isDefault: true,
  },
  { id: 'cat_13', name: 'Other', icon: '💵', color: '#64748B', type: 'income', isDefault: true },
];

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface Wallet {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: WalletType;
  currency?: string; // optional — only set if premium + different from home
  creditLimit?: number;
  createdAt: string;
}

export type NewWallet = Omit<Wallet, 'id' | 'createdAt'>;

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

export const SAVINGS_WALLET_TYPES: WalletType[] = ['savings', 'cash'];

export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'wallet_1',
    name: 'Main Wallet',
    icon: '👛',
    color: '#0891B2',
    type: 'checking',
    currency: 'USD',
    createdAt: DEFAULT_CREATED_AT,
  },
  {
    id: 'wallet_2',
    name: 'Cash',
    icon: '💵',
    color: '#10B981',
    type: 'cash',
    currency: 'USD',
    createdAt: DEFAULT_CREATED_AT,
  },
  {
    id: 'wallet_3',
    name: 'Credit Card',
    icon: '💳',
    color: '#F59E0B',
    type: 'credit',
    currency: 'USD',
    createdAt: DEFAULT_CREATED_AT,
  },
  {
    id: 'wallet_4',
    name: 'Savings',
    icon: '🏦',
    color: '#8B5CF6',
    type: 'savings',
    currency: 'USD',
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

export const WALLET_ICONS = ['👛', '💵', '💳', '🏦', '💰', '📱', '🪙', '💎', '🎯', '📦'];

// ─── Goal ─────────────────────────────────────────────────────────────────────

export interface Goal {
  id: string;
  type: GoalType;
  name: string;
  targetAmount: number;
  categoryId?: string; // budget goals only
  period?: BudgetPeriod; // budget goals only
  deadline?: string; // savings goals only — ISO date string
  walletId?: string; // savings goals only — which wallet holds this money
  icon: string;
  color: string;
  createdAt: string;
}

export type NewGoal = Omit<Goal, 'id' | 'createdAt'>;

// ─── Tag ──────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  color: string;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  avatarUri?: string;
  homeCurrency: string;
  createdAt: string;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface Settings {
  homeCurrency: string;
  theme?: string;
  firstDayOfWeek?: 0 | 1; // 0 = Sunday, 1 = Monday
  biometricLock?: boolean;
  notificationsEnabled?: boolean;
}
