// screens/EditTransactionScreen.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Category } from '../types';
import { useTransactions } from '../contexts/TransactionContext';
import { useWallets } from '../contexts/WalletContext';
import { useSettings } from '../contexts/SettingsContext';
import { RootNavigationProp, EditTransactionRouteProp } from '../navigation/types';
import CategoryPicker from '../components/CategoryPicker';
import WalletPicker from '../components/WalletPicker';
import TransferToPicker from '../components/TransferToPicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import AppHeader from '@/components/AppHeader';

type FullTransactionType = 'expense' | 'income' | 'transfer';

const TYPE_CONFIG = {
  expense: { label: 'Expense', symbol: '−', color: '#EF4444', toggleClass: 'bg-expense' },
  income: { label: 'Income', symbol: '+', color: '#22C55E', toggleClass: 'bg-income' },
  transfer: { label: '⇄ Transfer', symbol: '⇄', color: '#14B8A6', toggleClass: 'bg-primary' },
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
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<EditTransactionRouteProp>();
  const { transactions, updateTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { currency } = useSettings();
  const insets = useSafeAreaInsets();
  const amountInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { transactionId } = route.params;
  const transaction = transactions.find(t => t.id === transactionId);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<FullTransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState('');
  // Single state object for transfer dest to avoid batching issues
  const [transferDest, setTransferDest] = useState({ toWalletId: '', toGoalId: '' });
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [hasTime, setHasTime] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);

  useEffect(() => {
    if (!transaction) return;
    setTitle(transaction.title);
    setAmount(Math.abs(transaction.amount).toString());
    setType(transaction.type as FullTransactionType);
    setNotes(transaction.notes || '');
    setSelectedWallet(transaction.wallet);
    setDate(new Date(transaction.date));
    setHasTime(transaction.hasTime || false);
    setTransferDest({
      toWalletId: transaction.toWalletId || '',
      toGoalId: transaction.toGoalId || '',
    });
    setAttachmentUri(transaction.receiptUri || null);
    if (transaction.type !== 'transfer') {
      const cats = transaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      setSelectedCategory(cats.find(c => c.name === transaction.category) || null);
    }
  }, [transaction]);

  if (!transaction) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-textSecondary text-base">Transaction not found</Text>
      </View>
    );
  }

  const config = TYPE_CONFIG[type];
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const displayAmount = parseAmountParts(amount);

  const isValid = useMemo(() => {
    const base = title.trim() !== '' && amount !== '' && parseFloat(amount) > 0;
    if (type === 'transfer') return base;
    return base && selectedCategory !== null;
  }, [title, amount, type, selectedCategory]);

  const handleTypeChange = (newType: FullTransactionType) => {
    setType(newType);
    setSelectedCategory(null);
    setTransferDest({ toWalletId: '', toGoalId: '' });
  };

  const handleRemoveTime = () => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    setDate(d);
    setHasTime(false);
  };

  const handlePickFromLibrary = async () => {
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
    if (!result.canceled) setAttachmentUri(result.assets[0].uri);
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setAttachmentUri(result.assets[0].uri);
  };

  const handleAttachmentPress = () => {
    Alert.alert('Add Attachment', '', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Library', onPress: handlePickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    try {
      const num = parseFloat(amount);
      await updateTransaction(transaction.id, {
        title: title.trim(),
        amount: type === 'expense' ? -num : num,
        type,
        category: type === 'transfer' ? 'Transfer' : selectedCategory?.name || '',
        date: date.toISOString(),
        hasTime,
        wallet: selectedWallet,
        notes,
        toWalletId: type === 'transfer' ? transferDest.toWalletId || undefined : undefined,
        toGoalId: type === 'transfer' ? transferDest.toGoalId || undefined : undefined,
        receiptUri: attachmentUri ?? undefined,
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
      className="flex-1 bg-background"
    >
      {/* Header */}
      <AppHeader
        title="Edit Transaction"
        onBack={() => navigation.goBack()}
        onEdit={handleSave}
        editLabel="Save"
        hideMenu
        backgroundColor={config.color}
      />

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
                  value={amount}
                  onChangeText={setAmount}
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
            <Text className="text-white/60 text-sm mt-2">Tap to edit amount</Text>
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
              const active = type === t;
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
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Lunch, Monthly salary…"
                placeholderTextColor="#CBD5E1"
                className="text-textPrimary text-base px-4"
                style={{ paddingVertical: 13 }}
              />
            </View>
          </View>

          {/* Category */}
          {type !== 'transfer' && (
            <CategoryPicker
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          )}

          {/* Wallet */}
          <WalletPicker
            label={type === 'transfer' ? 'From' : 'Wallet'}
            selectedWallet={selectedWallet}
            onSelectWallet={setSelectedWallet}
          />

          {/* Transfer destination */}
          {type === 'transfer' && (
            <TransferToPicker
              selectedWalletId={transferDest.toWalletId}
              selectedGoalId={transferDest.toGoalId}
              excludeWalletName={selectedWallet}
              onSelectWallet={v => setTransferDest({ toWalletId: v, toGoalId: '' })}
              onSelectGoal={v =>
                setTransferDest(prev => ({ toWalletId: prev.toWalletId, toGoalId: v }))
              }
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
                  setTempDate(date);
                  setShowDatePicker(true);
                }}
                className="flex-row items-center px-4 gap-3"
                style={{ paddingVertical: 13 }}
              >
                <Ionicons name="calendar-outline" size={18} color="#14B8A6" />
                <Text className="flex-1 text-textPrimary text-base">{formatDate(date)}</Text>
                <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
              </TouchableOpacity>
              <View className="h-px bg-border mx-4" />
              {hasTime ? (
                <View className="flex-row items-center px-4 gap-3" style={{ paddingVertical: 13 }}>
                  <Ionicons name="time-outline" size={18} color="#14B8A6" />
                  <TouchableOpacity
                    className="flex-1"
                    onPress={() => {
                      setTempDate(date);
                      setShowTimePicker(true);
                    }}
                  >
                    <Text className="text-textPrimary text-base">{formatTime(date)}</Text>
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
                    setTempDate(date);
                    setShowTimePicker(true);
                    setHasTime(true);
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
                value={notes}
                onChangeText={setNotes}
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
            {attachmentUri ? (
              <View>
                <Image
                  source={{ uri: attachmentUri }}
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
                    onPress={() => setAttachmentUri(null)}
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
              {(!amount || parseFloat(amount) <= 0) && <MissingChip label="Amount" />}
              {!title.trim() && <MissingChip label="Description" />}
              {type !== 'transfer' && !selectedCategory && <MissingChip label="Category" />}
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
          <Pressable className="flex-1 bg-black/40" onPress={() => setShowDatePicker(false)}>
            <Pressable
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl"
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
            className="flex-1 bg-black/40"
            onPress={() => {
              setShowTimePicker(false);
              setHasTime(false);
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
                  setHasTime(false);
                }}
                onDone={() => {
                  setDate(tempDate);
                  setHasTime(true);
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
