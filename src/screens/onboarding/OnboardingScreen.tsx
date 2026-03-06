// screens/OnboardingScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useSettings } from '../contexts/SettingsContext';
import { useWallets } from '../contexts/WalletContext';

// Available currencies
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

// Default wallet options
const DEFAULT_WALLETS = [
  { name: 'Main Wallet', icon: '👛', color: '#0891B2' },
  { name: 'Cash', icon: '💵', color: '#10B981' },
  { name: 'Savings', icon: '🏦', color: '#8B5CF6' },
  { name: 'Credit Card', icon: '💳', color: '#F59E0B' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();
  const { setCurrency } = useSettings();
  const { addWallet } = useWallets();

  const [step, setStep] = useState(1); // 1: Welcome, 2: Currency, 3: Wallet, 4: Done
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [selectedWallet, setSelectedWallet] = useState(DEFAULT_WALLETS[0]);
  const [customWalletName, setCustomWalletName] = useState('');
  const [isCustomWallet, setIsCustomWallet] = useState(false);

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Save currency selection
      await setCurrency(selectedCurrency);
      setStep(3);
    } else if (step === 3) {
      // Create wallet
      try {
        const walletName = isCustomWallet ? customWalletName : selectedWallet.name;
        const walletIcon = isCustomWallet ? '💰' : selectedWallet.icon;
        const walletColor = isCustomWallet ? '#0891B2' : selectedWallet.color;

        if (!walletName.trim()) {
          Alert.alert('Error', 'Please enter a wallet name');
          return;
        }

        await addWallet({
          name: walletName,
          icon: walletIcon,
          color: walletColor,
        });

        setStep(4);
      } catch (error) {
        Alert.alert('Error', 'Failed to create wallet. Please try again.');
      }
    } else if (step === 4) {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Welcome Screen
  if (step === 1) {
    return (
      <View className="flex-1 bg-primary" style={{ paddingTop: insets.top }}>
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-6xl mb-6">💰</Text>
          <Text className="text-white text-4xl font-bold mb-3 text-center">
            Welcome to Expen$ense
          </Text>
          <Text className="text-white/80 text-lg text-center mb-8">
            Your personal finance manager. Track expenses, manage budgets, and achieve your savings
            goals.
          </Text>

          <View className="w-full space-y-4">
            <FeatureItem icon="📊" text="Track your spending habits" />
            <FeatureItem icon="💳" text="Manage multiple wallets" />
            <FeatureItem icon="🎯" text="Set and achieve financial goals" />
            <FeatureItem icon="📈" text="Visualize your finances" />
          </View>
        </View>

        <View className="px-8 pb-8">
          <TouchableOpacity onPress={handleNext} className="bg-white py-4 rounded-2xl items-center">
            <Text className="text-primary text-lg font-semibold">Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Currency Selection
  if (step === 2) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="bg-primary px-8 py-6 rounded-b-[30px]">
          <TouchableOpacity onPress={handleBack} className="mb-4">
            <Text className="text-white text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-3xl font-bold mb-2">Choose Your Currency</Text>
          <Text className="text-white/80 text-base">Select the currency you'll use most often</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {CURRENCIES.map(currency => (
            <TouchableOpacity
              key={currency.code}
              onPress={() => setSelectedCurrency(currency)}
              className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl ${
                selectedCurrency.code === currency.code
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-card'
              }`}
            >
              <View className="flex-row items-center">
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${
                    selectedCurrency.code === currency.code ? 'bg-primary' : 'bg-primary/20'
                  }`}
                >
                  <Text
                    className={`text-2xl ${selectedCurrency.code === currency.code ? 'text-white' : 'text-primary'}`}
                  >
                    {currency.symbol}
                  </Text>
                </View>
                <View>
                  <Text className="text-textPrimary font-semibold text-base">{currency.name}</Text>
                  <Text className="text-textSecondary text-sm">{currency.code}</Text>
                </View>
              </View>
              {selectedCurrency.code === currency.code && (
                <Text className="text-primary text-2xl">✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="px-8 py-6 bg-white border-t border-border">
          <TouchableOpacity onPress={handleNext} className="bg-primary py-4 rounded-2xl">
            <Text className="text-white text-lg font-semibold text-center">Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Wallet Creation
  if (step === 3) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="bg-primary px-8 py-6 rounded-b-[30px]">
          <TouchableOpacity onPress={handleBack} className="mb-4">
            <Text className="text-white text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-3xl font-bold mb-2">Create Your First Wallet</Text>
          <Text className="text-white/80 text-base">Choose a preset or create custom</Text>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* Preset Wallets */}
          <Text className="text-textPrimary text-lg font-semibold mb-4">Quick Setup</Text>
          {DEFAULT_WALLETS.map(wallet => (
            <TouchableOpacity
              key={wallet.name}
              onPress={() => {
                setSelectedWallet(wallet);
                setIsCustomWallet(false);
              }}
              className={`flex-row items-center p-4 mb-3 rounded-2xl ${
                !isCustomWallet && selectedWallet.name === wallet.name
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-card'
              }`}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: wallet.color + '20' }}
              >
                <Text className="text-2xl">{wallet.icon}</Text>
              </View>
              <Text className="flex-1 text-textPrimary font-semibold text-base">{wallet.name}</Text>
              {!isCustomWallet && selectedWallet.name === wallet.name && (
                <Text className="text-primary text-2xl">✓</Text>
              )}
            </TouchableOpacity>
          ))}

          {/* Custom Wallet */}
          <Text className="text-textPrimary text-lg font-semibold mb-4 mt-6">Or Create Custom</Text>
          <TouchableOpacity
            onPress={() => setIsCustomWallet(true)}
            className={`p-4 rounded-2xl ${isCustomWallet ? 'bg-primary/10 border-2 border-primary' : 'bg-card'}`}
          >
            <Text className="text-textPrimary font-medium text-base mb-3">Custom Wallet Name</Text>
            <TextInput
              value={customWalletName}
              onChangeText={setCustomWalletName}
              placeholder="e.g., Business Account"
              placeholderTextColor="#94A3B8"
              className="bg-background p-4 rounded-xl text-textPrimary text-base"
              onFocus={() => setIsCustomWallet(true)}
            />
          </TouchableOpacity>
        </ScrollView>

        <View className="px-8 py-6 bg-white border-t border-border">
          <TouchableOpacity onPress={handleNext} className="bg-primary py-4 rounded-2xl">
            <Text className="text-white text-lg font-semibold text-center">Create Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Success Screen
  return (
    <View className="flex-1 bg-primary" style={{ paddingTop: insets.top }}>
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-6xl mb-6">🎉</Text>
        <Text className="text-white text-4xl font-bold mb-3 text-center">All Set!</Text>
        <Text className="text-white/80 text-lg text-center mb-8">
          You're ready to start tracking your finances. Let's add your first transaction!
        </Text>

        <View className="w-full bg-white/15 p-6 rounded-2xl mb-6">
          <InfoRow label="Currency" value={`${selectedCurrency.symbol} ${selectedCurrency.code}`} />
          <InfoRow
            label="First Wallet"
            value={isCustomWallet ? customWalletName : selectedWallet.name}
          />
        </View>
      </View>

      <View className="px-8 pb-8">
        <TouchableOpacity onPress={handleNext} className="bg-white py-4 rounded-2xl items-center">
          <Text className="text-primary text-lg font-semibold">Start Using Expen$ense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper Components
function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center">
      <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
        <Text className="text-xl">{icon}</Text>
      </View>
      <Text className="text-white/90 text-base">{text}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-white/10 last:border-b-0">
      <Text className="text-white/70 text-base">{label}</Text>
      <Text className="text-white font-semibold text-base">{value}</Text>
    </View>
  );
}
