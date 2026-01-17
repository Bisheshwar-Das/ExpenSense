import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Wallet, DEFAULT_WALLETS } from '../types';

type WalletContextType = {
  wallets: Wallet[];
  isLoading: boolean;
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => Promise<void>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
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
        setWallets(JSON.parse(stored));
      } else {
        // First time - use default wallets
        setWallets(DEFAULT_WALLETS);
        await AsyncStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(DEFAULT_WALLETS));
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      setWallets(DEFAULT_WALLETS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWallets = async (newWallets: Wallet[]) => {
    try {
      await AsyncStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(newWallets));
      setWallets(newWallets);
    } catch (error) {
      console.error('Error saving wallets:', error);
      throw error;
    }
  };

  const addWallet = async (wallet: Omit<Wallet, 'id' | 'createdAt'>) => {
    const newWallet: Wallet = {
      ...wallet,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    await saveWallets([...wallets, newWallet]);
  };

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    const updatedWallets = wallets.map(wallet =>
      wallet.id === id ? { ...wallet, ...updates } : wallet
    );
    
    await saveWallets(updatedWallets);
  };

  const deleteWallet = async (id: string) => {
    const filteredWallets = wallets.filter(wallet => wallet.id !== id);
    await saveWallets(filteredWallets);
  };

  return (
    <WalletContext.Provider
      value={{
        wallets,
        isLoading,
        addWallet,
        updateWallet,
        deleteWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallets() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallets must be used within WalletProvider');
  }
  return context;
}