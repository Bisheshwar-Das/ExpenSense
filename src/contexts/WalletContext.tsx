// src/contexts/WalletContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Wallet, DEFAULT_WALLETS } from '../types';

type WalletContextType = {
  wallets: Wallet[];
  isLoading: boolean;
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => Promise<Wallet>;
  updateWallet: (id: string, updates: Partial<Omit<Wallet, 'id' | 'createdAt'>>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  clearAllWallets: () => Promise<void>;
  // Helpers
  getWalletById: (id: string) => Wallet | undefined;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLETS_STORAGE_KEY = '@expensense_wallets';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wallets from storage on mount
  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const stored = await AsyncStorage.getItem(WALLETS_STORAGE_KEY);

      if (stored) {
        const parsedWallets = JSON.parse(stored);
        setWallets(parsedWallets);
        console.log('✅ Loaded wallets:', parsedWallets.length);
      } else {
        // First time - use default wallets
        setWallets(DEFAULT_WALLETS);
        await AsyncStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(DEFAULT_WALLETS));
        console.log('📝 Initialized with default wallets:', DEFAULT_WALLETS.length);
      }
    } catch (error) {
      console.error('❌ Error loading wallets:', error);
      setWallets(DEFAULT_WALLETS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWallets = async (newWallets: Wallet[]) => {
    try {
      await AsyncStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(newWallets));
      setWallets(newWallets);
      console.log('💾 Saved wallets:', newWallets.length);
    } catch (error) {
      console.error('❌ Error saving wallets:', error);
      throw error;
    }
  };

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'createdAt'>): Promise<Wallet> => {
    const newWallet: Wallet = {
      ...wallet,
      id: `wallet_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    await saveWallets([...wallets, newWallet]);
    return newWallet;
  };

  const updateWallet = async (id: string, updates: Partial<Omit<Wallet, 'id' | 'createdAt'>>) => {
    const updatedWallets = wallets.map(wallet =>
      wallet.id === id ? { ...wallet, ...updates } : wallet
    );

    await saveWallets(updatedWallets);
  };

  const deleteWallet = async (id: string) => {
    const filteredWallets = wallets.filter(wallet => wallet.id !== id);
    await saveWallets(filteredWallets);
  };

  const clearAllWallets = async () => {
    await saveWallets([]);
  };

  // ─── Helper Methods ──────────────────────────────────────────────────────

  const getWalletById = (id: string): Wallet | undefined => {
    return wallets.find(w => w.id === id);
  };

  const value: WalletContextType = {
    wallets,
    isLoading,
    addWallet,
    updateWallet,
    deleteWallet,
    clearAllWallets,
    getWalletById,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallets() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallets must be used within WalletProvider');
  }
  return context;
}
