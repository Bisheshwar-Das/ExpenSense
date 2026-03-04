// components/CategoryPicker.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Category } from '../types';

interface Props {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
}

export default function CategoryPicker({ categories, selectedCategory, onSelectCategory }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (open) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 22,
        stiffness: 280,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [open]);

  const filtered = useMemo(
    () =>
      search.trim()
        ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        : categories,
    [categories, search]
  );

  const handleSelect = (cat: Category) => {
    onSelectCategory(cat);
    setSearch('');
    setOpen(false);
    Keyboard.dismiss();
  };

  const handleClose = () => {
    setOpen(false);
    setSearch('');
    Keyboard.dismiss();
  };

  return (
    <>
      <View>
        <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
          Category <Text className="text-expense">*</Text>
        </Text>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          activeOpacity={0.7}
          className="bg-card rounded-2xl px-4 flex-row items-center gap-3"
          style={{
            paddingVertical: 13,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          {selectedCategory ? (
            <>
              <View className="w-7 h-7 rounded-lg bg-filterBar items-center justify-center">
                <Text style={{ fontSize: 15 }}>{selectedCategory.icon}</Text>
              </View>
              <Text className="flex-1 text-textPrimary text-base font-medium">
                {selectedCategory.name}
              </Text>
            </>
          ) : (
            <>
              <View className="w-7 h-7 rounded-lg bg-background items-center justify-center">
                <Ionicons name="grid-outline" size={13} color="#CBD5E1" />
              </View>
              <Text className="flex-1 text-slate-400 text-base">Select a category</Text>
            </>
          )}
          <Ionicons name="chevron-down" size={16} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="none" onRequestClose={handleClose}>
        <Pressable className="flex-1 bg-black/50" onPress={handleClose}>
          <Animated.View
            style={{
              position: 'absolute',
              bottom: keyboardHeight,
              left: 0,
              right: 0,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: keyboardHeight > 0 ? '55%' : '78%',
              overflow: 'hidden',
              backgroundColor: '#F8FAFC',
              transform: [
                {
                  translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }),
                },
              ],
            }}
          >
            <Pressable onPress={e => e.stopPropagation()}>
              <View className="items-center pt-3 pb-1">
                <View className="w-8 h-1 rounded-full bg-slate-300" />
              </View>

              <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
                <View>
                  <Text
                    className="text-textPrimary text-lg font-bold"
                    style={{ letterSpacing: -0.3 }}
                  >
                    Choose Category
                  </Text>
                  {selectedCategory && (
                    <Text className="text-primary text-xs font-medium mt-0.5">
                      {selectedCategory.name} selected
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center"
                >
                  <Ionicons name="close" size={16} color="#475569" />
                </TouchableOpacity>
              </View>

              <View
                className="flex-row items-center gap-2 mx-5 mb-2 bg-card rounded-2xl px-4"
                style={{
                  paddingVertical: Platform.OS === 'ios' ? 12 : 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <Ionicons name="search" size={15} color="#94A3B8" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search..."
                  placeholderTextColor="#CBD5E1"
                  className="flex-1 text-textPrimary text-base"
                  autoCorrect={false}
                />
                {search.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearch('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
              </View>

              {!search && (
                <Text className="text-slate-400 text-xs px-6 pb-2">
                  {categories.length} categories
                </Text>
              )}

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: keyboardHeight > 0 ? 12 : insets.bottom + 20,
                  gap: 4,
                }}
              >
                {filtered.length === 0 ? (
                  <View className="items-center py-10">
                    <Text style={{ fontSize: 36, marginBottom: 10 }}>🔍</Text>
                    <Text className="text-slate-600 text-base font-medium">No results</Text>
                    <Text className="text-slate-400 text-sm mt-1">Try a different search</Text>
                  </View>
                ) : (
                  filtered.map(cat => {
                    const isSelected = selectedCategory?.name === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.name}
                        onPress={() => handleSelect(cat)}
                        activeOpacity={0.65}
                        className={`flex-row items-center px-4 rounded-2xl ${isSelected ? 'bg-teal-100 border-2 border-teal-300' : 'bg-card'}`}
                        style={{ paddingVertical: 11, gap: 14 }}
                      >
                        <View
                          className={`w-10 h-10 rounded-xl items-center justify-center ${isSelected ? 'bg-teal-200' : 'bg-background'}`}
                        >
                          <Text style={{ fontSize: 21 }}>{cat.icon}</Text>
                        </View>
                        <Text
                          className={`flex-1 text-base ${isSelected ? 'text-teal-700 font-semibold' : 'text-textPrimary'}`}
                        >
                          {cat.name}
                        </Text>
                        {isSelected && (
                          <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                            <Ionicons name="checkmark" size={13} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}
