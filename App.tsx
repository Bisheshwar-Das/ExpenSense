import 'react-native-gesture-handler';

import { TransactionProvider } from '@/contexts/TransactionContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { GoalProvider } from '@/contexts/GoalContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import AppNavigator from '@/navigation/AppNavigator';
import OnboardingScreen from '@/screens/OnboardingScreen';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // ⭐ Add this import
import { CategoryProvider } from '@/contexts/CategoryContext';

// Wrapper component to check onboarding status
function AppContent() {
  const { hasCompletedOnboarding, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  return <AppNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <CategoryProvider>
          <TransactionProvider>
            <WalletProvider>
              <GoalProvider>
                <OnboardingProvider>
                  <StatusBar style="light" translucent backgroundColor="transparent" />
                  <AppContent />
                </OnboardingProvider>
              </GoalProvider>
            </WalletProvider>
          </TransactionProvider>
        </CategoryProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
