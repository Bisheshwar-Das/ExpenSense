// src/screens/auth/OnboardingScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useSettings, CURRENCIES } from '../../contexts/SettingsContext';
import { useWallets } from '../../contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';

// Default wallet options
const DEFAULT_WALLETS = [
  { name: 'Main Wallet', icon: '👛', color: '#0891B2' },
  { name: 'Cash', icon: '💵', color: '#10B981' },
  { name: 'Savings', icon: '🏦', color: '#8B5CF6' },
  { name: 'Credit Card', icon: '💳', color: '#F59E0B' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding, updateProfile } = useOnboarding();
  const { setCurrency } = useSettings();
  const { addWallet } = useWallets();

  const [step, setStep] = useState(1); // 1: Welcome, 2: Currency, 3: Wallet, 4: Profile, 5: Done
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [selectedWallet, setSelectedWallet] = useState(DEFAULT_WALLETS[0]);
  const [customWalletName, setCustomWalletName] = useState('');
  const [isCustomWallet, setIsCustomWallet] = useState(false);
  const [userName, setUserName] = useState('');

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Save currency selection
      try {
        await setCurrency(selectedCurrency);
        setStep(3);
      } catch (error) {
        Alert.alert('Error', 'Failed to save currency');
      }
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
          type: 'checking',
        });

        setStep(4);
      } catch (error) {
        Alert.alert('Error', 'Failed to create wallet. Please try again.');
      }
    } else if (step === 4) {
      // Save profile
      try {
        await updateProfile({
          name: userName,
        });
        setStep(5);
      } catch (error) {
        Alert.alert('Error', 'Failed to save profile');
      }
    } else if (step === 5) {
      // Complete onboarding
      try {
        await completeOnboarding({
          name: userName,
          avatarUri: undefined,
          homeCurrency: selectedCurrency.code,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to complete onboarding');
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Step 1: Welcome Screen
  if (step === 1) {
    return (
      <View style={{ flex: 1, backgroundColor: '#14B8A6', paddingTop: insets.top }}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
        >
          <Text style={{ fontSize: 60, marginBottom: 24 }}>💰</Text>
          <Text
            style={{
              color: '#FFF',
              fontSize: 36,
              fontWeight: '800',
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            Welcome to Expen$ense
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            Your personal finance manager. Track expenses, manage budgets, and achieve your savings
            goals.
          </Text>

          <View style={{ width: '100%', gap: 12 }}>
            <FeatureItem icon="📊" text="Track your spending habits" />
            <FeatureItem icon="💳" text="Manage multiple wallets" />
            <FeatureItem icon="🎯" text="Set and achieve financial goals" />
            <FeatureItem icon="📈" text="Visualize your finances" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 32, paddingBottom: 32 }}>
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: '#FFF',
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#14B8A6', fontSize: 16, fontWeight: '600' }}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 2: Currency Selection
  if (step === 2) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets.top }}>
        <View
          style={{
            backgroundColor: '#14B8A6',
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          }}
        >
          <TouchableOpacity onPress={handleBack} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#FFF', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 4 }}>
            Choose Your Currency
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Select the currency you'll use most often
          </Text>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
          {CURRENCIES.map(currency => (
            <TouchableOpacity
              key={currency.code}
              onPress={() => setSelectedCurrency(currency)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 12,
                borderRadius: 16,
                backgroundColor:
                  selectedCurrency.code === currency.code ? 'rgba(20,184,166,0.1)' : '#FFF',
                borderWidth: selectedCurrency.code === currency.code ? 2 : 1,
                borderColor: selectedCurrency.code === currency.code ? '#14B8A6' : '#E2E8F0',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    backgroundColor:
                      selectedCurrency.code === currency.code ? '#14B8A6' : 'rgba(20,184,166,0.1)',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{currency.symbol}</Text>
                </View>
                <View>
                  <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 16 }}>
                    {currency.name}
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 14, marginTop: 2 }}>
                    {currency.code}
                  </Text>
                </View>
              </View>
              {selectedCurrency.code === currency.code && (
                <Text style={{ color: '#14B8A6', fontSize: 24 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 24,
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
          }}
        >
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: '#14B8A6',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 3: Wallet Creation
  if (step === 3) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets.top }}>
        <View
          style={{
            backgroundColor: '#14B8A6',
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          }}
        >
          <TouchableOpacity onPress={handleBack} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#FFF', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 4 }}>
            Create Your First Wallet
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Choose a preset or create custom
          </Text>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
          {/* Preset Wallets */}
          <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
            Quick Setup
          </Text>
          {DEFAULT_WALLETS.map(wallet => (
            <TouchableOpacity
              key={wallet.name}
              onPress={() => {
                setSelectedWallet(wallet);
                setIsCustomWallet(false);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 12,
                borderRadius: 16,
                backgroundColor:
                  !isCustomWallet && selectedWallet.name === wallet.name
                    ? 'rgba(20,184,166,0.1)'
                    : '#FFF',
                borderWidth: !isCustomWallet && selectedWallet.name === wallet.name ? 2 : 1,
                borderColor:
                  !isCustomWallet && selectedWallet.name === wallet.name ? '#14B8A6' : '#E2E8F0',
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  backgroundColor: wallet.color + '20',
                }}
              >
                <Text style={{ fontSize: 24 }}>{wallet.icon}</Text>
              </View>
              <Text style={{ flex: 1, color: '#0F172A', fontWeight: '600', fontSize: 16 }}>
                {wallet.name}
              </Text>
              {!isCustomWallet && selectedWallet.name === wallet.name && (
                <Text style={{ color: '#14B8A6', fontSize: 24 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

          {/* Custom Wallet */}
          <Text
            style={{
              color: '#0F172A',
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 12,
              marginTop: 24,
            }}
          >
            Or Create Custom
          </Text>
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: isCustomWallet ? 'rgba(20,184,166,0.1)' : '#FFF',
              borderWidth: isCustomWallet ? 2 : 1,
              borderColor: isCustomWallet ? '#14B8A6' : '#E2E8F0',
            }}
          >
            <Text style={{ color: '#0F172A', fontWeight: '500', fontSize: 16, marginBottom: 12 }}>
              Custom Wallet Name
            </Text>
            <TextInput
              value={customWalletName}
              onChangeText={setCustomWalletName}
              placeholder="e.g., Business Account"
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: '#F8FAFC',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                color: '#0F172A',
                fontSize: 16,
              }}
              onFocus={() => setIsCustomWallet(true)}
            />
          </View>
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 24,
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
          }}
        >
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: '#14B8A6',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Create Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 4: Profile Setup
  if (step === 4) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets.top }}>
        <View
          style={{
            backgroundColor: '#14B8A6',
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          }}
        >
          <TouchableOpacity onPress={handleBack} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#FFF', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: 4 }}>
            Tell Us About You
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Personalize your experience
          </Text>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
          <Text
            style={{
              color: '#64748B',
              fontSize: 12,
              fontWeight: '600',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            Full Name
          </Text>
          <TextInput
            value={userName}
            onChangeText={setUserName}
            placeholder="John Doe"
            placeholderTextColor="#94A3B8"
            style={{
              backgroundColor: '#FFF',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              color: '#0F172A',
              fontSize: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          />

          <View
            style={{
              backgroundColor: '#FFF',
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <Text style={{ color: '#0F172A', fontSize: 14 }}>
              Your profile helps us personalize your experience.
            </Text>
          </View>
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 24,
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
          }}
        >
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: '#14B8A6',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 5: Success Screen
  return (
    <View style={{ flex: 1, backgroundColor: '#14B8A6', paddingTop: insets.top }}>
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
      >
        <Text style={{ fontSize: 60, marginBottom: 24 }}>🎉</Text>
        <Text
          style={{
            color: '#FFF',
            fontSize: 36,
            fontWeight: '800',
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          All Set!
        </Text>
        <Text
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          You're ready to start tracking your finances. Let's add your first transaction!
        </Text>

        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 20,
            width: '100%',
            marginBottom: 24,
          }}
        >
          <InfoRow label="Currency" value={`${selectedCurrency.symbol} ${selectedCurrency.code}`} />
          <InfoRow
            label="First Wallet"
            value={isCustomWallet ? customWalletName : selectedWallet.name}
          />
          <InfoRow label="Name" value={userName || 'Not provided'} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 32, paddingBottom: 32 }}>
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: '#FFF',
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#14B8A6', fontSize: 16, fontWeight: '600' }}>
            Start Using Expen$ense
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper Components
function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>{text}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>{value}</Text>
    </View>
  );
}
