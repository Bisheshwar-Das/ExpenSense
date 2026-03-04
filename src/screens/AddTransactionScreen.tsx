// screens/AddTransactionScreen.tsx
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
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Category } from '../types';
import { useTransactions } from '../contexts/TransactionContext';
import { useWallets } from '../contexts/WalletContext';
import { useSettings } from '../contexts/SettingsContext';
import CategoryPicker from '../components/CategoryPicker';
import WalletPicker from '../components/WalletPicker';
import TransferToPicker from '../components/TransferToPicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

// ─── Constants ────────────────────────────────────────────────────────────────

export type FullTransactionType = 'expense' | 'income' | 'transfer';

const TYPE_CONFIG = {
  expense: {
    label: 'Expense',
    symbol: '−',
    color: '#EF4444',
    bg: '#FEF2F2',
    toggleClass: 'bg-expense',
  },
  income: {
    label: 'Income',
    symbol: '+',
    color: '#22C55E',
    bg: '#F0FDF4',
    toggleClass: 'bg-income',
  },
  transfer: {
    label: '⇄ Transfer',
    symbol: '⇄',
    color: '#14B8A6',
    bg: '#F0FDF9',
    toggleClass: 'bg-primary',
  },
} as const;

// ─── Reducer ──────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  amount: string;
  type: FullTransactionType;
  selectedCategory: Category | null;
  selectedWallet: string;
  toWalletId: string;
  toGoalId: string;
  notes: string;
  date: Date;
  hasTime: boolean;
  attachmentUri: string | null;
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: 'SET_TYPE'; value: FullTransactionType }
  | { type: 'RESET'; defaultWallet: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_TYPE':
      return { ...state, type: action.value, selectedCategory: null, toWalletId: '', toGoalId: '' };
    case 'RESET':
      return {
        title: '',
        amount: '',
        type: 'expense',
        selectedCategory: null,
        selectedWallet: action.defaultWallet,
        toWalletId: '',
        toGoalId: '',
        notes: '',
        date: new Date(),
        hasTime: false,
        attachmentUri: null,
      };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface SavedSnapshot {
  amount: string;
  title: string;
  type: FullTransactionType;
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

// ─── Component ────────────────────────────────────────────────────────────────

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

  const defaultWallet = wallets[0]?.name ?? '';

  const [form, dispatch] = useReducer(formReducer, {
    title: '',
    amount: '',
    type: 'expense',
    selectedCategory: null,
    selectedWallet: defaultWallet,
    toWalletId: '',
    toGoalId: '',
    notes: '',
    date: new Date(),
    hasTime: false,
    attachmentUri: null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [snapshot, setSnapshot] = useState<SavedSnapshot | null>(null);

  useEffect(() => {
    if (wallets.length > 0 && !form.selectedWallet)
      dispatch({ type: 'SET_FIELD', field: 'selectedWallet', value: wallets[0].name });
  }, [wallets, form.selectedWallet]);

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

  const categories = form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const displayAmount = useMemo(() => parseAmountParts(form.amount), [form.amount]);
  const config = TYPE_CONFIG[form.type];
  const snapshotConfig = snapshot ? TYPE_CONFIG[snapshot.type] : config;

  const isValid = useMemo(() => {
    const base = form.title.trim() !== '' && form.amount !== '' && parseFloat(form.amount) > 0;
    if (form.type === 'transfer') return base && (form.toWalletId !== '' || form.toGoalId !== '');
    return base && form.selectedCategory !== null;
  }, [form]);

  const setField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) =>
      dispatch({ type: 'SET_FIELD', field, value }),
    []
  );

  const handleTypeChange = useCallback(
    (value: FullTransactionType) => dispatch({ type: 'SET_TYPE', value }),
    []
  );

  const handleRemoveTime = useCallback(() => {
    const d = new Date(form.date);
    d.setHours(0, 0, 0, 0);
    dispatch({ type: 'SET_FIELD', field: 'hasTime', value: false });
    dispatch({ type: 'SET_FIELD', field: 'date', value: d });
  }, [form.date]);

  const handlePickFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setField('attachmentUri', result.assets[0].uri);
  }, []);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setField('attachmentUri', result.assets[0].uri);
  }, []);

  const handleAttachmentPress = useCallback(() => {
    Alert.alert('Add Attachment', '', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Library', onPress: handlePickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handleTakePhoto, handlePickFromLibrary]);

  const handleSave = useCallback(async () => {
    if (!isValid || isSaving) return;
    if (form.type === 'transfer' && form.toWalletId) {
      const fromWallet = wallets.find(w => w.name === form.selectedWallet);
      if (fromWallet?.id === form.toWalletId) {
        Alert.alert('Invalid Transfer', 'Source and destination wallet must be different.');
        return;
      }
    }
    setIsSaving(true);
    try {
      const num = parseFloat(form.amount);
      await addTransaction({
        title: form.title.trim(),
        amount: form.type === 'expense' ? -num : num,
        type: form.type === 'transfer' ? 'transfer' : form.type,
        category: form.type === 'transfer' ? 'Transfer' : (form.selectedCategory?.name ?? ''),
        date: form.date.toISOString(),
        hasTime: form.hasTime,
        wallet: form.selectedWallet,
        notes: form.notes,
        receiptUri: form.attachmentUri ?? undefined,
        ...(form.type === 'transfer' && form.toWalletId ? { toWalletId: form.toWalletId } : {}),
        ...(form.type === 'transfer' && form.toGoalId ? { toGoalId: form.toGoalId } : {}),
      });
      setSnapshot({ amount: form.amount, title: form.title.trim(), type: form.type });
      setShowSuccessModal(true);
    } catch {
      Alert.alert('Something went wrong', 'Your transaction could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [form, isValid, isSaving, wallets, addTransaction]);

  const handleAddAnother = useCallback(() => {
    setShowSuccessModal(false);
    dispatch({ type: 'RESET', defaultWallet });
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      amountInputRef.current?.focus();
    }, 100);
  }, [defaultWallet]);

  const handleDone = useCallback(() => {
    setShowSuccessModal(false);
    dispatch({ type: 'RESET', defaultWallet });
    navigation.goBack();
  }, [navigation, defaultWallet]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: config.color,
          paddingTop: insets.top + 8,
          paddingBottom: 20,
          paddingHorizontal: 24,
        }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => {
              dispatch({ type: 'RESET', defaultWallet });
              navigation.goBack();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-white/85 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold" style={{ letterSpacing: -0.3 }}>
            Add Transaction
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isValid || isSaving}
            className="rounded-full px-4 py-1.5"
            style={{
              backgroundColor: isValid ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                className={`font-semibold text-base ${isValid ? 'text-white' : 'text-white/40'}`}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Amount hero */}
        <View style={{ backgroundColor: config.color }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => amountInputRef.current?.focus()}
            className="items-center"
            style={{ paddingTop: 4, paddingBottom: 36 }}
          >
            <View className="flex-row items-center">
              <Text className="text-white/60 font-bold mr-1" style={{ fontSize: 42 }}>
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
                <View className="flex-row items-baseline">
                  <Text
                    className="text-white font-extrabold"
                    style={{ fontSize: 52, letterSpacing: -1 }}
                  >
                    {displayAmount.dollars || '0'}
                  </Text>
                  <Text
                    className="font-extrabold"
                    style={{
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
            <Text className="text-white/60 text-sm mt-2">Tap to enter amount</Text>
          </TouchableOpacity>
          <View className="bg-background rounded-t-3xl" style={{ height: 28 }} />
        </View>

        <View className="px-4 gap-3" style={{ marginTop: -14 }}>
          {/* Type toggle */}
          <View
            className="bg-card rounded-2xl p-1.5 flex-row gap-1"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            {(Object.keys(TYPE_CONFIG) as FullTransactionType[]).map(t => {
              const active = form.type === t;
              const tc = TYPE_CONFIG[t];
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => handleTypeChange(t)}
                  activeOpacity={0.7}
                  className={`flex-1 py-3 rounded-xl items-center ${active ? tc.toggleClass : ''}`}
                >
                  <Text
                    className={`font-semibold text-sm ${active ? 'text-white' : 'text-textSecondary'}`}
                  >
                    {tc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <View>
            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
              Description <Text className="text-expense">*</Text>
            </Text>
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
              <TextInput
                value={form.title}
                onChangeText={v => setField('title', v)}
                placeholder={
                  form.type === 'transfer'
                    ? 'e.g., Move to vacation fund…'
                    : 'e.g., Lunch, Monthly salary…'
                }
                placeholderTextColor="#CBD5E1"
                className="text-textPrimary text-base px-4"
                style={{ paddingVertical: 13 }}
              />
            </View>
          </View>

          {/* Category */}
          {form.type !== 'transfer' && (
            <CategoryPicker
              categories={categories}
              selectedCategory={form.selectedCategory}
              onSelectCategory={v => setField('selectedCategory', v)}
            />
          )}

          {/* Wallet */}
          <WalletPicker
            label={form.type === 'transfer' ? 'From' : 'Wallet'}
            selectedWallet={form.selectedWallet}
            onSelectWallet={v => setField('selectedWallet', v)}
          />

          {/* Transfer destination */}
          {form.type === 'transfer' && (
            <TransferToPicker
              selectedWalletId={form.toWalletId}
              selectedGoalId={form.toGoalId}
              excludeWalletName={form.selectedWallet}
              onSelectWallet={v => {
                setField('toWalletId', v);
                setField('toGoalId', '');
              }}
              onSelectGoal={v => {
                setField('toGoalId', v);
                setField('toWalletId', '');
              }}
            />
          )}

          {/* Date & Time */}
          <View>
            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
              Date
            </Text>
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
              <TouchableOpacity
                onPress={() => {
                  setTempDate(form.date);
                  setShowDatePicker(true);
                }}
                className="flex-row items-center px-4 gap-3"
                style={{ paddingVertical: 13 }}
              >
                <Ionicons name="calendar-outline" size={18} color="#14B8A6" />
                <Text className="flex-1 text-textPrimary text-base">{formatDate(form.date)}</Text>
                <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
              </TouchableOpacity>

              <View className="h-px bg-border mx-4" />

              {form.hasTime ? (
                <View className="flex-row items-center px-4 gap-3" style={{ paddingVertical: 13 }}>
                  <Ionicons name="time-outline" size={18} color="#14B8A6" />
                  <TouchableOpacity
                    className="flex-1"
                    onPress={() => {
                      setTempDate(form.date);
                      setShowTimePicker(true);
                    }}
                  >
                    <Text className="text-textPrimary text-base">{formatTime(form.date)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRemoveTime}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
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
                  className="flex-row items-center px-4 gap-3"
                  style={{ paddingVertical: 13 }}
                >
                  <Ionicons name="time-outline" size={18} color="#CBD5E1" />
                  <Text className="flex-1 text-slate-300 text-sm">Add time (optional)</Text>
                  <Ionicons name="add-circle-outline" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Notes */}
          <View>
            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
              Notes{' '}
              <Text
                className="text-textSecondary font-normal normal-case"
                style={{ letterSpacing: 0 }}
              >
                (optional)
              </Text>
            </Text>
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
              <TextInput
                value={form.notes}
                onChangeText={v => setField('notes', v)}
                placeholder="Add any extra notes…"
                placeholderTextColor="#CBD5E1"
                multiline
                numberOfLines={3}
                className="text-textPrimary text-base px-4"
                style={{ paddingVertical: 13, minHeight: 70 }}
              />
            </View>
          </View>

          {/* Attachment */}
          <View>
            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
              Attachment{' '}
              <Text
                className="text-textSecondary font-normal normal-case"
                style={{ letterSpacing: 0 }}
              >
                (optional)
              </Text>
            </Text>
            {form.attachmentUri ? (
              <View>
                <Image
                  source={{ uri: form.attachmentUri }}
                  className="w-full rounded-2xl"
                  style={{ height: 180 }}
                  resizeMode="cover"
                />
                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    onPress={handleAttachmentPress}
                    className="flex-1 flex-row items-center justify-center gap-1.5 bg-filterBar rounded-xl py-3"
                  >
                    <Ionicons name="camera-outline" size={16} color="#14B8A6" />
                    <Text className="text-primary font-semibold text-sm">Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setField('attachmentUri', null)}
                    className="flex-1 flex-row items-center justify-center gap-1.5 bg-expense/10 rounded-xl py-3"
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text className="text-expense font-semibold text-sm">Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleAttachmentPress}
                activeOpacity={0.7}
                className="bg-card rounded-2xl border border-border items-center py-5 gap-1.5"
              >
                <View className="w-11 h-11 rounded-full bg-filterBar items-center justify-center">
                  <Ionicons name="attach-outline" size={22} color="#14B8A6" />
                </View>
                <Text className="text-textPrimary text-sm font-medium mt-1">Add Attachment</Text>
                <Text className="text-textSecondary text-xs">Receipt, photo, document…</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Missing field chips */}
          {!isValid && (
            <View className="flex-row flex-wrap gap-1.5">
              {(!form.amount || parseFloat(form.amount) <= 0) && <MissingChip label="Amount" />}
              {!form.title.trim() && <MissingChip label="Description" />}
              {form.type !== 'transfer' && !form.selectedCategory && (
                <MissingChip label="Category" />
              )}
              {form.type === 'transfer' && !form.toWalletId && !form.toGoalId && (
                <MissingChip label="Transfer destination" />
              )}
            </View>
          )}

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isValid || isSaving}
            activeOpacity={0.8}
            className="rounded-2xl py-4 items-center justify-center flex-row gap-2"
            style={{ backgroundColor: isValid && !isSaving ? config.color : '#E2E8F0' }}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                className={`font-bold text-base ${isValid ? 'text-white' : 'text-textSecondary'}`}
                style={{ letterSpacing: 0.2 }}
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
          <Pressable className="flex-1 bg-black/40" onPress={() => setShowDatePicker(false)}>
            <Pressable
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl"
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
              <View className="bg-card">
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
              </View>
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
            className="flex-1 bg-black/40"
            onPress={() => {
              setShowTimePicker(false);
              setField('hasTime', false);
            }}
          >
            <Pressable
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl"
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
              <View className="bg-card">
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
              </View>
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
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(15,23,42,0.55)' }}>
          <Animated.View
            className="bg-card rounded-t-3xl px-6 pt-8"
            style={{
              paddingBottom: insets.bottom + 24,
              transform: [{ scale: successScale }],
              opacity: successOpacity,
            }}
          >
            <View className="items-center mb-6">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: snapshotConfig.bg }}
              >
                <Text style={{ fontSize: 38 }}>
                  {snapshot?.type === 'expense' ? '💸' : snapshot?.type === 'income' ? '💰' : '🔄'}
                </Text>
              </View>
              <Text
                className="text-textPrimary text-xl font-extrabold"
                style={{ letterSpacing: -0.4 }}
              >
                Saved!
              </Text>
              <Text className="text-textSecondary text-sm mt-1">
                {snapshotConfig.label} recorded successfully
              </Text>
            </View>

            <View
              className="rounded-2xl items-center py-5 mb-7"
              style={{ backgroundColor: snapshotConfig.bg }}
            >
              <Text
                className="font-extrabold"
                style={{ fontSize: 40, color: snapshotConfig.color, letterSpacing: -1 }}
              >
                {snapshotConfig.symbol}
                {currency.symbol}
                {parseFloat(snapshot?.amount || '0').toFixed(2)}
              </Text>
              <Text className="text-textSecondary text-base mt-1.5" numberOfLines={1}>
                {snapshot?.title}
              </Text>
            </View>

            <View className="gap-2.5">
              <TouchableOpacity
                onPress={handleAddAnother}
                className="bg-background rounded-2xl py-4 items-center"
              >
                <Text className="text-textPrimary font-semibold text-base">+ Add Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDone}
                className="bg-primary rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-bold text-base">Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MissingChip({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-1 bg-expense/10 rounded-full px-2.5 py-1">
      <Ionicons name="alert-circle" size={12} color="#EF4444" />
      <Text className="text-expense text-xs font-medium">{label}</Text>
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
    <View className="flex-row justify-between items-center px-6 py-4 border-b border-border">
      <TouchableOpacity onPress={onCancel}>
        <Text className="text-textSecondary text-lg">Cancel</Text>
      </TouchableOpacity>
      <Text className="text-textPrimary text-base font-bold">{title}</Text>
      <TouchableOpacity onPress={onDone}>
        <Text className="text-primary text-lg font-bold">Done</Text>
      </TouchableOpacity>
    </View>
  );
}
