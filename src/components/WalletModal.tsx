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
import { Wallet, WALLET_COLORS, WALLET_ICONS } from '../types';

type WalletModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => void;
  editWallet?: Wallet | null;
};

export default function WalletModal({ visible, onClose, onSave, editWallet }: WalletModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editWallet) {
      setName(editWallet.name);
      setSelectedColor(editWallet.color);
      setSelectedIcon(editWallet.icon);
    } else {
      // Reset for new wallet
      setName('');
      setSelectedColor(WALLET_COLORS[0].value);
      setSelectedIcon(WALLET_ICONS[0]);
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
    });

    onClose();
  };

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
        <View className="bg-white px-6 py-4 border-b border-border">
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
            <Text className="text-textPrimary text-xl font-semibold">
              {name || 'Wallet Name'}
            </Text>
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

          {/* Color Picker */}
          <View className="mb-6">
            <Text className="text-textSecondary text-sm mb-3">Color</Text>
            <View className="bg-white rounded-2xl p-4">
              <View className="flex-row flex-wrap gap-3">
                {WALLET_COLORS.map((color) => (
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
                    <Text className="text-textSecondary text-xs mt-1">
                      {color.name}
                    </Text>
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
                {WALLET_ICONS.map((icon) => (
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