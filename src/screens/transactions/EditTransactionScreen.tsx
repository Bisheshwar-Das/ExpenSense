// src/screens/transactions/EditTransactionScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Category } from '../../types';
import { useTransactions } from '../../contexts/TransactionContext';
import { useWallets } from '../../contexts/WalletContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCategories } from '../../contexts/CategoryContext';
import CategoryPicker from '../../components/pickers/CategoryPicker';
import WalletPicker from '../../components/pickers/WalletPicker';
import TransferToPicker from '../../components/pickers/TransferToPicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppHeader from '../../components/AppHeader';

type FullTransactionType = 'expense' | 'income' | 'transfer';

const TYPE_CONFIG = {
  expense: { label: 'Expense', color: '#EF4444' },
  income: { label: 'Income', color: '#22C55E' },
  transfer: { label: '⇄ Transfer', color: '#14B8A6' },
} as const;

function parseAmountParts(amount: string) {
  if (!amount) return { dollars: '', cents: '.00', hasDecimal: false };
  const [whole, frac] = amount.split('.');
  if (frac !== undefined)
    return { dollars: whole, cents: '.' + frac.padEnd(2, '0').slice(0, 2), hasDecimal: true };
  return { dollars: whole, cents: '.00', hasDecimal: false };
}

const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export default function EditTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { transactions, updateTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { currency } = useSettings();
  const { getCategoryById } = useCategories();
  const insets = useSafeAreaInsets();

  const { transactionId } = route.params;
  const transaction = transactions.find(t => t.id === transactionId);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<FullTransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [toGoalId, setToGoalId] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [hasTime, setHasTime] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (!transaction) return;
    setTitle(transaction.title);
    setAmount(Math.abs(transaction.amount).toString());
    setType(transaction.type as FullTransactionType);
    setNotes(transaction.notes || '');
    setSelectedWalletId(transaction.walletId);
    setDate(new Date(transaction.date));
    setHasTime(transaction.hasTime || false);
    setToWalletId(transaction.toWalletId || '');
    setToGoalId(transaction.toGoalId || '');
    if (transaction.type !== 'transfer' && transaction.categoryId) {
      setSelectedCategory(getCategoryById(transaction.categoryId) ?? null);
    }
  }, [transaction]);

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
        <Text style={{ color: '#64748B', fontSize: 16, marginBottom: 16 }}>
          Transaction not found
        </Text>
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

  const config = TYPE_CONFIG[type];
  const displayAmount = parseAmountParts(amount);

  const isValid = useMemo(() => {
    const base = title.trim() !== '' && amount !== '' && parseFloat(amount) > 0;
    return type === 'transfer' ? base : base && selectedCategory !== null;
  }, [title, amount, type, selectedCategory]);

  const handleTypeChange = (t: FullTransactionType) => {
    setType(t);
    setSelectedCategory(null);
    setToWalletId('');
    setToGoalId('');
  };

  const handleSave = async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    try {
      await updateTransaction(transaction.id, {
        title: title.trim(),
        amount: parseFloat(amount),
        type,
        categoryId: type === 'transfer' ? 'transfer' : (selectedCategory?.id ?? ''),
        walletId: selectedWalletId,
        date: date.toISOString(),
        hasTime,
        notes: notes || undefined,
        toWalletId: type === 'transfer' ? toWalletId || undefined : undefined,
        toGoalId: type === 'transfer' ? toGoalId || undefined : undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <AppHeader
        title="Edit Transaction"
        onBack={() => navigation.goBack()}
        onEdit={handleSave}
        editLabel="Save"
        hideMenu
        backgroundColor={config.color}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Amount hero */}
        <View style={{ backgroundColor: config.color }}>
          <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 36 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: '700',
                  marginRight: 4,
                  fontSize: 42,
                }}
              >
                {currency.symbol}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 52, letterSpacing: -1 }}>
                  {displayAmount.dollars || '0'}
                </Text>
                <Text
                  style={{
                    fontWeight: '800',
                    fontSize: 52,
                    letterSpacing: -1,
                    color: displayAmount.hasDecimal ? '#fff' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {displayAmount.cents}
                </Text>
              </View>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8 }}>
              Editing amount
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

        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: -14 }}>
          {/* Type toggle */}
          <View
            style={{
              backgroundColor: '#FFF',
              borderRadius: 16,
              padding: 6,
              flexDirection: 'row',
              gap: 4,
            }}
          >
            {(Object.keys(TYPE_CONFIG) as FullTransactionType[]).map(t => {
              const active = type === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => handleTypeChange(t)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: active ? TYPE_CONFIG[t].color : 'transparent',
                  }}
                >
                  <Text
                    style={{ fontWeight: '600', fontSize: 14, color: active ? '#FFF' : '#94A3B8' }}
                  >
                    {TYPE_CONFIG[t].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Amount input */}
          <View>
            <Text style={labelStyle}>
              Amount <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#CBD5E1"
              style={inputStyle}
            />
          </View>

          {/* Description */}
          <View>
            <Text style={labelStyle}>
              Description <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Lunch, Monthly salary…"
              placeholderTextColor="#CBD5E1"
              style={inputStyle}
            />
          </View>

          {/* Category */}
          {type !== 'transfer' && (
            <CategoryPicker
              type={type}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          )}

          {/* Wallet */}
          <WalletPicker
            label={type === 'transfer' ? 'From' : 'Wallet'}
            selectedWalletId={selectedWalletId}
            onSelectWallet={setSelectedWalletId}
          />

          {/* Transfer destination */}
          {type === 'transfer' && (
            <TransferToPicker
              selectedWalletId={toWalletId}
              selectedGoalId={toGoalId}
              excludeWalletId={selectedWalletId}
              onSelectWallet={v => {
                setToWalletId(v);
                setToGoalId('');
              }}
              onSelectGoal={setToGoalId}
            />
          )}

          {/* Date */}
          <View>
            <Text style={labelStyle}>Date</Text>
            <View
              style={{
                backgroundColor: '#FFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                overflow: 'hidden',
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setTempDate(date);
                  setShowDatePicker(true);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  gap: 12,
                }}
              >
                <Ionicons name="calendar-outline" size={18} color="#14B8A6" />
                <Text style={{ flex: 1, color: '#0F172A', fontSize: 16 }}>{formatDate(date)}</Text>
                <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16 }} />
              {hasTime ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: 12,
                  }}
                >
                  <Ionicons name="time-outline" size={18} color="#14B8A6" />
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      setTempDate(date);
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={{ color: '#0F172A', fontSize: 16 }}>{formatTime(date)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const d = new Date(date);
                      d.setHours(0, 0, 0, 0);
                      setDate(d);
                      setHasTime(false);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setTempDate(date);
                    setShowTimePicker(true);
                    setHasTime(true);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: 12,
                  }}
                >
                  <Ionicons name="time-outline" size={18} color="#CBD5E1" />
                  <Text style={{ flex: 1, color: '#94A3B8', fontSize: 14 }}>
                    Add time (optional)
                  </Text>
                  <Ionicons name="add-circle-outline" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Notes */}
          <View>
            <Text style={labelStyle}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any extra notes…"
              placeholderTextColor="#CBD5E1"
              multiline
              numberOfLines={3}
              style={[inputStyle, { minHeight: 70 }]}
            />
          </View>

          {/* Validation chips */}
          {!isValid && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(!amount || parseFloat(amount) <= 0) && <MissingChip label="Amount" />}
              {!title.trim() && <MissingChip label="Description" />}
              {type !== 'transfer' && !selectedCategory && <MissingChip label="Category" />}
            </View>
          )}

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isValid || isSaving}
            activeOpacity={0.8}
            style={{
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              backgroundColor: isValid && !isSaving ? config.color : '#E2E8F0',
              opacity: isValid && !isSaving ? 1 : 0.5,
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                style={{ fontWeight: '700', fontSize: 16, color: isValid ? '#FFF' : '#94A3B8' }}
              >
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date picker */}
      {Platform.OS === 'ios' ? (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#FFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
              onPress={e => e.stopPropagation()}
            >
              <PickerHeader
                title="Select Date"
                onCancel={() => setShowDatePicker(false)}
                onDone={() => {
                  setDate(tempDate);
                  setShowDatePicker(false);
                }}
              />
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={(_, d) => {
                  if (d) setTempDate(d);
                }}
                textColor="#0F172A"
                style={{ backgroundColor: '#fff', height: 200 }}
              />
              <View style={{ height: insets.bottom + 16 }} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) setDate(d);
            }}
          />
        )
      )}

      {/* Time picker */}
      {Platform.OS === 'ios' ? (
        <Modal visible={showTimePicker} transparent animationType="slide">
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
            onPress={() => {
              setShowTimePicker(false);
              setHasTime(false);
            }}
          >
            <Pressable
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#FFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
              onPress={e => e.stopPropagation()}
            >
              <PickerHeader
                title="Select Time"
                onCancel={() => {
                  setShowTimePicker(false);
                  setHasTime(false);
                }}
                onDone={() => {
                  setDate(tempDate);
                  setHasTime(true);
                  setShowTimePicker(false);
                }}
              />
              <DateTimePicker
                value={tempDate}
                mode="time"
                display="spinner"
                onChange={(_, d) => {
                  if (d) setTempDate(d);
                }}
                textColor="#0F172A"
                style={{ backgroundColor: '#fff', height: 200 }}
              />
              <View style={{ height: insets.bottom + 16 }} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={(_, d) => {
              setShowTimePicker(false);
              if (d) {
                setDate(d);
                setHasTime(true);
              }
            }}
          />
        )
      )}
    </KeyboardAvoidingView>
  );
}

function MissingChip({ label }: { label: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Ionicons name="alert-circle" size={12} color="#EF4444" />
      <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

function PickerHeader({
  title,
  onCancel,
  onDone,
}: {
  title: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}
    >
      <TouchableOpacity onPress={onCancel}>
        <Text style={{ color: '#64748B', fontSize: 16 }}>Cancel</Text>
      </TouchableOpacity>
      <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '700' }}>{title}</Text>
      <TouchableOpacity onPress={onDone}>
        <Text style={{ color: '#14B8A6', fontSize: 16, fontWeight: '700' }}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const labelStyle = {
  color: '#64748B',
  fontSize: 12,
  fontWeight: '600' as const,
  marginBottom: 8,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
};
const inputStyle = {
  backgroundColor: '#FFF',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  color: '#0F172A',
  borderWidth: 1,
  borderColor: '#E2E8F0',
};
