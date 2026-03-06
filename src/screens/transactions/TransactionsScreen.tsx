// src/screens/transactions/TransactionsScreen.tsx
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
import { useTransactions } from '../../contexts/TransactionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCategories } from '../../contexts/CategoryContext';
import AppHeader from '../../components/AppHeader';
import TransactionRow from '../../components/TransactionRow';

type SortType = 'date' | 'amount' | 'name';
type GroupType = 'none' | 'date' | 'type' | 'category';
type FilterType = 'all' | 'income' | 'expense' | 'transfer';

export default function TransactionsScreen() {
  const navigation = useNavigation<any>();
  const { transactions, deleteTransaction, getTransactionsByDateRange } = useTransactions();
  const { currency } = useSettings();
  const { getCategoryById } = useCategories();

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
  const [groupBy, setGroupBy] = useState<GroupType>('date');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [fromDate, setFromDate] = useState<Date>(defaultFrom());
  const [toDate, setToDate] = useState<Date>(defaultTo());
  const [datePicker, setDatePicker] = useState<'from' | 'to' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [search, setSearch] = useState('');

  // Filter by type
  const filtered =
    filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType);

  // Filter by date range
  const rangeFiltered = filtered.filter(t => {
    const d = new Date(t.date);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    return d >= fromDate && d <= end;
  });

  // Search
  const searched = search.trim()
    ? rangeFiltered.filter(
        t =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.categoryId ? getCategoryById(t.categoryId)?.name.toLowerCase() : '').includes(
            search.toLowerCase()
          )
      )
    : rangeFiltered;

  // Sort
  const sorted = [...searched].sort((a, b) => {
    let result = 0;
    if (sortBy === 'date') result = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount') result = Math.abs(a.amount) - Math.abs(b.amount);
    if (sortBy === 'name') result = a.title.localeCompare(b.title);
    return sortAsc ? result : -result;
  });

  // Group
  const getGroupKey = (t: (typeof sorted)[0]): string => {
    const d = new Date(t.date);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (groupBy === 'date') {
      if (d.toDateString() === now.toDateString()) return 'Today';
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (groupBy === 'type')
      return t.type === 'income' ? 'Income' : t.type === 'expense' ? 'Expenses' : 'Transfers';
    if (groupBy === 'category')
      return (t.categoryId ? getCategoryById(t.categoryId)?.name : 'Other') || 'Other';
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
    Array.from(map.keys()).forEach(key => {
      grouped.push({ key, items: map.get(key)! });
    });
  }

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete?', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(id);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  const renderRightActions = (id: string, title: string) => (
    <TouchableOpacity
      onPress={() => handleDelete(id, title)}
      style={{
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 6,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: '#FFF', fontSize: 20 }}>🗑️</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <AppHeader
        title="Transactions"
        subtitle={`${sorted.length} total`}
        onBack={() => navigation.goBack()}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            gap: 8,
          }}
        >
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search…"
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ flex: 1, color: '#FFF', fontSize: 14 }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </AppHeader>

      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 12 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          scrollEventThrottle={16}
        >
          {sorted.length === 0 ? (
            <View
              style={{
                backgroundColor: '#FFF',
                padding: 32,
                borderRadius: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <Text style={{ fontSize: 32, marginBottom: 12 }}>{search ? '🔍' : '📊'}</Text>
              <Text style={{ color: '#0F172A', fontWeight: '500', fontSize: 16, marginBottom: 4 }}>
                {search ? 'No results' : 'No transactions'}
              </Text>
              <Text style={{ color: '#64748B', fontSize: 14, textAlign: 'center' }}>
                {search ? `Nothing matches "${search}"` : 'Add your first transaction'}
              </Text>
            </View>
          ) : (
            grouped.map(group => (
              <View key={group.key}>
                {groupBy !== 'none' && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 8,
                      marginTop: 12,
                    }}
                  >
                    <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 14 }}>
                      {group.key}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                    <Text style={{ color: '#64748B', fontSize: 12 }}>{group.items.length}</Text>
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

        {/* Filter bar */}
        <View
          style={{
            backgroundColor: '#FFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                overflow: 'hidden',
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setTempDate(fromDate);
                  setDatePicker('from');
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }}
              >
                <Ionicons name="calendar-outline" size={13} color="#14B8A6" />
                <View>
                  <Text style={{ color: '#64748B', fontSize: 10 }}>From</Text>
                  <Text style={{ color: '#14B8A6', fontSize: 10, fontWeight: '600' }}>
                    {fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={{ width: 1, backgroundColor: '#E2E8F0' }} />
              <TouchableOpacity
                onPress={() => {
                  setTempDate(toDate);
                  setDatePicker('to');
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }}
              >
                <Ionicons name="calendar-outline" size={13} color="#14B8A6" />
                <View>
                  <Text style={{ color: '#64748B', fontSize: 10 }}>To</Text>
                  <Text style={{ color: '#14B8A6', fontSize: 10, fontWeight: '600' }}>
                    {toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setSortAsc(v => !v)}
              style={{
                width: 36,
                height: 36,
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={sortAsc ? 'arrow-up' : 'arrow-down'} size={16} color="#14B8A6" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <FilterDropdown
              label="Sort"
              value={sortBy}
              options={[
                { key: 'date', label: 'Date' },
                { key: 'amount', label: 'Amount' },
                { key: 'name', label: 'Name' },
              ]}
              onChange={v => setSortBy(v as SortType)}
            />
            <FilterDropdown
              label="Group"
              value={groupBy}
              options={[
                { key: 'none', label: 'None' },
                { key: 'date', label: 'Date' },
                { key: 'type', label: 'Type' },
                { key: 'category', label: 'Category' },
              ]}
              onChange={v => setGroupBy(v as GroupType)}
            />
            <FilterDropdown
              label="Filter"
              value={filterType}
              options={[
                { key: 'all', label: 'All' },
                { key: 'income', label: 'Income' },
                { key: 'expense', label: 'Expense' },
                { key: 'transfer', label: 'Transfer' },
              ]}
              onChange={v => setFilterType(v as FilterType)}
            />
          </View>
        </View>
      </View>

      {/* Date picker */}
      {Platform.OS === 'ios' ? (
        <Modal visible={datePicker !== null} transparent animationType="slide">
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
            onPress={() => setDatePicker(null)}
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
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E2E8F0',
                }}
              >
                <TouchableOpacity onPress={() => setDatePicker(null)}>
                  <Text style={{ color: '#64748B', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: '#0F172A', fontWeight: '600' }}>
                  {datePicker === 'from' ? 'From Date' : 'To Date'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (datePicker === 'from') setFromDate(tempDate);
                    else setToDate(tempDate);
                    setDatePicker(null);
                  }}
                >
                  <Text style={{ color: '#14B8A6', fontWeight: '600', fontSize: 16 }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                textColor="#0F172A"
                onChange={(_, d) => {
                  if (d) setTempDate(d);
                }}
                style={{ backgroundColor: '#FFF' }}
              />
              <View style={{ height: 32 }} />
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

function FilterDropdown({
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
  const selected = options.find(o => o.key === value);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          paddingHorizontal: 8,
          paddingVertical: 6,
          borderRadius: 10,
          minWidth: 60,
        }}
      >
        <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600' }}>{label}:</Text>
        <Text
          style={{
            color: '#14B8A6',
            fontSize: 11,
            fontWeight: '600',
            marginHorizontal: 4,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {selected?.label}
        </Text>
        <Ionicons name="chevron-down" size={10} color="#14B8A6" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
          onPress={() => setOpen(false)}
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E2E8F0',
              }}
            >
              <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 16 }}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={{ color: '#14B8A6', fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>
            {options.map(opt => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E2E8F0',
                }}
              >
                <Text
                  style={{
                    color: value === opt.key ? '#14B8A6' : '#0F172A',
                    fontSize: 15,
                    fontWeight: value === opt.key ? '600' : '500',
                  }}
                >
                  {opt.label}
                </Text>
                {value === opt.key && <Ionicons name="checkmark" size={18} color="#14B8A6" />}
              </TouchableOpacity>
            ))}
            <View style={{ height: 20 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
