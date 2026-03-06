// src/screens/transactions/TransactionDetailsScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../../contexts/TransactionContext';
import { useWallets } from '../../contexts/WalletContext';
import { useBudgets } from '../../contexts/BudgetContext';
import { useSavings } from '../../contexts/SavingsContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCategories } from '../../contexts/CategoryContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';

const TYPE_CONFIG = {
  expense: { color: '#EF4444', label: 'Expense', symbol: '−' },
  income: { color: '#22C55E', label: 'Income', symbol: '+' },
  transfer: { color: '#14B8A6', label: 'Transfer', symbol: '⇄' },
} as const;

export default function TransactionDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { transactions, deleteTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { budgets } = useBudgets();
  const { savingsGoals } = useSavings();
  const { currency } = useSettings();
  const { getCategoryById } = useCategories();
  const insets = useSafeAreaInsets();

  const { transactionId } = route.params;
  const transaction = transactions.find(t => t.id === transactionId);

  if (!transaction) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F8FAFC',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#64748B', fontSize: 16, marginBottom: 16 }}>Not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: '#14B8A6',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isTransfer = transaction.type === 'transfer';
  const config = TYPE_CONFIG[transaction.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.expense;

  const fromWallet = wallets.find(w => w.id === transaction.walletId);
  const toWallet = transaction.toWalletId
    ? wallets.find(w => w.id === transaction.toWalletId)
    : null;
  const toGoal = transaction.toGoalId
    ? budgets.find(g => g.id === transaction.toGoalId) ||
      savingsGoals.find(g => g.id === transaction.toGoalId)
    : null;

  const resolvedCategory = transaction.categoryId ? getCategoryById(transaction.categoryId) : null;
  const categoryDisplay = resolvedCategory
    ? `${resolvedCategory.icon}  ${resolvedCategory.name}`
    : '—';

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  const formatTime = (s: string) =>
    new Date(s).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const handleDelete = () => {
    Alert.alert('Delete?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(transaction.id);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <AppHeader
        title="Details"
        onBack={() => navigation.goBack()}
        onEdit={
          !isTransfer
            ? () => navigation.navigate('EditTransaction', { transactionId: transaction.id })
            : undefined
        }
        hideMenu
        backgroundColor={config.color}
      />

      <View style={{ backgroundColor: config.color }}>
        <View style={{ alignItems: 'center', paddingBottom: 36, paddingTop: 4 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 }}>
            {config.label}
          </Text>
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 52, letterSpacing: -1 }}>
            {currency.symbol}
            {Math.abs(transaction.amount).toFixed(2)}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 8 }}>
            {transaction.title}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: '#F8FAFC',
            height: 28,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 120 }}
      >
        <View
          style={{
            backgroundColor: '#FFF',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            marginTop: -12,
            overflow: 'hidden',
          }}
        >
          <DetailRow icon="calendar-outline" label="Date" value={formatDate(transaction.date)} />
          {transaction.hasTime && (
            <>
              <Divider />
              <DetailRow icon="time-outline" label="Time" value={formatTime(transaction.date)} />
            </>
          )}
          {isTransfer ? (
            <>
              <Divider />
              <DetailRow
                icon="wallet-outline"
                label="From"
                value={fromWallet ? `${fromWallet.icon}  ${fromWallet.name}` : 'Unknown'}
              />
              {toWallet && (
                <>
                  <Divider />
                  <DetailRow
                    icon="arrow-forward-outline"
                    label="To"
                    value={`${toWallet.icon}  ${toWallet.name}`}
                  />
                </>
              )}
              {toGoal && (
                <>
                  <Divider />
                  <DetailRow
                    icon="flag-outline"
                    label="Goal"
                    value={`${toGoal.icon}  ${toGoal.name}`}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <Divider />
              <DetailRow icon="grid-outline" label="Category" value={categoryDisplay} />
              <Divider />
              <DetailRow
                icon="wallet-outline"
                label="Wallet"
                value={fromWallet ? `${fromWallet.icon}  ${fromWallet.name}` : 'Unknown'}
              />
            </>
          )}
        </View>

        {transaction.notes ? (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                color: '#64748B',
                fontSize: 12,
                fontWeight: '600',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              Notes
            </Text>
            <View
              style={{
                backgroundColor: '#FFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                padding: 16,
              }}
            >
              <Text style={{ color: '#0F172A', fontSize: 16, lineHeight: 24 }}>
                {transaction.notes}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingBottom: insets.bottom + 12,
        }}
      >
        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.7}
          style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            borderRadius: 12,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 16 }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16 }} />;
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
        paddingVertical: 13,
      }}
    >
      <Ionicons name={icon as any} size={18} color="#94A3B8" />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: '#94A3B8',
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'uppercase',
            marginBottom: 2,
          }}
        >
          {label}
        </Text>
        <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '500' }}>{value}</Text>
      </View>
    </View>
  );
}
