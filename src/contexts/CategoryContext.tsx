// src/contexts/CategoryContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, CategoryType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';

const STORAGE_KEY = '@expensense_custom_categories';

interface CategoryContextType {
  expenseCategories: Category[];
  incomeCategories: Category[];
  allCategories: Category[];
  customCategories: Category[];
  isLoading: boolean;
  isDefault: (id: string) => boolean;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryByName: (name: string, type: CategoryType) => Category | undefined;
  addCategory: (data: Omit<Category, 'id' | 'isDefault'>) => Promise<Category>;
  updateCategory: (
    id: string,
    updates: Partial<Omit<Category, 'id' | 'type' | 'isDefault'>>
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoriesByType: (type: CategoryType) => Category[];
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCustomCategories(parsed);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const persist = async (cats: Category[]) => {
    try {
      setCustomCategories(cats);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
    } catch (error) {
      console.error('❌ Error saving categories:', error);
      throw error;
    }
  };

  // ─── Computed Values ────────────────────────────────────────────────────

  const expenseCategories: Category[] = [
    ...EXPENSE_CATEGORIES,
    ...customCategories.filter(c => c.type === 'expense'),
  ];

  const incomeCategories: Category[] = [
    ...INCOME_CATEGORIES,
    ...customCategories.filter(c => c.type === 'income'),
  ];

  const allCategories: Category[] = [...expenseCategories, ...incomeCategories];

  // ─── Helpers ────────────────────────────────────────────────────────────

  const isDefault = (id: string): boolean =>
    [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].some(c => c.id === id);

  const getCategoryById = (id: string): Category | undefined =>
    allCategories.find(c => c.id === id);

  const getCategoryByName = (name: string, type: CategoryType): Category | undefined =>
    allCategories.find(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type);

  const getCategoriesByType = (type: CategoryType): Category[] =>
    allCategories.filter(c => c.type === type);

  // ─── CRUD ───────────────────────────────────────────────────────────────

  const addCategory = async (data: Omit<Category, 'id' | 'isDefault'>): Promise<Category> => {
    const exists = allCategories.some(
      c => c.name.toLowerCase() === data.name.toLowerCase() && c.type === data.type
    );
    if (exists) throw new Error(`A ${data.type} category named "${data.name}" already exists.`);

    const newCat: Category = {
      ...data,
      id: `cat_custom_${Date.now()}`,
      isDefault: false,
    };
    await persist([...customCategories, newCat]);
    return newCat;
  };

  const updateCategory = async (
    id: string,
    updates: Partial<Omit<Category, 'id' | 'type' | 'isDefault'>>
  ): Promise<void> => {
    if (isDefault(id)) throw new Error('Default categories cannot be edited.');

    const target = customCategories.find(c => c.id === id);
    if (!target) throw new Error('Category not found.');

    if (updates.name) {
      const duplicate = allCategories.some(
        c =>
          c.id !== id &&
          c.name.toLowerCase() === updates.name!.toLowerCase() &&
          c.type === target.type
      );
      if (duplicate)
        throw new Error(`A ${target.type} category named "${updates.name}" already exists.`);
    }

    await persist(customCategories.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCategory = async (id: string): Promise<void> => {
    if (isDefault(id)) throw new Error('Default categories cannot be deleted.');

    const target = customCategories.find(c => c.id === id);
    if (!target) throw new Error('Category not found.');

    await persist(customCategories.filter(c => c.id !== id));
  };

  if (isLoading) return null;

  const value: CategoryContextType = {
    expenseCategories,
    incomeCategories,
    allCategories,
    customCategories,
    isLoading,
    isDefault,
    getCategoryById,
    getCategoryByName,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
  };

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error('useCategories must be used within CategoryProvider');
  return ctx;
}
