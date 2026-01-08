// components/CategoryPicker.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Category } from '../types';

interface CategoryPickerProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
}

export default function CategoryPicker({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryPickerProps) {
  return (
    <View className="px-6 py-4">
      <Text className="text-textSecondary text-sm mb-3">Category</Text>
      <View className="bg-white rounded-2xl p-4">
        <View className="flex-row flex-wrap gap-3">
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => onSelectCategory(category)}
              className={`items-center justify-center p-4 rounded-2xl ${
                selectedCategory?.id === category.id
                  ? 'bg-primary'
                  : 'bg-background'
              }`}
              style={{ width: '30%' }}
            >
              <Text className="text-3xl mb-2">{category.icon}</Text>
              <Text
                className={`text-xs font-medium ${
                  selectedCategory?.id === category.id
                    ? 'text-white'
                    : 'text-textPrimary'
                }`}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}