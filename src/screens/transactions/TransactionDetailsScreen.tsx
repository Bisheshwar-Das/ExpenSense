// screens/TransactionDetailsScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../../contexts/TransactionContext';
import { useWallets } from '../../contexts/WalletContext';
import { useGoals } from '../../contexts/GoalContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCategories } from '../../contexts/CategoryContext';
import { RootNavigationProp, TransactionDetailsRouteProp } from '../../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';

const TYPE_CONFIG = {
  expense: { color: '#EF4444', label: 'Expense', symbol: '−' },
  income: { color: '#22C55E', label: 'Income', symbol: '+' },
  transfer: { color: '#14B8A6', label: 'Transfer', symbol: '⇄' },
} as const;

export default function TransactionDetailsScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<TransactionDetailsRouteProp>();
  const { transactions, deleteTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { goals } = useGoals();
  const { currency } = useSettings();
  const { getCategoryById, expenseCategories, incomeCategories } = useCategories();
  const insets = useSafeAreaInsets();

  const { transactionId } = route.params;
  const transaction = transactions.find(t => t.id === transactionId);

  if (!transaction) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-textSecondary text-base mb-4">Transaction not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-primary px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isTransfer = transaction.type === 'transfer';
  const config = TYPE_CONFIG[transaction.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.expense;

  const fromWallet = wallets.find(w => w.name === transaction.wallet);
  const toWallet = transaction.toWalletId
    ? wallets.find(w => w.id === transaction.toWalletId)
    : null;
  const toGoal = transaction.toGoalId ? goals.find(g => g.id === transaction.toGoalId) : null;

  // Resolve category — id first, then name fallback for old transactions
  const resolvedCategory = transaction.categoryId
    ? getCategoryById(transaction.categoryId)
    : (transaction.type === 'expense' ? expenseCategories : incomeCategories).find(
        c => c.name === transaction.category
      );
  const categoryDisplay = resolvedCategory
    ? `${resolvedCategory.icon}  ${resolvedCategory.name}`
    : transaction.category || '—';

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
    Alert.alert('Delete Transaction', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(transaction.id);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to delete transaction.');
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
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
        <View className="items-center pb-9 pt-1">
          <Text className="text-white/70 text-sm mb-1">{config.label}</Text>
          <Text className="text-white font-extrabold" style={{ fontSize: 52, letterSpacing: -1 }}>
            {currency.symbol}
            {Math.abs(transaction.amount).toFixed(2)}
          </Text>
          <Text className="text-white/65 text-sm mt-2">{transaction.title}</Text>
        </View>
        <View className="bg-background rounded-t-3xl" style={{ height: 28 }} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
      >
        <View
          className="bg-card rounded-2xl overflow-hidden"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
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
                value={fromWallet ? `${fromWallet.icon}  ${fromWallet.name}` : transaction.wallet}
              />
              {toWallet && (
                <>
                  <Divider />
                  <DetailRow
                    icon="arrow-forward-outline"
                    label="To Wallet"
                    value={`${toWallet.icon}  ${toWallet.name}`}
                  />
                </>
              )}
              {toGoal && (
                <>
                  <Divider />
                  <DetailRow
                    icon="flag-outline"
                    label="Earmarked For"
                    value={`${toGoal.icon}  ${toGoal.name}`}
                  />
                </>
              )}
              {!toWallet && !toGoal && (
                <>
                  <Divider />
                  <DetailRow icon="help-circle-outline" label="To" value="Unknown destination" />
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
                value={fromWallet ? `${fromWallet.icon}  ${fromWallet.name}` : transaction.wallet}
              />
            </>
          )}
        </View>

        {transaction.notes ? (
          <View className="mt-3">
            <SectionLabel label="Notes" />
            <View
              className="bg-card rounded-2xl"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <Text className="text-textPrimary text-base leading-6 p-4">{transaction.notes}</Text>
            </View>
          </View>
        ) : null}

        {transaction.receiptUri ? (
          <View className="mt-3">
            <SectionLabel label="Attachment" />
            <Image
              source={{ uri: transaction.receiptUri }}
              className="w-full rounded-2xl"
              style={{ height: 200 }}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.7}
          className="bg-expense/10 rounded-2xl py-4 flex-row items-center justify-center gap-2"
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text className="text-expense font-bold text-base">Delete Transaction</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
      {label}
    </Text>
  );
}
function Divider() {
  return <View className="h-px bg-border mx-4" />;
}
function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center px-4 gap-3" style={{ paddingVertical: 13 }}>
      <Ionicons name={icon as any} size={18} color="#94A3B8" />
      <View className="flex-1">
        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
          {label}
        </Text>
        <Text className="text-textPrimary text-base font-medium">{value}</Text>
      </View>
    </View>
  );
}
