// screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings, CURRENCIES, Currency } from '../../contexts/SettingsContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useWallets } from '../../contexts/WalletContext';
import { useGoals } from '../../contexts/GoalContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { currency, theme, setCurrency, setTheme } = useSettings();
  const { transactions, clearAllTransactions } = useTransactions();
  const { wallets, clearAllWallets } = useWallets();
  const { goals, clearAllGoals } = useGoals();
  const insets = useSafeAreaInsets();

  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  // App version - update this when you release
  const APP_VERSION = '1.0.0';

  // Handle theme toggle
  const handleThemeToggle = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
    Alert.alert('Theme', `${value ? 'Dark' : 'Light'} mode will be available in the next update!`);
  };

  // Export data as JSON
  const handleExportData = async () => {
    try {
      if (transactions.length === 0) {
        Alert.alert('No Data', 'You have no transactions to export.');
        return;
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        version: APP_VERSION,
        transactions,
        wallets,
        goals,
        settings: { currency: currency.code, theme },
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      // Use native Share API
      await Share.share({
        message: jsonString,
        title: 'Expen$ense Backup',
      });

      Alert.alert('Success', 'Data exported! You can now save or share it.');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  // Clear all data
  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL transactions, wallets, and goals. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllTransactions();
              await clearAllWallets();
              await clearAllGoals();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  // About / App Info
  const handleAbout = () => {
    Alert.alert(
      'About Expen$ense',
      `Version: ${APP_VERSION}\n\nA simple and beautiful expense tracker to help you manage your finances.\n\nDeveloped with ❤️`,
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <ScrollView className="flex-1 bg-background">
        {/* Header */}
        <View
          className="bg-primary pt-16 pb-6 px-6 rounded-b-[30px]"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="flex-row items-center mb-2">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
              <Text className="text-white text-2xl">←</Text>
            </TouchableOpacity>
            <Text className="text-white text-3xl font-bold">⚙️ Settings</Text>
          </View>
          <Text className="text-white/80 text-sm ml-9">Customize your experience</Text>
        </View>

        <View className="p-6">
          {/* Preferences Section */}
          <View className="mb-6">
            <Text className="text-textSecondary text-xs font-semibold mb-3 uppercase">
              Preferences
            </Text>

            {/* Currency Selector */}
            <TouchableOpacity
              onPress={() => setCurrencyModalVisible(true)}
              className="bg-card p-4 rounded-2xl mb-3 flex-row justify-between items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center">
                <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
                  <Text className="text-xl">{currency.symbol}</Text>
                </View>
                <View>
                  <Text className="text-textPrimary font-medium text-base">Currency</Text>
                  <Text className="text-textSecondary text-xs">
                    {currency.name} ({currency.code})
                  </Text>
                </View>
              </View>
              <Text className="text-textSecondary text-xl">›</Text>
            </TouchableOpacity>

            {/* Theme Toggle */}
            <View
              className="bg-card p-4 rounded-2xl mb-3 flex-row justify-between items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center">
                <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
                  <Ionicons name="moon" size={20} color="#0891B2" />
                </View>
                <View>
                  <Text className="text-textPrimary font-medium text-base">Dark Mode</Text>
                  <Text className="text-textSecondary text-xs">Coming soon</Text>
                </View>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={handleThemeToggle}
                trackColor={{ false: '#E5E7EB', true: '#14B8A6' }}
                thumbColor="#FFFFFF"
                disabled
              />
            </View>
          </View>

          {/* Data Management Section */}
          <View className="mb-6">
            <Text className="text-textSecondary text-xs font-semibold mb-3 uppercase">
              Data Management
            </Text>

            {/* Export Data */}
            <TouchableOpacity
              onPress={handleExportData}
              className="bg-card p-4 rounded-2xl mb-3 flex-row items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="bg-income/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="download" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-textPrimary font-medium text-base">Export Data</Text>
                <Text className="text-textSecondary text-xs">
                  Save backup as JSON ({transactions.length} transactions)
                </Text>
              </View>
            </TouchableOpacity>

            {/* Clear All Data */}
            <TouchableOpacity
              onPress={handleClearAllData}
              className="bg-card p-4 rounded-2xl mb-3 flex-row items-center border border-expense/20"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="bg-expense/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="trash" size={20} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-expense font-medium text-base">Clear All Data</Text>
                <Text className="text-textSecondary text-xs">Permanently delete everything</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View className="mb-6">
            <Text className="text-textSecondary text-xs font-semibold mb-3 uppercase">About</Text>

            {/* App Info */}
            <TouchableOpacity
              onPress={handleAbout}
              className="bg-card p-4 rounded-2xl mb-3 flex-row items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="information-circle" size={20} color="#0891B2" />
              </View>
              <View className="flex-1">
                <Text className="text-textPrimary font-medium text-base">App Information</Text>
                <Text className="text-textSecondary text-xs">Version {APP_VERSION}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Stats Summary */}
          <View
            className="bg-primary/5 p-5 rounded-2xl"
            style={{
              borderWidth: 1,
              borderColor: '#14B8A620',
            }}
          >
            <Text className="text-textPrimary font-semibold text-base mb-3">Your Stats</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-textSecondary text-sm">Transactions</Text>
              <Text className="text-textPrimary font-semibold">{transactions.length}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-textSecondary text-sm">Wallets</Text>
              <Text className="text-textPrimary font-semibold">{wallets.length}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-textSecondary text-sm">Goals</Text>
              <Text className="text-textPrimary font-semibold">{goals.length}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Currency Selection Modal */}
      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[30px] pt-6 pb-8 px-6 max-h-[80%]">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-textPrimary text-xl font-bold">Select Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Currency List */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {CURRENCIES.map(curr => (
                <TouchableOpacity
                  key={curr.code}
                  onPress={() => {
                    setCurrency(curr);
                    setCurrencyModalVisible(false);
                  }}
                  className={`p-4 rounded-xl mb-2 flex-row justify-between items-center ${
                    curr.code === currency.code ? 'bg-primary/10' : 'bg-background'
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">{curr.symbol}</Text>
                    <View>
                      <Text className="text-textPrimary font-medium">{curr.name}</Text>
                      <Text className="text-textSecondary text-xs">{curr.code}</Text>
                    </View>
                  </View>
                  {curr.code === currency.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#14B8A6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
