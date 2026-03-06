// screens/hub/CategoriesScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '../../contexts/CategoryContext';
import { Category, CategoryType } from '../../types';
import { RootNavigationProp } from '../../navigation/types';

const TAB_TYPES: { label: string; value: CategoryType }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
];

export default function CategoriesScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const insets = useSafeAreaInsets();
  const { expenseCategories, incomeCategories, deleteCategory, isDefault } = useCategories();
  const [activeTab, setActiveTab] = useState<CategoryType>('expense');

  const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
  const defaults = categories.filter(c => isDefault(c.id));
  const customs = categories.filter(c => !isDefault(c.id));

  const handleDelete = (cat: Category) => {
    Alert.alert(
      'Delete Category',
      `Remove "${cat.name}"? Existing transactions won't be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(cat.id) },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Compact custom header with tabs built in */}
      <View
        style={{
          backgroundColor: '#14B8A6',
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        {/* Top row — all items same height via alignItems center */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <Text
            style={{
              flex: 1,
              color: '#fff',
              fontSize: 18,
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: -0.3,
            }}
          >
            Categories
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('AddEditCategory', { defaultType: activeTab })}
            style={{
              height: 36,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Tab switcher inside header */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: 'rgba(0,0,0,0.12)',
            borderRadius: 12,
            padding: 3,
          }}
        >
          {TAB_TYPES.map(tab => (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: activeTab === tab.value ? '#fff' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontWeight: '600',
                  fontSize: 14,
                  color:
                    activeTab === tab.value
                      ? tab.value === 'expense'
                        ? '#EF4444'
                        : '#22C55E'
                      : 'rgba(255,255,255,0.7)',
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 32,
          paddingTop: 16,
        }}
      >
        {/* Custom categories */}
        {customs.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={sectionLabel}>My Categories</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {customs.map(cat => (
                <CategoryTile
                  key={cat.id}
                  category={cat}
                  isDefault={false}
                  onEdit={() =>
                    navigation.navigate('AddEditCategory', {
                      categoryId: cat.id,
                      defaultType: cat.type as CategoryType,
                    })
                  }
                  onDelete={() => handleDelete(cat)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Default categories */}
        <View>
          <Text style={sectionLabel}>Default</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {defaults.map(cat => (
              <CategoryTile
                key={cat.id}
                category={cat}
                isDefault={true}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </View>
        </View>

        {/* Empty custom prompt */}
        {customs.length === 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEditCategory', { defaultType: activeTab })}
            style={{
              marginTop: 12,
              backgroundColor: '#fff',
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
              borderStyle: 'dashed',
              alignItems: 'center',
              paddingVertical: 18,
              gap: 6,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#F0FDF9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={20} color="#14B8A6" />
            </View>
            <Text style={{ color: '#0F172A', fontSize: 14, fontWeight: '600' }}>
              Add custom category
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 12 }}>
              Create your own {activeTab} categories
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Category Tile — 4 columns, compact ───────────────────────────────────────

function CategoryTile({
  category,
  isDefault,
  onEdit,
  onDelete,
}: {
  category: Category;
  isDefault: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = (category as any).color ?? '#14B8A6';
  return (
    <View
      style={{
        width: '22.5%',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingTop: 12,
        paddingBottom: isDefault ? 12 : 8,
        paddingHorizontal: 6,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: color + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 5,
        }}
      >
        <Text style={{ fontSize: 20 }}>{category.icon}</Text>
      </View>
      <Text
        style={{ color: '#0F172A', fontSize: 11, fontWeight: '500', textAlign: 'center' }}
        numberOfLines={1}
      >
        {category.name}
      </Text>
      {!isDefault && (
        <View style={{ flexDirection: 'row', gap: 3, marginTop: 6 }}>
          <TouchableOpacity
            onPress={onEdit}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              backgroundColor: '#F0FDF9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="pencil-outline" size={11} color="#14B8A6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              backgroundColor: '#FEF2F2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={11} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const sectionLabel = {
  color: '#94A3B8' as const,
  fontSize: 11,
  fontWeight: '700' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.8,
  marginBottom: 8,
  paddingHorizontal: 2,
};
