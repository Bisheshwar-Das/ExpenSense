// screens/WalletsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTransactions } from '../contexts/TransactionContext';
import { useWallets } from '../contexts/WalletContext';
import { Wallet, WalletType, WALLET_TYPES, SAVINGS_WALLET_TYPES } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import WalletModal from '../components/WalletModal';
import AppHeader from '@/components/AppHeader';

const TYPE_BADGE: Record<WalletType, { label: string; color: string; bg: string }> = {
  checking: { label: 'Checking', color: '#0891B2', bg: '#0891B220' },
  savings: { label: 'Savings', color: '#8B5CF6', bg: '#8B5CF620' },
  cash: { label: 'Cash', color: '#10B981', bg: '#10B98120' },
  credit: { label: 'Credit', color: '#F59E0B', bg: '#F59E0B20' },
  investment: { label: 'Investment', color: '#6366F1', bg: '#6366F120' },
};

export default function WalletsScreen() {
  const { transactions } = useTransactions();
  const { wallets, addWallet, updateWallet, deleteWallet } = useWallets();
  const { currency } = useSettings();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const getWalletBalance = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return 0;

    return transactions.reduce((sum, t) => {
      if (t.type === 'transfer') {
        if (t.wallet === wallet.name) return sum - t.amount;
        if (t.toWalletId === walletId) return sum + t.amount;
        return sum;
      }
      if (t.wallet === wallet.name) return sum + t.amount;
      return sum;
    }, 0);
  };

  const totalBalance = wallets.reduce((sum, w) => sum + getWalletBalance(w.id), 0);

  // Group wallets by type for display
  const savingsWallets = wallets.filter(w => SAVINGS_WALLET_TYPES.includes(w.type ?? 'checking'));
  const otherWallets = wallets.filter(w => !SAVINGS_WALLET_TYPES.includes(w.type ?? 'checking'));

  const handleAddWallet = () => {
    setEditingWallet(null);
    setModalVisible(true);
  };
  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setModalVisible(true);
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    const transactionCount = transactions.filter(t => t.wallet === wallet.name).length;
    if (transactionCount > 0) {
      Alert.alert(
        'Cannot Delete',
        `This wallet has ${transactionCount} transaction(s). Please move or delete them first.`,
        [{ text: 'OK' }]
      );
      return;
    }
    Alert.alert('Delete Wallet', `Are you sure you want to delete "${wallet.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWallet(wallet.id) },
    ]);
  };

  const handleSaveWallet = async (walletData: Omit<Wallet, 'id' | 'createdAt'>) => {
    try {
      if (editingWallet) {
        await updateWallet(editingWallet.id, walletData);
      } else {
        await addWallet(walletData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save wallet. Please try again.');
    }
  };

  const renderWalletCard = (wallet: Wallet) => {
    const balance = getWalletBalance(wallet.id);
    const transactionCount = transactions.filter(t => t.wallet === wallet.name).length;
    const walletType = wallet.type ?? 'checking';
    const badge = TYPE_BADGE[walletType];
    const isCreditType = walletType === 'credit';
    // For credit wallets balance is a liability — flip the color logic
    const balancePositive = isCreditType ? balance <= 0 : balance >= 0;

    return (
      <TouchableOpacity
        key={wallet.id}
        onPress={() => handleEditWallet(wallet)}
        onLongPress={() => handleDeleteWallet(wallet)}
        className="bg-card rounded-2xl mb-3 overflow-hidden"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Card body */}
        <View className="p-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: wallet.color + '20' }}
              >
                <Text className="text-2xl">{wallet.icon}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-textPrimary font-semibold text-base">{wallet.name}</Text>
                  {/* Type badge */}
                  <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: badge.bg }}>
                    <Text className="text-xs font-semibold" style={{ color: badge.color }}>
                      {badge.label}
                    </Text>
                  </View>
                </View>
                <Text className="text-textSecondary text-xs mt-0.5">
                  {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
                </Text>
              </View>
            </View>
            <Text className="text-textSecondary text-xl">›</Text>
          </View>
        </View>

        {/* Balance footer */}
        <View className="border-t border-border px-5 py-3 flex-row justify-between items-center">
          <Text className="text-textSecondary text-xs">
            {isCreditType ? 'Amount Owed' : 'Balance'}
          </Text>
          <View className="items-end">
            <Text
              className={`text-xl font-bold ${balancePositive ? 'text-income' : 'text-expense'}`}
            >
              {isCreditType
                ? `${currency.symbol}${Math.abs(balance).toFixed(2)}`
                : `${balance >= 0 ? '+' : ''}${currency.symbol}${balance.toFixed(2)}`}
            </Text>
            {/* Credit limit indicator */}
            {isCreditType && wallet.creditLimit && (
              <Text className="text-textSecondary text-xs">
                Limit: {currency.symbol}
                {wallet.creditLimit.toFixed(0)}
                {'  '}
                Available: {currency.symbol}
                {Math.max(wallet.creditLimit + balance, 0).toFixed(0)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ScrollView className="flex-1 bg-background">
        <AppHeader icon="💰" title="Wallets" subtitle="Manage your accounts">
          <View className="bg-white/15 p-5 rounded-2xl">
            <Text className="text-white/80 text-sm mb-1">Total Balance</Text>
            <Text className="text-white text-3xl font-bold">
              {currency.symbol}
              {totalBalance.toFixed(2)}
            </Text>
          </View>
        </AppHeader>

        <View className="p-6">
          {/* Savings wallets group */}
          {savingsWallets.length > 0 && (
            <>
              <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wide mb-3">
                Savings & Cash
              </Text>
              {savingsWallets.map(renderWalletCard)}
              <View className="mb-4" />
            </>
          )}

          {/* Other wallets group */}
          {otherWallets.length > 0 && (
            <>
              <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wide mb-3">
                {savingsWallets.length > 0 ? 'Other Wallets' : 'My Wallets'}
              </Text>
              {otherWallets.map(renderWalletCard)}
            </>
          )}

          {wallets.length === 0 && (
            <View className="bg-card p-8 rounded-xl items-center mb-4">
              <Text className="text-4xl mb-3">👛</Text>
              <Text className="text-textPrimary font-medium text-base mb-1">No wallets yet</Text>
              <Text className="text-textSecondary text-sm text-center">
                Add a wallet to get started
              </Text>
            </View>
          )}

          <TouchableOpacity
            className="bg-white border-2 border-dashed border-border p-5 rounded-2xl items-center mt-2"
            onPress={handleAddWallet}
          >
            <Text className="text-4xl mb-2">➕</Text>
            <Text className="text-textPrimary font-medium text-base">Add New Wallet</Text>
            <Text className="text-textSecondary text-xs">Create a custom wallet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <WalletModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveWallet}
        editWallet={editingWallet}
      />
    </>
  );
}
