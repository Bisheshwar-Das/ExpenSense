import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  isLoading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] =useState<Transaction[]>([]);
  const [isLoading,setIsLoading] = useState(true);

  //Key for AsyncStorage - like a filename
  const STORAGE_KEY = '@expensense_transactions';

  // LOAD transactions from AsyncStorage when app starts
  useEffect(() => {
    loadTransactions();
  }, []); // Empty array = run once when component mounts

  const loadTransactions = async () => {
    try {
      // Get the saved data from phone storage
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (savedData) {
        // Parse JSON string back into array
        const parsed = JSON.parse(savedData);
        setTransactions(parsed);
        console.log('✅ Loaded transactions:', parsed.length);
      } else {
        console.log('📝 No saved transactions found');
      }
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
    } finally {
      setIsLoading(false); // Done loading
    }
  };

  // SAVE transactions to AsyncStorage
  // Helper function - called after every change
  const saveTransactions = async (newTransactions: Transaction[]) => {
    try {
      // Convert array to JSON string and save
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
      console.log('💾 Saved transactions:', newTransactions.length);
    } catch (error) {
      console.error('❌ Error saving transactions:', error);
    }
  };

  // ADD a new transaction
  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    // Create new transaction with unique ID
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(), // Simple ID using timestamp
    };

    // Update state (Context API - immediate UI update)
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);

    // Save to AsyncStorage (persists to disk)
    await saveTransactions(updatedTransactions);
  };

  // DELETE a transaction
  const deleteTransaction = async (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    await saveTransactions(updatedTransactions);
  };

  // UPDATE a transaction
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const updatedTransactions = transactions.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    setTransactions(updatedTransactions);
    await saveTransactions(updatedTransactions);
  };

  // PROVIDE all data/functions to children
  const value = {
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    isLoading,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

//Custom Hook for easy access
// This makes it easier to use the context in components
export function useTransactions() {
  const context = useContext(TransactionContext);
  
  // Safety check - make sure we're inside the Provider
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  
  return context;


}