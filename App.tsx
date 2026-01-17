import { TransactionProvider } from '@/contexts/TransactionContext';
import { WalletProvider } from '@/contexts/WalletContext';
import AppNavigator from '@/navigation/AppNavigator';
import DashboardScreen from '@/screens/DashboardScreen';
import React from 'react';

export default function App() {
  return (
    <TransactionProvider>
      <WalletProvider>
      <AppNavigator/>
      </WalletProvider>
    </TransactionProvider>
  );
}