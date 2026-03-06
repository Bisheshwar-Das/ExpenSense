// src/contexts/TransactionContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, NewTransaction, TRANSFER_CATEGORY_ID } from '../types';

const STORAGE_KEY = '@expensense_transactions_v2';

interface TransactionContextType {
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (data: NewTransaction) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<NewTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  // Helpers
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByWallet: (walletId: string) => Transaction[];
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getTransactionsByGoal: (goalId: string) => Transaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getTransactionsByType: (type: 'income' | 'expense' | 'transfer') => Transaction[];
  getTotalExpenses: () => number;
  getTotalIncome: () => number;
  getNetAmount: () => number;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setTransactions(parsed);
        console.log('✅ Loaded transactions:', parsed.length);
      } else {
        console.log('📝 No saved transactions found');
      }
    } catch (err) {
      console.error('❌ Error loading transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const persist = async (updated: Transaction[]) => {
    try {
      setTransactions(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log('💾 Saved transactions:', updated.length);
    } catch (err) {
      console.error('❌ Error saving transactions:', err);
      throw err;
    }
  };

  const addTransaction = async (data: NewTransaction): Promise<Transaction> => {
    const newTransaction: Transaction = {
      ...data,
      id: `txn_${Date.now()}`,
    };
    await persist([newTransaction, ...transactions]);
    console.log('➕ Added transaction:', newTransaction.title);
    return newTransaction;
  };

  const updateTransaction = async (id: string, updates: Partial<NewTransaction>): Promise<void> => {
    const updated = transactions.map(t => (t.id === id ? { ...t, ...updates } : t));
    await persist(updated);
    const txn = updated.find(t => t.id === id);
    console.log('✏️ Updated transaction:', txn?.title);
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    const txn = transactions.find(t => t.id === id);
    const filtered = transactions.filter(t => t.id !== id);
    await persist(filtered);
    console.log('🗑️ Deleted transaction:', txn?.title);
  };

  const clearAllTransactions = async (): Promise<void> => {
    await persist([]);
    console.log('🗑️ Cleared all transactions');
  };

  // ── Helper Methods ───────────────────────────────────────────────────────

  const getTransactionById = (id: string): Transaction | undefined =>
    transactions.find(t => t.id === id);

  const getTransactionsByWallet = (walletId: string): Transaction[] =>
    transactions.filter(t => t.walletId === walletId || t.toWalletId === walletId);

  const getTransactionsByCategory = (categoryId: string): Transaction[] =>
    transactions.filter(t => t.categoryId === categoryId);

  const getTransactionsByGoal = (goalId: string): Transaction[] =>
    transactions.filter(t => t.toGoalId === goalId);

  const getTransactionsByDateRange = (startDate: string, endDate: string): Transaction[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return transactions.filter(t => {
      const txnDate = new Date(t.date);
      return txnDate >= start && txnDate <= end;
    });
  };

  const getTransactionsByType = (type: 'income' | 'expense' | 'transfer'): Transaction[] =>
    transactions.filter(t => t.type === type);

  const getTotalExpenses = (): number =>
    transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const getTotalIncome = (): number =>
    transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  const getNetAmount = (): number => getTotalIncome() - getTotalExpenses();

  const value: TransactionContextType = {
    transactions,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    getTransactionById,
    getTransactionsByWallet,
    getTransactionsByCategory,
    getTransactionsByGoal,
    getTransactionsByDateRange,
    getTransactionsByType,
    getTotalExpenses,
    getTotalIncome,
    getNetAmount,
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return ctx;
}
