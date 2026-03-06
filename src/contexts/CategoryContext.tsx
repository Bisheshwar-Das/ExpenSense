// contexts/CategoryContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, CategoryType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';

const DEFAULT_IDS = new Set([
  ...EXPENSE_CATEGORIES.map(c => c.id),
  ...INCOME_CATEGORIES.map(c => c.id),
]);

interface CategoryContextType {
  expenseCategories: Category[];
  incomeCategories: Category[];
  addCategory: (data: {
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
  }) => Promise<void>;
  updateCategory: (
    id: string,
    updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  isDefault: (id: string) => boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);
const STORAGE_KEY = '@custom_categories';

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setCustomCategories(JSON.parse(raw));
    });
  }, []);

  const persist = async (cats: Category[]) => {
    setCustomCategories(cats);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
  };

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...customCategories];

  const expenseCategories = [
    ...EXPENSE_CATEGORIES,
    ...customCategories.filter(c => c.type === 'expense'),
  ];
  const incomeCategories = [
    ...INCOME_CATEGORIES,
    ...customCategories.filter(c => c.type === 'income'),
  ];

  const getCategoryById = (id: string) => allCategories.find(c => c.id === id);
  const isDefault = (id: string) => DEFAULT_IDS.has(id);

  const addCategory = async (data: {
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
  }) => {
    const newCat: Category = { ...data, id: `custom_${Date.now()}` };
    await persist([...customCategories, newCat]);
  };

  const updateCategory = async (
    id: string,
    updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
  ) => {
    await persist(customCategories.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCategory = async (id: string) => {
    await persist(customCategories.filter(c => c.id !== id));
  };

  return (
    <CategoryContext.Provider
      value={{
        expenseCategories,
        incomeCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        isDefault,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error('useCategories must be used within CategoryProvider');
  return ctx;
}
