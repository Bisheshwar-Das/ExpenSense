import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTransactions } from '../contexts/TransactionContext';
import { useWallets } from '../contexts/WalletContext';
import { Wallet } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import WalletModal from '../components/WalletModal';

export default function WalletsScreen() {
  const { transactions } = useTransactions();
  const { wallets, addWallet, updateWallet, deleteWallet } = useWallets();
  const { currency } = useSettings();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Calculate balance for each wallet
  const getWalletBalance = (walletName: string) => {
    return transactions.filter(t => t.wallet === walletName).reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate total across all wallets
  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

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
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteWallet(wallet.id),
      },
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

  return (
    <>
      <ScrollView className="flex-1 bg-background">
        {/* Header */}
        <View className="bg-primary pt-16 pb-8 px-6 rounded-b-[30px]">
          <Text className="text-white text-3xl font-bold mb-1">💰 Wallets</Text>
          <Text className="text-white/80 text-sm mb-6">Manage your accounts</Text>

          {/* Total Balance Card */}
          <View className="bg-white/15 p-5 rounded-2xl">
            <Text className="text-white/80 text-sm mb-1">Total Balance</Text>
            <Text className="text-white text-3xl font-bold">
              {currency.symbol}
              {totalBalance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Wallet List */}
        <View className="p-6">
          <Text className="text-textPrimary text-lg font-semibold mb-4">My Wallets</Text>

          {wallets.map(wallet => {
            const balance = getWalletBalance(wallet.name);
            const transactionCount = transactions.filter(t => t.wallet === wallet.name).length;

            return (
              <TouchableOpacity
                key={wallet.id}
                onPress={() => handleEditWallet(wallet)}
                onLongPress={() => handleDeleteWallet(wallet)}
                className="bg-card p-5 rounded-2xl mb-3"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {/* Wallet Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    {/* Icon with colored background */}
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: wallet.color + '20' }}
                    >
                      <Text className="text-2xl">{wallet.icon}</Text>
                    </View>

                    {/* Wallet Name */}
                    <View>
                      <Text className="text-textPrimary font-semibold text-base">
                        {wallet.name}
                      </Text>
                      <Text className="text-textSecondary text-xs">
                        {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
                      </Text>
                    </View>
                  </View>

                  {/* Arrow */}
                  <Text className="text-textSecondary text-xl">›</Text>
                </View>

                {/* Balance */}
                <View className="border-t border-border pt-3">
                  <Text className="text-textSecondary text-xs mb-1">Balance</Text>
                  <Text
                    className={`text-2xl font-bold ${
                      balance >= 0 ? 'text-income' : 'text-expense'
                    }`}
                  >
                    {balance >= 0 ? '+' : ''}
                    {currency.symbol}
                    {balance.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Add Wallet Button */}
          <TouchableOpacity
            className="bg-white border-2 border-dashed border-border p-5 rounded-2xl items-center"
            onPress={handleAddWallet}
          >
            <Text className="text-4xl mb-2">➕</Text>
            <Text className="text-textPrimary font-medium text-base">Add New Wallet</Text>
            <Text className="text-textSecondary text-xs">Create a custom wallet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add/Edit Wallet Modal */}
      <WalletModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveWallet}
        editWallet={editingWallet}
      />
    </>
  );
}
