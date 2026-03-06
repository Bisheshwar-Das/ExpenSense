// src/screens/transactions/AddTransactionScreen.tsx
import React, { useState, useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Category } from '../../types';
import { useTransactions } from '../../contexts/TransactionContext';
import { useWallets } from '../../contexts/WalletContext';
import { useSettings } from '../../contexts/SettingsContext';
import CategoryPicker from '../../components/pickers/CategoryPicker';
import WalletPicker from '../../components/pickers/WalletPicker';
import TransferToPicker from '../../components/pickers/TransferToPicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppHeader from '../../components/AppHeader';

export type FullTransactionType = 'expense' | 'income' | 'transfer';

const TYPE_CONFIG = {
  expense: { label: 'Expense', symbol: '−', color: '#EF4444', bg: '#FEF2F2' },
  income: { label: 'Income', symbol: '+', color: '#22C55E', bg: '#F0FDF4' },
  transfer: { label: '⇄ Transfer', symbol: '⇄', color: '#14B8A6', bg: '#F0FDF9' },
} as const;

interface FormState {
  title: string;
  amount: string;
  type: FullTransactionType;
  selectedCategory: Category | null;
  selectedWalletId: string;
  toWalletId: string;
  toGoalId: string;
  notes: string;
  date: Date;
  hasTime: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: 'SET_TYPE'; value: FullTransactionType }
  | { type: 'SET_TRANSFER_DEST'; toWalletId: string; toGoalId: string }
  | { type: 'RESET'; defaultWalletId: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_TYPE':
      return { ...state, type: action.value, selectedCategory: null, toWalletId: '', toGoalId: '' };
    case 'SET_TRANSFER_DEST':
      return { ...state, toWalletId: action.toWalletId, toGoalId: action.toGoalId };
    case 'RESET':
      return {
        title: '',
        amount: '',
        type: 'expense',
        selectedCategory: null,
        selectedWalletId: action.defaultWalletId,
        toWalletId: '',
        toGoalId: '',
        notes: '',
        date: new Date(),
        hasTime: false,
      };
  }
}

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

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const { addTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { currency } = useSettings();
  const insets = useSafeAreaInsets();

  const amountInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const successScale = useRef(new Animated.Value(0.88)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const defaultWalletId = wallets[0]?.id ?? '';

  const [form, dispatch] = useReducer(formReducer, {
    title: '',
    amount: '',
    type: 'expense',
    selectedCategory: null,
    selectedWalletId: defaultWalletId,
    toWalletId: '',
    toGoalId: '',
    notes: '',
    date: new Date(),
    hasTime: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [snapshot, setSnapshot] = useState<{
    amount: string;
    title: string;
    type: FullTransactionType;
  } | null>(null);

  useEffect(() => {
    if (wallets.length > 0 && !form.selectedWalletId)
      dispatch({ type: 'SET_FIELD', field: 'selectedWalletId', value: wallets[0].id });
  }, [wallets]);

  useEffect(() => {
    if (showSuccessModal) {
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 260,
        }),
        Animated.timing(successOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      successScale.setValue(0.88);
      successOpacity.setValue(0);
    }
  }, [showSuccessModal]);

  const displayAmount = useMemo(() => parseAmountParts(form.amount), [form.amount]);
  const config = TYPE_CONFIG[form.type];
  const snapshotConfig = snapshot ? TYPE_CONFIG[snapshot.type] : config;

  const isValid = useMemo(() => {
    const base = form.title.trim() !== '' && form.amount !== '' && parseFloat(form.amount) > 0;
    return form.type === 'transfer' ? base : base && form.selectedCategory !== null;
  }, [form]);

  const setField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) =>
      dispatch({ type: 'SET_FIELD', field, value }),
    []
  );

  const handleRemoveTime = useCallback(() => {
    const d = new Date(form.date);
    d.setHours(0, 0, 0, 0);
    dispatch({ type: 'SET_FIELD', field: 'hasTime', value: false });
    dispatch({ type: 'SET_FIELD', field: 'date', value: d });
  }, [form.date]);

  const handleSave = useCallback(async () => {
    if (!isValid || isSaving) return;
    if (form.type === 'transfer' && form.toWalletId && form.toWalletId === form.selectedWalletId) {
      Alert.alert('Invalid Transfer', 'Source and destination wallet must be different.');
      return;
    }
    setIsSaving(true);
    try {
      const num = parseFloat(form.amount);
      await addTransaction({
        title: form.title.trim(),
        amount: num,
        type: form.type,
        categoryId: form.type === 'transfer' ? 'transfer' : (form.selectedCategory?.id ?? ''),
        walletId: form.selectedWalletId,
        date: form.date.toISOString(),
        hasTime: form.hasTime,
        notes: form.notes || undefined,
        toWalletId: form.type === 'transfer' && form.toWalletId ? form.toWalletId : undefined,
        toGoalId: form.type === 'transfer' && form.toGoalId ? form.toGoalId : undefined,
      });
      setSnapshot({ amount: form.amount, title: form.title.trim(), type: form.type });
      setShowSuccessModal(true);
    } catch {
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [form, isValid, isSaving, addTransaction]);

  const handleAddAnother = useCallback(() => {
    setShowSuccessModal(false);
    dispatch({ type: 'RESET', defaultWalletId });
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      amountInputRef.current?.focus();
    }, 100);
  }, [defaultWalletId]);

  const handleDone = useCallback(() => {
    setShowSuccessModal(false);
    dispatch({ type: 'RESET', defaultWalletId });
    navigation.goBack();
  }, [navigation, defaultWalletId]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <AppHeader
        title="Add Transaction"
        onBack={() => navigation.goBack()}
        onEdit={handleSave}
        editLabel="Save"
        hideMenu
        backgroundColor={config.color}
      />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Amount hero */}
        <View style={{ backgroundColor: config.color }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => amountInputRef.current?.focus()}
            style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 36 }}
          >
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
              <View>
                <TextInput
                  ref={amountInputRef}
                  value={form.amount}
                  onChangeText={v => setField('amount', v)}
                  keyboardType="decimal-pad"
                  style={{ position: 'absolute', opacity: 0, width: 200, height: '100%' }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text
                    style={{ color: '#fff', fontWeight: '800', fontSize: 52, letterSpacing: -1 }}
                  >
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
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8 }}>
              Tap to enter amount
            </Text>
          </TouchableOpacity>
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
              const active = form.type === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => dispatch({ type: 'SET_TYPE', value: t })}
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

          {/* Description */}
          <View>
            <Text style={labelStyle}>
              Description <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              value={form.title}
              onChangeText={v => setField('title', v)}
              placeholder={
                form.type === 'transfer' ? 'e.g., Move to savings…' : 'e.g., Lunch, Salary…'
              }
              placeholderTextColor="#CBD5E1"
              style={inputStyle}
            />
          </View>

          {/* Category */}
          {form.type !== 'transfer' && (
            <CategoryPicker
              type={form.type}
              selectedCategory={form.selectedCategory}
              onSelectCategory={v => setField('selectedCategory', v)}
            />
          )}

          {/* Wallet */}
          <WalletPicker
            label={form.type === 'transfer' ? 'From' : 'Wallet'}
            selectedWalletId={form.selectedWalletId}
            onSelectWallet={v => setField('selectedWalletId', v)}
          />

          {/* Transfer destination */}
          {form.type === 'transfer' && (
            <TransferToPicker
              selectedWalletId={form.toWalletId}
              selectedGoalId={form.toGoalId}
              excludeWalletId={form.selectedWalletId}
              onSelectWallet={v =>
                dispatch({ type: 'SET_TRANSFER_DEST', toWalletId: v, toGoalId: '' })
              }
              onSelectGoal={v =>
                dispatch({ type: 'SET_TRANSFER_DEST', toWalletId: form.toWalletId, toGoalId: v })
              }
            />
          )}

          {/* Date & Time */}
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
                  setTempDate(form.date);
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
                <Text style={{ flex: 1, color: '#0F172A', fontSize: 16 }}>
                  {formatDate(form.date)}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16 }} />
              {form.hasTime ? (
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
                      setTempDate(form.date);
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={{ color: '#0F172A', fontSize: 16 }}>{formatTime(form.date)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRemoveTime}>
                    <Ionicons name="close-circle" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setTempDate(form.date);
                    setShowTimePicker(true);
                    setField('hasTime', true);
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
              value={form.notes}
              onChangeText={v => setField('notes', v)}
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
              {(!form.amount || parseFloat(form.amount) <= 0) && <MissingChip label="Amount" />}
              {!form.title.trim() && <MissingChip label="Description" />}
              {form.type !== 'transfer' && !form.selectedCategory && (
                <MissingChip label="Category" />
              )}
            </View>
          )}

          {/* Save button */}
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
                {form.type === 'transfer' ? 'Save Transfer' : 'Save Transaction'}
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
                  setField('date', tempDate);
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
            value={form.date}
            mode="date"
            display="default"
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) setField('date', d);
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
              setField('hasTime', false);
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
                  setField('hasTime', false);
                }}
                onDone={() => {
                  setField('date', tempDate);
                  setField('hasTime', true);
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
            value={form.date}
            mode="time"
            display="default"
            onChange={(_, d) => {
              setShowTimePicker(false);
              if (d) {
                setField('date', d);
                setField('hasTime', true);
              }
            }}
          />
        )
      )}

      {/* Success modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.55)' }}
        >
          <Animated.View
            style={{
              backgroundColor: '#FFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 24,
              paddingTop: 32,
              paddingBottom: insets.bottom + 24,
              transform: [{ scale: successScale }],
              opacity: successOpacity,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  backgroundColor: snapshotConfig.bg,
                }}
              >
                <Text style={{ fontSize: 38 }}>
                  {snapshot?.type === 'expense' ? '💸' : snapshot?.type === 'income' ? '💰' : '🔄'}
                </Text>
              </View>
              <Text style={{ color: '#0F172A', fontSize: 20, fontWeight: '800', marginBottom: 4 }}>
                Saved!
              </Text>
              <Text style={{ color: '#64748B', fontSize: 14 }}>
                {snapshotConfig.label} recorded successfully
              </Text>
            </View>
            <View
              style={{
                borderRadius: 16,
                alignItems: 'center',
                paddingVertical: 20,
                marginBottom: 28,
                backgroundColor: snapshotConfig.bg,
              }}
            >
              <Text
                style={{
                  fontSize: 40,
                  color: snapshotConfig.color,
                  fontWeight: '800',
                  letterSpacing: -1,
                }}
              >
                {snapshotConfig.symbol}
                {currency.symbol}
                {parseFloat(snapshot?.amount || '0').toFixed(2)}
              </Text>
              <Text style={{ color: '#64748B', fontSize: 16, marginTop: 12 }} numberOfLines={1}>
                {snapshot?.title}
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={handleAddAnother}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 16 }}>
                  + Add Another
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDone}
                style={{
                  backgroundColor: '#14B8A6',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
