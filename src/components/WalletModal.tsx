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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet, WalletType, WALLET_COLORS, WALLET_ICONS, WALLET_TYPES } from '../types';

type WalletModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => void;
  editWallet?: Wallet | null;
};

export default function WalletModal({ visible, onClose, onSave, editWallet }: WalletModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0]);
  const [selectedType, setSelectedType] = useState<WalletType>('checking');
  const [creditLimit, setCreditLimit] = useState('');

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

  const handleSave = () => {
    if (name.trim() === '') {
      alert('Please enter a wallet name');
      return;
    }

    onSave({
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
      type: selectedType,
      ...(selectedType === 'credit' && creditLimit ? { creditLimit: parseFloat(creditLimit) } : {}),
    });

    onClose();
  };

  const selectedTypeData = WALLET_TYPES.find(t => t.type === selectedType);

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
          className="bg-white px-6 py-4 border-b border-border"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-primary text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-textPrimary text-xl font-semibold">
              {editWallet ? 'Edit Wallet' : 'New Wallet'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text className="text-primary text-lg font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-6">
          {/* Preview Card */}
          <View className="items-center mb-8">
            <View
              className="w-24 h-24 rounded-3xl items-center justify-center mb-3"
              style={{ backgroundColor: selectedColor + '30' }}
            >
              <Text className="text-5xl">{selectedIcon}</Text>
            </View>
            <Text className="text-textPrimary text-xl font-semibold">{name || 'Wallet Name'}</Text>
            {selectedTypeData && (
              <Text className="text-textSecondary text-sm mt-1">{selectedTypeData.label}</Text>
            )}
          </View>

          {/* Wallet Name */}
          <View className="mb-6">
            <Text className="text-textSecondary text-sm mb-3">Wallet Name</Text>
            <View className="bg-white rounded-2xl p-4">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Emergency Fund"
                placeholderTextColor="#64748B"
                className="text-textPrimary text-base"
                autoFocus
              />
            </View>
          </View>

          {/* Wallet Type */}
          <View className="mb-6">
            <Text className="text-textSecondary text-sm mb-3">Wallet Type</Text>
            <View className="bg-white rounded-2xl p-4 gap-2">
              {WALLET_TYPES.map(wt => (
                <TouchableOpacity
                  key={wt.type}
                  onPress={() => setSelectedType(wt.type)}
                  className={`flex-row items-center p-4 rounded-2xl ${
                    selectedType === wt.type
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-background'
                  }`}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: selectedColor + '20' }}
                  >
                    <Text className="text-xl">{wt.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-textPrimary font-semibold text-sm">{wt.label}</Text>
                    <Text className="text-textSecondary text-xs">{wt.description}</Text>
                  </View>
                  {selectedType === wt.type && <Text className="text-primary text-xl">✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Credit Limit — only shown for credit type */}
          {selectedType === 'credit' && (
            <View className="mb-6">
              <Text className="text-textSecondary text-sm mb-3">Credit Limit (Optional)</Text>
              <View className="bg-white rounded-2xl p-4">
                <TextInput
                  value={creditLimit}
                  onChangeText={setCreditLimit}
                  placeholder="e.g., 5000"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                  className="text-textPrimary text-base"
                />
              </View>
            </View>
          )}

          {/* Color Picker */}
          <View className="mb-6">
            <Text className="text-textSecondary text-sm mb-3">Color</Text>
            <View className="bg-white rounded-2xl p-4">
              <View className="flex-row flex-wrap gap-3">
                {WALLET_COLORS.map(color => (
                  <TouchableOpacity
                    key={color.value}
                    onPress={() => setSelectedColor(color.value)}
                    className="items-center"
                    style={{ width: '20%' }}
                  >
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: color.value }}
                    >
                      {selectedColor === color.value && (
                        <Text className="text-white text-xl">✓</Text>
                      )}
                    </View>
                    <Text className="text-textSecondary text-xs mt-1">{color.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Icon Picker */}
          <View className="mb-6">
            <Text className="text-textSecondary text-sm mb-3">Icon</Text>
            <View className="bg-white rounded-2xl p-4">
              <View className="flex-row flex-wrap gap-3">
                {WALLET_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    className={`w-14 h-14 rounded-2xl items-center justify-center ${
                      selectedIcon === icon ? 'bg-primary' : 'bg-background'
                    }`}
                  >
                    <Text className="text-3xl">{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
