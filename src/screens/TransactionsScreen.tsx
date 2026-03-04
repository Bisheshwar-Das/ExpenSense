// screens/TransactionsScreen.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  TextInput,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTransactions } from '../contexts/TransactionContext';
import { useSettings } from '../contexts/SettingsContext';
import { RootNavigationProp } from '../navigation/types';
import AppHeader from '../components/AppHeader';
import TransactionRow from '../components/TransactionRow';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SortType = 'date' | 'amount' | 'name' | 'wallet';
type GroupType = 'none' | 'date' | 'month' | 'type' | 'category' | 'wallet';
type FilterType = 'all' | 'income' | 'expense' | 'transfer';

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'name', label: 'Name' },
  { key: 'wallet', label: 'Wallet' },
];
const GROUP_OPTIONS: { key: GroupType; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'date', label: 'Date' },
  { key: 'month', label: 'Month' },
  { key: 'type', label: 'Type' },
  { key: 'category', label: 'Category' },
  { key: 'wallet', label: 'Wallet' },
];
const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
  { key: 'transfer', label: 'Transfer' },
];

// ── Dropdown ─────────────────────────────────────────────────────────────────

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find(o => o.key === value);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="flex-1 flex-row items-center justify-between bg-card border border-border px-2 py-2 rounded-xl"
        style={{
          minWidth: 70,
          maxWidth: 120,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <Text className="text-textSecondary text-xs shrink-0">{label}:</Text>
        <Text className="text-primary text-xs font-semibold mx-1 flex-1" numberOfLines={1}>
          {selected?.label}
        </Text>
        <Ionicons name="chevron-down" size={11} color="#14B8A6" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/30" onPress={() => setOpen(false)}>
          <Pressable
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl"
            onPress={e => e.stopPropagation()}
          >
            {/* Handle */}
            <View className="items-center pt-3 pb-1">
              <View className="w-8 h-1 rounded-full bg-slate-300" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
              <Text className="text-textPrimary text-lg font-bold" style={{ letterSpacing: -0.3 }}>
                {label}
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 20,
                gap: 4,
              }}
            >
              {options.map(opt => {
                const isSelected = value === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => {
                      onChange(opt.key);
                      setOpen(false);
                    }}
                    activeOpacity={0.65}
                    className={`flex-row items-center px-4 rounded-2xl ${isSelected ? 'bg-teal-100 border-2 border-teal-300' : 'bg-card'}`}
                    style={{ paddingVertical: 13 }}
                  >
                    <Text
                      className={`flex-1 text-base ${isSelected ? 'text-teal-700 font-semibold' : 'text-textPrimary'}`}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { transactions, deleteTransaction } = useTransactions();
  const { currency } = useSettings();
  const insets = useSafeAreaInsets();

  const defaultFrom = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const defaultTo = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupType>('none');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [fromDate, setFromDate] = useState<Date>(defaultFrom);
  const [toDate, setToDate] = useState<Date>(defaultTo);
  const [datePicker, setDatePicker] = useState<'from' | 'to' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [search, setSearch] = useState('');

  const filterTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const filterVisible = useRef(true);
  const [filterBarHeight, setFilterBarHeight] = useState(130);

  const onScroll = useCallback((event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    lastScrollY.current = currentY;
    if (diff > 5 && filterVisible.current && currentY > 20) {
      filterVisible.current = false;
      Animated.spring(filterTranslateY, {
        toValue: -120,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }).start();
    } else if (diff < -2 && !filterVisible.current) {
      filterVisible.current = true;
      Animated.spring(filterTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }).start();
    }
  }, []);

  // ── Pipeline ────────────────────────────────────────────────────────────

  const filtered =
    filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType);

  const rangeFiltered = filtered.filter(t => {
    const d = new Date(t.date);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    return d >= fromDate && d <= end;
  });

  const searched = search.trim()
    ? rangeFiltered.filter(
        t =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.category?.toLowerCase().includes(search.toLowerCase()) ||
          t.wallet.toLowerCase().includes(search.toLowerCase())
      )
    : rangeFiltered;

  const sorted = [...searched].sort((a, b) => {
    let result = 0;
    if (sortBy === 'date') result = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount') result = Math.abs(a.amount) - Math.abs(b.amount);
    if (sortBy === 'name') result = a.title.localeCompare(b.title);
    if (sortBy === 'wallet') result = a.wallet.localeCompare(b.wallet);
    return sortAsc ? result : -result;
  });

  const getGroupKey = (t: (typeof sorted)[0]): string => {
    const d = new Date(t.date);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    if (groupBy === 'date') {
      if (d.toDateString() === now.toDateString()) return 'Today';
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      if (d >= weekAgo) return 'This Week';
      return 'Earlier';
    }
    if (groupBy === 'month')
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (groupBy === 'type')
      return t.type === 'income'
        ? '💚 Income'
        : t.type === 'expense'
          ? '🔴 Expense'
          : '🔵 Transfer';
    if (groupBy === 'category') return t.category || 'Uncategorized';
    if (groupBy === 'wallet') return t.wallet;
    return 'all';
  };

  const grouped: { key: string; items: typeof sorted }[] = [];
  if (groupBy === 'none') {
    grouped.push({ key: 'all', items: sorted });
  } else {
    const map = new Map<string, typeof sorted>();
    sorted.forEach(t => {
      const key = getGroupKey(t);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    map.forEach((items, key) => grouped.push({ key, items }));
  }

  // ── Delete ──────────────────────────────────────────────────────────────

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
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
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
      {/* Header */}
      <View style={{ zIndex: 20 }}>
        <AppHeader
          title="Transactions"
          subtitle={`${sorted.length} ${sorted.length === 1 ? 'transaction' : 'transactions'}`}
          onBack={() => navigation.goBack()}
        >
          <View className="flex-row items-center bg-white/15 rounded-2xl px-4 py-3 gap-3">
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, category, wallet..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              className="flex-1 text-white text-sm"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </AppHeader>
      </View>

      <View className="flex-1">
        {/* Transaction list */}
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: filterBarHeight + 12, paddingBottom: 32 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {sorted.length === 0 ? (
            <View className="bg-card p-8 rounded-2xl items-center border border-border">
              <Text style={{ fontSize: 36, marginBottom: 12 }}>{search ? '🔍' : '📊'}</Text>
              <Text className="text-textPrimary font-semibold text-base mb-1">
                {search ? 'No results found' : 'No transactions yet'}
              </Text>
              <Text className="text-textSecondary text-sm text-center">
                {search ? `Nothing matches "${search}"` : 'Tap + to add your first transaction'}
              </Text>
            </View>
          ) : (
            grouped.map(group => (
              <View key={group.key}>
                {groupBy !== 'none' && (
                  <View className="flex-row items-center gap-3 mb-2 mt-4">
                    <Text className="text-textPrimary font-semibold text-sm">{group.key}</Text>
                    <View className="flex-1 h-px bg-border" />
                    <Text className="text-textSecondary text-xs">{group.items.length}</Text>
                  </View>
                )}
                {group.items.map(transaction => (
                  <Swipeable
                    key={transaction.id}
                    renderRightActions={() => renderRightActions(transaction.id, transaction.title)}
                    overshootRight={false}
                  >
                    <TransactionRow
                      transaction={transaction}
                      onPress={id =>
                        navigation.navigate('TransactionDetails', { transactionId: id })
                      }
                    />
                  </Swipeable>
                ))}
              </View>
            ))
          )}
        </ScrollView>

        {/* Floating filter bar */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: filterTranslateY }],
            zIndex: 5,
          }}
          onLayout={e => setFilterBarHeight(e.nativeEvent.layout.height)}
        >
          <LinearGradient
            colors={['#F8FAFC', '#14B8A6']}
            style={{
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
              paddingHorizontal: 16,
              paddingBottom: 16,
              paddingTop: 16,
              shadowColor: '#14B8A6',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            {/* Date range + order toggle */}
            <View className="flex-row items-center gap-2 mb-4">
              <View className="flex-1 flex-row items-center bg-card rounded-2xl border border-border overflow-hidden">
                <TouchableOpacity
                  onPress={() => {
                    setTempDate(fromDate);
                    setDatePicker('from');
                  }}
                  className="flex-1 flex-row items-center gap-2 px-3 py-2.5"
                >
                  <Ionicons name="calendar-outline" size={14} color="#14B8A6" />
                  <View>
                    <Text className="text-textSecondary text-xs">From</Text>
                    <Text className="text-primary text-xs font-semibold">
                      {fromDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View className="w-px h-10 bg-border" />
                <TouchableOpacity
                  onPress={() => {
                    setTempDate(toDate);
                    setDatePicker('to');
                  }}
                  className="flex-1 flex-row items-center gap-2 px-3 py-2.5"
                >
                  <Ionicons name="calendar-outline" size={14} color="#14B8A6" />
                  <View>
                    <Text className="text-textSecondary text-xs">To</Text>
                    <Text className="text-primary text-xs font-semibold">
                      {toDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setFromDate(defaultFrom());
                    setToDate(defaultTo());
                  }}
                  className="px-3 py-2.5 border-l border-border"
                >
                  <Ionicons name="refresh-outline" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setSortAsc(v => !v)}
                className="w-11 h-11 bg-card rounded-2xl border border-border items-center justify-center"
              >
                <Ionicons name={sortAsc ? 'arrow-up' : 'arrow-down'} size={18} color="#14B8A6" />
              </TouchableOpacity>
            </View>

            {/* Dropdowns */}
            <View className="flex-row items-center gap-2">
              <Dropdown
                label="Sort"
                value={sortBy}
                options={SORT_OPTIONS}
                onChange={v => setSortBy(v as SortType)}
              />
              <Dropdown
                label="Group"
                value={groupBy}
                options={GROUP_OPTIONS}
                onChange={v => setGroupBy(v as GroupType)}
              />
              <Dropdown
                label="Filter"
                value={filterType}
                options={FILTER_OPTIONS}
                onChange={v => setFilterType(v as FilterType)}
              />
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* iOS date picker */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={datePicker !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setDatePicker(null)}
        >
          <Pressable className="flex-1 bg-black/40" onPress={() => setDatePicker(null)}>
            <Pressable
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl"
              onPress={e => e.stopPropagation()}
            >
              {/* Handle */}
              <View className="items-center pt-3 pb-1">
                <View className="w-8 h-1 rounded-full bg-slate-300" />
              </View>
              {/* Header */}
              <View className="flex-row justify-between items-center px-6 py-4 border-b border-border">
                <TouchableOpacity onPress={() => setDatePicker(null)}>
                  <Text className="text-textSecondary text-lg">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-textPrimary text-base font-bold">
                  {datePicker === 'from' ? 'From Date' : 'To Date'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (datePicker === 'from') setFromDate(tempDate);
                    else setToDate(tempDate);
                    setDatePicker(null);
                  }}
                >
                  <Text className="text-primary text-lg font-bold">Done</Text>
                </TouchableOpacity>
              </View>
              <View className="bg-card">
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  textColor="#0F172A"
                  onChange={(_, d) => {
                    if (d) setTempDate(d);
                  }}
                  style={{ backgroundColor: '#fff', height: 200 }}
                />
              </View>
              <View style={{ height: insets.bottom + 16 }} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        datePicker !== null && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={(_, d) => {
              if (d) {
                datePicker === 'from' ? setFromDate(d) : setToDate(d);
              }
              setDatePicker(null);
            }}
          />
        )
      )}
    </View>
  );
}
