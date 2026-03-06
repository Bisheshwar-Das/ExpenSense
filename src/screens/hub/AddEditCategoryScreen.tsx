// screens/hub/AddEditCategoryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '../../contexts/CategoryContext';
import { WALLET_COLORS } from '../../types';
import { CategoryType } from '../../types';
import { AddEditCategoryRouteProp, RootNavigationProp } from '../../navigation/types';
import AppHeader from '@/components/AppHeader';

const PRESET_ICONS = [
  '🍔',
  '🚗',
  '🛍️',
  '📄',
  '📚',
  '🎬',
  '💊',
  '📦',
  '💰',
  '💼',
  '🎁',
  '📈',
  '💵',
  '🏠',
  '✈️',
  '🎵',
  '🐶',
  '⚽',
  '🎮',
  '☕',
  '🍕',
  '🚌',
  '💡',
  '🛒',
  '👗',
  '💄',
  '🎓',
  '🏋️',
  '🌿',
  '🎨',
  '🔧',
  '💻',
];

const TAB_TYPES: { label: string; value: CategoryType }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
];

export default function AddEditCategoryScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<AddEditCategoryRouteProp>();
  const insets = useSafeAreaInsets();
  const { expenseCategories, incomeCategories, addCategory, updateCategory, isDefault } =
    useCategories();

  const { categoryId, defaultType = 'expense' } = route.params ?? {};
  const isEditing = !!categoryId;

  const existingCategory = [...expenseCategories, ...incomeCategories].find(
    c => c.id === categoryId
  );

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [customIcon, setCustomIcon] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [color, setColor] = useState(WALLET_COLORS[0].value);
  const [type, setType] = useState<CategoryType>(defaultType);

  useEffect(() => {
    if (existingCategory) {
      setName(existingCategory.name);
      setIcon(existingCategory.icon);
      setColor((existingCategory as any).color ?? WALLET_COLORS[0].value);
      setType(existingCategory.type as CategoryType);
    }
  }, [categoryId]);

  const effectiveIcon = customIcon.trim() || icon;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a category name.');
      return;
    }
    if (isEditing && categoryId) {
      await updateCategory(categoryId, { name: name.trim(), icon: effectiveIcon, color });
    } else {
      await addCategory({ name: name.trim(), icon: effectiveIcon, color, type });
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
    >
      <AppHeader
        title={isEditing ? 'Edit Category' : 'New Category'}
        onBack={() => navigation.goBack()}
        hideMenu
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Save</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 32,
          paddingTop: 16,
          gap: 20,
        }}
      >
        {/* Preview */}
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: color + '25',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 40 }}>{effectiveIcon}</Text>
          </View>
          <Text style={{ color: '#0F172A', fontSize: 17, fontWeight: '700' }}>
            {name || 'Category Name'}
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>
            {type === 'expense' ? 'Expense' : 'Income'} category
          </Text>
        </View>

        {/* Type toggle — only for new */}
        {!isEditing && (
          <View>
            <Text style={labelStyle}>Type</Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 4,
                gap: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              {TAB_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setType(t.value)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor:
                      type === t.value
                        ? t.value === 'expense'
                          ? '#EF4444'
                          : '#22C55E'
                        : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '600',
                      fontSize: 15,
                      color: type === t.value ? '#fff' : '#94A3B8',
                    }}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Name */}
        <View>
          <Text style={labelStyle}>Name</Text>
          <View style={inputCard}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Groceries, Side hustle…"
              placeholderTextColor="#CBD5E1"
              style={{ fontSize: 16, color: '#0F172A' }}
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
        </View>

        {/* Icon */}
        <View>
          <Text style={labelStyle}>Icon</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            {PRESET_ICONS.map(em => {
              const isSelected = !customIcon.trim() && icon === em;
              return (
                <TouchableOpacity
                  key={em}
                  onPress={() => {
                    setIcon(em);
                    setCustomIcon('');
                    Keyboard.dismiss();
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? color + '30' : '#fff',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? color : 'transparent',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Text style={{ fontSize: 26 }}>{em}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom icon */}
          <TouchableOpacity
            onPress={() => setShowCustom(v => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginBottom: showCustom ? 10 : 0,
            }}
          >
            <Ionicons
              name={showCustom ? 'chevron-down' : 'chevron-forward'}
              size={14}
              color="#94A3B8"
            />
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              Custom icon or text (up to 3 chars)
            </Text>
          </TouchableOpacity>
          {showCustom && (
            <View style={inputCard}>
              <TextInput
                value={customIcon}
                onChangeText={v => setCustomIcon(v.slice(0, 3))}
                placeholder="e.g., 🏄 or $"
                placeholderTextColor="#CBD5E1"
                style={{ fontSize: 22, color: '#0F172A', textAlign: 'center' }}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>
          )}
        </View>

        {/* Color */}
        <View>
          <Text style={labelStyle}>Color</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {WALLET_COLORS.map(c => (
              <TouchableOpacity
                key={c.value}
                onPress={() => {
                  setColor(c.value);
                  Keyboard.dismiss();
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: c.value,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: color === c.value ? 3 : 0,
                  borderColor: '#fff',
                  shadowColor: color === c.value ? c.value : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.6,
                  shadowRadius: 4,
                  elevation: color === c.value ? 5 : 0,
                }}
              >
                {color === c.value && <Ionicons name="checkmark" size={20} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const labelStyle = {
  color: '#64748B',
  fontSize: 12,
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.8,
  marginBottom: 8,
};

const inputCard = {
  backgroundColor: '#fff',
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 13,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 1,
};
