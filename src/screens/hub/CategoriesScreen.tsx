// src/screens/hub/CategoriesScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCategories } from '../../contexts/CategoryContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { Category, CategoryType } from '../../types';
import { RootNavigationProp } from '../../navigation/types';
import AppHeader from '../../components/AppHeader';

const TAB_TYPES: { label: string; value: CategoryType }[] = [
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
];

export default function CategoriesScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { expenseCategories, incomeCategories, deleteCategory, isDefault } = useCategories();
  const { getTransactionsByCategory } = useTransactions();
  const [activeTab, setActiveTab] = useState<CategoryType>('expense');

  const categories = activeTab === 'expense' ? expenseCategories : incomeCategories;
  const defaults = categories.filter(c => isDefault(c.id));
  const customs = categories.filter(c => !isDefault(c.id));

  const handleDelete = (cat: Category) => {
    const count = getTransactionsByCategory(cat.id).length;
    const message =
      count > 0
        ? `"${cat.name}" is used by ${count} transaction${count === 1 ? '' : 's'}. Those transactions will show "Unknown Category" after deletion.`
        : `Remove "${cat.name}"?`;

    Alert.alert('Delete Category', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(cat.id);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <AppHeader
        title="Categories"
        onBack={() => navigation.goBack()}
        onEdit={() => navigation.navigate('AddEditCategory', { defaultType: activeTab })}
        editLabel="+ Add"
        hideMenu
      >
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
      </AppHeader>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
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
                      defaultType: cat.type,
                    })
                  }
                  onDelete={() => handleDelete(cat)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Default categories */}
        <View style={{ marginBottom: 12 }}>
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
              marginTop: 4,
              backgroundColor: '#fff',
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
              borderStyle: 'dashed',
              alignItems: 'center',
              paddingVertical: 20,
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
        shadowColor: category.color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: category.color + '20',
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
