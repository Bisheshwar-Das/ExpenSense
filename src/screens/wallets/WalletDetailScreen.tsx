// src/screens/wallets/WalletsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { useTransactions } from '../../contexts/TransactionContext';
import { useWallets } from '../../contexts/WalletContext';
import { Wallet, WalletType } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import WalletModal from '../../components/WalletModal';
import AppHeader from '../../components/AppHeader';
import { Ionicons } from '@expo/vector-icons';

const TYPE_BADGE: Record<WalletType, { label: string; color: string; bg: string }> = {
  checking: { label: 'Checking', color: '#0891B2', bg: '#0891B220' },
  savings: { label: 'Savings', color: '#8B5CF6', bg: '#8B5CF620' },
  cash: { label: 'Cash', color: '#10B981', bg: '#10B98120' },
  credit: { label: 'Credit', color: '#F59E0B', bg: '#F59E0B20' },
  investment: { label: 'Investment', color: '#6366F1', bg: '#6366F120' },
};

function getCreditAvailableColor(used: number, limit: number): string {
  if (limit === 0) return '#22C55E';
  const pct = used / limit;
  if (pct >= 0.9) return '#EF4444';
  if (pct >= 0.7) return '#F97316';
  if (pct >= 0.5) return '#F59E0B';
  return '#22C55E';
}

export default function WalletsScreen() {
  const navigation = useNavigation<any>();
  const { transactions } = useTransactions();
  const { wallets, addWallet, updateWallet, deleteWallet } = useWallets();
  const { currency } = useSettings();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const getWalletBalance = (walletId: string) => {
    return transactions.reduce((sum, t) => {
      if (t.type === 'transfer') {
        if (t.walletId === walletId) return sum - t.amount;
        if (t.toWalletId === walletId) return sum + t.amount;
        return sum;
      }
      if (t.walletId === walletId) return sum + t.amount;
      return sum;
    }, 0);
  };

  const creditWallets = wallets.filter(w => w.type === 'credit');
  const assetWallets = wallets.filter(w => w.type !== 'credit');
  const totalAssets = assetWallets.reduce((sum, w) => sum + getWalletBalance(w.id), 0);
  const totalOwed = creditWallets.reduce((sum, w) => sum + Math.abs(getWalletBalance(w.id)), 0);
  const netWorth = totalAssets - totalOwed;

  const checkingWallets = wallets.filter(w => w.type === 'checking');
  const savingsWallets = wallets.filter(w => w.type === 'savings' || w.type === 'cash');
  const creditWalletList = wallets.filter(w => w.type === 'credit');
  const investmentWallets = wallets.filter(w => w.type === 'investment');

  const handleAddWallet = () => {
    setEditingWallet(null);
    setModalVisible(true);
  };

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setModalVisible(true);
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    const count = transactions.filter(
      t => t.walletId === wallet.id || t.toWalletId === wallet.id
    ).length;
    if (count > 0) {
      Alert.alert(
        'Cannot Delete',
        `This wallet has ${count} transaction(s). Please move or delete them first.`,
        [{ text: 'OK' }]
      );
      return;
    }
    Alert.alert('Delete Wallet', `Delete "${wallet.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWallet(wallet.id) },
    ]);
  };

  const handleSaveWallet = async (walletData: Omit<Wallet, 'id' | 'createdAt'>) => {
    try {
      if (editingWallet) await updateWallet(editingWallet.id, walletData);
      else await addWallet(walletData);
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to save wallet. Please try again.');
    }
  };

  const handleWalletPress = (wallet: Wallet) => {
    navigation.navigate('WalletDetail', { walletId: wallet.id });
  };

  const renderRightActions = (wallet: Wallet) => (
    <View className="flex-row gap-2 mb-3 ml-2">
      <TouchableOpacity
        onPress={() => handleEditWallet(wallet)}
        className="bg-primary justify-center items-center px-4 rounded-2xl gap-1"
      >
        <Ionicons name="pencil-outline" size={18} color="#fff" />
        <Text className="text-white text-xs font-semibold">Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleDeleteWallet(wallet)}
        className="bg-expense justify-center items-center px-4 rounded-2xl gap-1"
      >
        <Ionicons name="trash-outline" size={18} color="#fff" />
        <Text className="text-white text-xs font-semibold">Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWalletCard = (wallet: Wallet) => {
    const balance = getWalletBalance(wallet.id);
    const count = transactions.filter(
      t => t.walletId === wallet.id || t.toWalletId === wallet.id
    ).length;
    const walletType = wallet.type ?? 'checking';
    const badge = TYPE_BADGE[walletType];
    const isCreditType = walletType === 'credit';

    const amountOwed = Math.abs(balance);
    const available = wallet.creditLimit ? Math.max(wallet.creditLimit + balance, 0) : null;
    const usagePct = wallet.creditLimit ? amountOwed / wallet.creditLimit : 0;
    const availColor = wallet.creditLimit
      ? getCreditAvailableColor(amountOwed, wallet.creditLimit)
      : '#22C55E';

    return (
      <Swipeable
        key={wallet.id}
        renderRightActions={() => renderRightActions(wallet)}
        overshootRight={false}
      >
        <TouchableOpacity
          onPress={() => handleWalletPress(wallet)}
          activeOpacity={0.7}
          className="bg-card rounded-2xl mb-3"
          style={{
            shadowColor: wallet.color,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {/* Card body */}
          <View className="px-4 py-4 overflow-hidden rounded-2xl">
            <View className="flex-row items-center">
              <View
                className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: wallet.color + '20' }}
              >
                <Text style={{ fontSize: 22 }}>{wallet.icon}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-textPrimary font-semibold text-base">{wallet.name}</Text>
                  <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: badge.bg }}>
                    <Text className="text-xs font-semibold" style={{ color: badge.color }}>
                      {badge.label}
                    </Text>
                  </View>
                </View>
                {(() => {
                  const last = transactions
                    .filter(t => t.walletId === wallet.id || t.toWalletId === wallet.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                  return (
                    <Text className="text-textSecondary text-xs">
                      {last
                        ? `Last active: ${new Date(last.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : 'No activity yet'}
                    </Text>
                  );
                })()}
              </View>
              <Text
                className={`text-base font-bold ${isCreditType ? (amountOwed > 0 ? 'text-expense' : 'text-income') : balance >= 0 ? 'text-income' : 'text-expense'}`}
              >
                {isCreditType
                  ? `${currency.symbol}${amountOwed.toFixed(2)}`
                  : `${currency.symbol}${Math.abs(balance).toFixed(2)}`}
              </Text>
            </View>

            {/* Credit usage bar */}
            {isCreditType && wallet.creditLimit && (
              <View className="mt-3">
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-textSecondary text-xs">
                    {currency.symbol}
                    {amountOwed.toFixed(2)} used of {currency.symbol}
                    {wallet.creditLimit.toFixed(0)}
                  </Text>
                  <Text className="text-xs font-semibold" style={{ color: availColor }}>
                    {currency.symbol}
                    {available?.toFixed(0)} available
                  </Text>
                </View>
                {/* Progress bar */}
                <View className="h-1.5 bg-border rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(usagePct * 100, 100)}%`,
                      backgroundColor: availColor,
                    }}
                  />
                </View>
                {usagePct >= 0.9 && (
                  <Text className="text-expense text-xs mt-1">⚠️ Nearly maxed out</Text>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <>
      <ScrollView className="flex-1 bg-background">
        <AppHeader title="Wallets" subtitle="Manage your accounts" titleAlign="left">
          {/* Summary card */}
          <View className="bg-white/10 rounded-2xl p-4 gap-3">
            {creditWallets.length > 0 ? (
              <>
                {/* Net worth — primary */}
                <View className="items-center pb-3 border-b border-white/20">
                  <Text className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                    Net Worth
                  </Text>
                  <Text
                    className="text-white font-extrabold"
                    style={{ fontSize: 36, letterSpacing: -1 }}
                  >
                    {currency.symbol}
                    {Math.abs(netWorth).toFixed(2)}
                  </Text>
                  {netWorth < 0 && (
                    <Text className="text-orange-300 text-xs mt-1">You owe more than you own</Text>
                  )}
                </View>
                {/* Assets + Owed */}
                <View className="flex-row">
                  <View className="flex-1 items-center">
                    <Text className="text-white/60 text-xs mb-0.5">Assets</Text>
                    <Text className="text-white font-bold text-base">
                      {currency.symbol}
                      {totalAssets.toFixed(2)}
                    </Text>
                  </View>
                  <View className="w-px bg-white/20" />
                  <View className="flex-1 items-center">
                    <Text className="text-white/60 text-xs mb-0.5">Credit Owed</Text>
                    <Text
                      className="font-bold text-base"
                      style={{ color: totalOwed > 0 ? '#FED7AA' : '#fff' }}
                    >
                      {currency.symbol}
                      {totalOwed.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View className="items-center py-2">
                <Text className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                  Total Balance
                </Text>
                <Text
                  className="text-white font-extrabold"
                  style={{ fontSize: 36, letterSpacing: -1 }}
                >
                  {currency.symbol}
                  {totalAssets.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </AppHeader>

        <View className="px-4 pt-4 pb-8">
          {[
            { label: 'Checking', emoji: '👛', list: checkingWallets },
            { label: 'Savings & Cash', emoji: '🏦', list: savingsWallets },
            { label: 'Credit Cards', emoji: '💳', list: creditWalletList },
            { label: 'Investments', emoji: '📈', list: investmentWallets },
          ]
            .filter(group => group.list.length > 0)
            .map(group => (
              <View key={group.label} className="mb-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <Text style={{ fontSize: 13 }}>{group.emoji}</Text>
                  <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider">
                    {group.label}
                  </Text>
                  <View className="flex-1 h-px bg-border" />
                  <Text className="text-textSecondary text-xs font-semibold">
                    {group.list.length}
                  </Text>
                </View>
                {group.list.map(renderWalletCard)}
              </View>
            ))}

          {wallets.length === 0 && (
            <View
              className="bg-card rounded-2xl p-8 items-center mb-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <Text style={{ fontSize: 36, marginBottom: 12 }}>👛</Text>
              <Text className="text-textPrimary font-semibold text-base mb-1">No wallets yet</Text>
              <Text className="text-textSecondary text-sm text-center">
                Add a wallet to get started
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleAddWallet}
            activeOpacity={0.7}
            className="bg-card border border-dashed border-border rounded-2xl py-5 items-center gap-1.5 mt-2"
          >
            <View className="w-10 h-10 rounded-full bg-filterBar items-center justify-center">
              <Ionicons name="add" size={22} color="#14B8A6" />
            </View>
            <Text className="text-textPrimary font-medium text-sm mt-1">Add New Wallet</Text>
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
