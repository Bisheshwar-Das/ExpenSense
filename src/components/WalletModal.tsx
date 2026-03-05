// components/WalletModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Wallet, WalletType, WALLET_COLORS, WALLET_ICONS, WALLET_TYPES } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => void;
  editWallet?: Wallet | null;
};

export default function WalletModal({ visible, onClose, onSave, editWallet }: Props) {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0]);
  const [selectedType, setSelectedType] = useState<WalletType>('checking');
  const [creditLimit, setCreditLimit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editWallet) {
      setName(editWallet.name);
      setSelectedColor(editWallet.color);
      setSelectedIcon(editWallet.icon);
      setSelectedType(editWallet.type ?? 'checking');
      setCreditLimit(editWallet.creditLimit?.toString() ?? '');
    } else {
      setName('');
      setSelectedColor(WALLET_COLORS[0].value);
      setSelectedIcon(WALLET_ICONS[0]);
      setSelectedType('checking');
      setCreditLimit('');
    }
  }, [editWallet, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a wallet name');
      return;
    }
    setIsSaving(true);
    try {
      onSave({
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
        type: selectedType,
        ...(selectedType === 'credit' && creditLimit
          ? { creditLimit: parseFloat(creditLimit) }
          : {}),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTypeData = WALLET_TYPES.find(t => t.type === selectedType);
  const isValid = name.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: '#14B8A6',
            paddingTop: insets.top + 8,
            paddingBottom: 20,
            paddingHorizontal: 24,
          }}
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text className="text-white/85 text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold" style={{ letterSpacing: -0.3 }}>
              {editWallet ? 'Edit Wallet' : 'New Wallet'}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isValid || isSaving}
              className="rounded-full px-4 py-1.5"
              style={{
                backgroundColor: isValid ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text
                  className={`font-semibold text-base ${isValid ? 'text-white' : 'text-white/40'}`}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Preview hero */}
        <View style={{ backgroundColor: '#14B8A6' }}>
          <View className="items-center pb-8 pt-2">
            <View
              className="w-20 h-20 rounded-3xl items-center justify-center mb-3"
              style={{ backgroundColor: selectedColor + '40' }}
            >
              <Text style={{ fontSize: 42 }}>{selectedIcon}</Text>
            </View>
            <Text className="text-white font-bold text-xl" style={{ letterSpacing: -0.3 }}>
              {name || 'Wallet Name'}
            </Text>
            {selectedTypeData && (
              <Text className="text-white/65 text-sm mt-1">{selectedTypeData.label}</Text>
            )}
          </View>
          <View className="bg-background rounded-t-3xl" style={{ height: 28 }} />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: -14,
            paddingBottom: insets.bottom + 32,
            gap: 12,
          }}
        >
          {/* Name */}
          <View style={{ marginTop: -14 }}>
            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
              Wallet Name <Text className="text-expense">*</Text>
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
                value={name}
                onChangeText={setName}
                placeholder="e.g., Emergency Fund"
                placeholderTextColor="#CBD5E1"
                className="text-textPrimary text-base px-4"
                style={{ paddingVertical: 13 }}
                autoFocus
              />
            </View>
          </View>

          {/* Wallet Type */}
          <View>
            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
              Type
            </Text>
            <View className="gap-2">
              {WALLET_TYPES.map(wt => {
                const isSelected = selectedType === wt.type;
                return (
                  <TouchableOpacity
                    key={wt.type}
                    onPress={() => setSelectedType(wt.type)}
                    activeOpacity={0.65}
                    className={`flex-row items-center px-4 rounded-2xl bg-card ${isSelected ? 'border-2 border-teal-300' : ''}`}
                    style={{
                      paddingVertical: 11,
                      gap: 14,
                      backgroundColor: isSelected ? '#F0FDF9' : '#fff',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 3,
                      elevation: 1,
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: selectedColor + '20' }}
                    >
                      <Text style={{ fontSize: 21 }}>{wt.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-base ${isSelected ? 'text-teal-700 font-semibold' : 'text-textPrimary'}`}
                      >
                        {wt.label}
                      </Text>
                      <Text className="text-textSecondary text-xs mt-0.5">{wt.description}</Text>
                    </View>
                    {isSelected && (
                      <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Credit limit */}
          {selectedType === 'credit' && (
            <View>
              <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
                Credit Limit{' '}
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
                  value={creditLimit}
                  onChangeText={setCreditLimit}
                  placeholder="e.g., 5000"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="decimal-pad"
                  className="text-textPrimary text-base px-4"
                  style={{ paddingVertical: 13 }}
                />
              </View>
            </View>
          )}

          {/* Color */}
          <View>
            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
              Color
            </Text>
            <View
              className="bg-card rounded-2xl p-4 flex-row flex-wrap gap-3"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              {WALLET_COLORS.map(color => {
                const isSelected = selectedColor === color.value;
                return (
                  <TouchableOpacity
                    key={color.value}
                    onPress={() => setSelectedColor(color.value)}
                    className="items-center"
                    style={{ width: '18%' }}
                  >
                    <View
                      className="w-11 h-11 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: color.value,
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: '#fff',
                        shadowColor: color.value,
                        shadowOpacity: isSelected ? 0.5 : 0,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: isSelected ? 4 : 0,
                      }}
                    >
                      {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
                    </View>
                    <Text className="text-textSecondary text-xs mt-1">{color.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Icon */}
          <View>
            <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
              Icon
            </Text>
            <View
              className="bg-card rounded-2xl p-4 flex-row flex-wrap gap-3"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              {WALLET_ICONS.map(icon => {
                const isSelected = selectedIcon === icon;
                return (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    className="w-14 h-14 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: isSelected ? selectedColor : '#F8FAFC' }}
                  >
                    <Text style={{ fontSize: 28 }}>{icon}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isValid || isSaving}
            activeOpacity={0.8}
            className="rounded-2xl py-4 items-center justify-center flex-row gap-2"
            style={{ backgroundColor: isValid ? '#14B8A6' : '#E2E8F0' }}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                className={`font-bold text-base ${isValid ? 'text-white' : 'text-textSecondary'}`}
              >
                {editWallet ? 'Save Changes' : 'Create Wallet'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
