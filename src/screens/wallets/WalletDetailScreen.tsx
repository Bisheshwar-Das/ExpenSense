// src/screens/wallets/WalletDetailScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../../contexts/TransactionContext';
import { useWallets } from '../../contexts/WalletContext';
import { useSettings } from '../../contexts/SettingsContext';
import { RootStackParamList } from '../../navigation/types';
import TransactionRow from '../../components/TransactionRow';
import WalletModal from '../../components/WalletModal';
import AppHeader from '../../components/AppHeader';
import { Wallet } from '../../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type WalletDetailRouteProp = RouteProp<RootStackParamList, 'WalletDetail'>;

function getCreditAvailableColor(used: number, limit: number): string {
  if (limit === 0) return '#22C55E';
  const pct = used / limit;
  if (pct >= 0.9) return '#EF4444';
  if (pct >= 0.7) return '#F97316';
  if (pct >= 0.5) return '#F59E0B';
  return '#22C55E';
}

export default function WalletDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<WalletDetailRouteProp>();
  const { wallets, updateWallet } = useWallets();
  const { transactions, deleteTransaction } = useTransactions();
  const { currency } = useSettings();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [period, setPeriod] = useState<'month' | 'all'>('month');

  const { walletId } = route.params;
  const wallet = wallets.find(w => w.id === walletId);

  if (!wallet) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-textSecondary text-base mb-4">Wallet not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-primary px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCreditType = wallet.type === 'credit';

  const balance = transactions.reduce((sum, t) => {
    if (t.type === 'transfer') {
      if (t.walletId === wallet.id) return sum - t.amount;
      if (t.toWalletId === walletId) return sum + t.amount;
      return sum;
    }
    if (t.walletId === wallet.id) return sum + t.amount;
    return sum;
  }, 0);

  const amountOwed = Math.abs(balance);
  const available = wallet.creditLimit ? Math.max(wallet.creditLimit + balance, 0) : null;
  const usagePct = wallet.creditLimit ? amountOwed / wallet.creditLimit : 0;
  const availColor = wallet.creditLimit
    ? getCreditAvailableColor(amountOwed, wallet.creditLimit)
    : '#22C55E';

  const now = new Date();
  const walletTransactions = transactions
    .filter(t => t.walletId === wallet.id || t.toWalletId === wallet.id)
    .filter(t => {
      if (period === 'month') {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    })
    .filter(t => filterType === 'all' || t.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Transaction', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(id);
          } catch {
            Alert.alert('Error', 'Failed to delete transaction');
          }
        },
      },
    ]);
  };

  const handleSaveWallet = async (walletData: Omit<Wallet, 'id' | 'createdAt'>) => {
    try {
      await updateWallet(wallet.id, walletData);
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to update wallet.');
    }
  };

  const renderRightActions = (id: string, title: string) => (
    <TouchableOpacity
      onPress={() => handleDelete(id, title)}
      className="bg-expense justify-center items-center px-5 mb-3 rounded-xl ml-2 gap-1"
    >
      <Ionicons name="trash-outline" size={20} color="#fff" />
      <Text className="text-white text-xs font-semibold">Delete</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        title={wallet.name}
        subtitle={wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1)}
        onBack={() => navigation.goBack()}
        onEdit={() => setModalVisible(true)}
        hideMenu
        backgroundColor={wallet.color}
      >
        {/* Balance */}
        <View className="items-center mb-2">
          <Text style={{ fontSize: 42, marginBottom: 4 }}>{wallet.icon}</Text>
          <Text className="text-white/70 text-sm mb-1">
            {isCreditType ? 'Amount Owed' : 'Balance'}
          </Text>
          <Text className="text-white font-extrabold" style={{ fontSize: 44, letterSpacing: -1 }}>
            {currency.symbol}
            {isCreditType ? amountOwed.toFixed(2) : Math.abs(balance).toFixed(2)}
          </Text>
          {!isCreditType && balance < 0 && (
            <Text className="text-white/60 text-sm mt-1">Negative balance</Text>
          )}
        </View>

        {/* Credit bar */}
        {isCreditType && wallet.creditLimit && (
          <View className="mt-2">
            <View className="h-2 bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${Math.min(usagePct * 100, 100)}%`, backgroundColor: availColor }}
              />
            </View>
            <View className="flex-row justify-between mt-1.5">
              <Text className="text-white/60 text-xs">
                {currency.symbol}
                {amountOwed.toFixed(0)} used
              </Text>
              <Text
                className="text-xs font-semibold"
                style={{ color: availColor === '#22C55E' ? '#fff' : availColor }}
              >
                {currency.symbol}
                {available?.toFixed(0)} available
              </Text>
            </View>
            {usagePct >= 0.9 && (
              <Text className="text-center text-xs mt-1.5" style={{ color: '#FCA5A5' }}>
                ⚠️ Nearly maxed out
              </Text>
            )}
          </View>
        )}
      </AppHeader>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {/* Period toggle */}
        <View
          className="bg-card rounded-2xl p-1.5 flex-row gap-1 mb-3"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          {(['month', 'all'] as const).map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              activeOpacity={0.7}
              className={`flex-1 py-2.5 rounded-xl items-center ${period === p ? 'bg-primary' : ''}`}
            >
              <Text
                className={`font-semibold text-sm ${period === p ? 'text-white' : 'text-textSecondary'}`}
              >
                {p === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Type filter */}
        <View
          className="flex-row mb-4 bg-card rounded-2xl p-1.5 gap-1"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          {(['all', 'income', 'expense', 'transfer'] as const).map(f => {
            const active = filterType === f;
            const colors = {
              all: { active: '#14B8A6', text: '#14B8A6' },
              income: { active: '#22C55E', text: '#22C55E' },
              expense: { active: '#EF4444', text: '#EF4444' },
              transfer: { active: '#14B8A6', text: '#14B8A6' },
            };
            const c = colors[f];
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilterType(f)}
                activeOpacity={0.7}
                className="flex-1 py-2.5 rounded-xl items-center"
                style={{ backgroundColor: active ? c.active : 'transparent' }}
              >
                <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : c.text }}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section header */}
        <View className="flex-row items-center gap-3 mb-3">
          <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider">
            Transactions
          </Text>
          <View className="flex-1 h-px bg-border" />
          <Text className="text-textSecondary text-xs font-semibold">
            {walletTransactions.length}
          </Text>
        </View>

        {/* List */}
        {walletTransactions.length === 0 ? (
          <View
            className="bg-card rounded-2xl p-8 items-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 36, marginBottom: 12 }}>💸</Text>
            <Text className="text-textPrimary font-semibold text-base mb-1">No transactions</Text>
            <Text className="text-textSecondary text-sm text-center">
              {filterType !== 'all' || period === 'month'
                ? 'No transactions match the current filter'
                : 'Transactions linked to this wallet will appear here'}
            </Text>
          </View>
        ) : (
          walletTransactions.map(t => (
            <Swipeable
              key={t.id}
              renderRightActions={() => renderRightActions(t.id, t.title)}
              overshootRight={false}
            >
              <TransactionRow
                transaction={t}
                onPress={id => navigation.navigate('TransactionDetails', { transactionId: id })}
              />
            </Swipeable>
          ))
        )}
      </ScrollView>

      <WalletModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveWallet}
        editWallet={wallet}
      />
    </View>
  );
}
