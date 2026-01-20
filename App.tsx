import 'react-native-gesture-handler';

import { TransactionProvider } from '@/contexts/TransactionContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { GoalProvider } from '@/contexts/GoalContext'
import AppNavigator from '@/navigation/AppNavigator';
import DashboardScreen from '@/screens/DashboardScreen';
import React from 'react';

export default function App() {
  return (
    <TransactionProvider>
      <WalletProvider>
        <GoalProvider>
          <AppNavigator/>
        </GoalProvider>
      </WalletProvider>
    </TransactionProvider>
  );
}