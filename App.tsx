import 'react-native-gesture-handler';

import { TransactionProvider } from '@/contexts/TransactionContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { GoalProvider } from '@/contexts/GoalContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import AppNavigator from '@/navigation/AppNavigator';
import React from 'react';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <SettingsProvider>
      <TransactionProvider>
        <WalletProvider>
          <GoalProvider>
            <StatusBar style="light" translucent backgroundColor="transparent" />
            <AppNavigator />
          </GoalProvider>
        </WalletProvider>
      </TransactionProvider>
    </SettingsProvider>
  );
}
