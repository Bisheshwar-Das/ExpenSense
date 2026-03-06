import 'react-native-gesture-handler';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Contexts
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { WalletProvider } from '@/contexts/WalletContext';

// Navigation & Screens
import AppNavigator from '@/navigation/AppNavigator';
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';
import { BudgetProvider } from '@/contexts/BudgetContext';
import { SavingsProvider } from '@/contexts/SavingsContext';

// ─── App Content (conditional rendering based on onboarding status) ────────

function AppContent() {
  const { isOnboarded, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#2563EB',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!isOnboarded) {
    return <OnboardingScreen />;
  }

  return <AppNavigator />;
}

// ─── Root App Component ────────────────────────────────────────────────────

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <OnboardingProvider>
          <SettingsProvider>
            <CategoryProvider>
              <WalletProvider>
                <TransactionProvider>
                  <BudgetProvider>
                    <SavingsProvider>
                      <StatusBar style="light" translucent backgroundColor="transparent" />
                      <AppContent />
                    </SavingsProvider>
                  </BudgetProvider>
                </TransactionProvider>
              </WalletProvider>
            </CategoryProvider>
          </SettingsProvider>
        </OnboardingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
