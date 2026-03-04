// components/WalletPicker.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallets } from '../contexts/WalletContext';

interface WalletPickerProps {
  selectedWallet: string;
  onSelectWallet: (walletName: string) => void;
  label?: string;
}

export default function WalletPicker({
  selectedWallet,
  onSelectWallet,
  label = 'Wallet',
}: WalletPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { wallets } = useWallets();
  const insets = useSafeAreaInsets();

  const selectedWalletData = wallets.find(w => w.name === selectedWallet);

  const handleSelect = (walletName: string) => {
    onSelectWallet(walletName);
    setModalVisible(false);
  };

  return (
    <View>
      <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
        {label} <Text className="text-expense">*</Text>
      </Text>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
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
        <View
          className="w-7 h-7 rounded-lg items-center justify-center"
          style={{
            backgroundColor: selectedWalletData ? selectedWalletData.color + '20' : '#F8FAFC',
          }}
        >
          <Text style={{ fontSize: 15 }}>{selectedWalletData?.icon || '👛'}</Text>
        </View>
        <Text
          className={`flex-1 text-base font-medium ${selectedWallet ? 'text-textPrimary' : 'text-slate-400'}`}
        >
          {selectedWallet || 'Select a wallet'}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#CBD5E1" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable className="flex-1 bg-black/50" onPress={() => setModalVisible(false)}>
          <Pressable
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl"
            onPress={e => e.stopPropagation()}
          >
            {/* Handle */}
            <View className="items-center pt-3 pb-1">
              <View className="w-8 h-1 rounded-full bg-slate-300" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
              <View>
                <Text
                  className="text-textPrimary text-lg font-bold"
                  style={{ letterSpacing: -0.3 }}
                >
                  Select Wallet
                </Text>
                {selectedWallet && (
                  <Text className="text-primary text-xs font-medium mt-0.5">
                    {selectedWallet} selected
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 380 }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 20,
                gap: 4,
              }}
            >
              {wallets.length === 0 ? (
                <View className="items-center py-10">
                  <Text style={{ fontSize: 36, marginBottom: 10 }}>👛</Text>
                  <Text className="text-slate-600 text-base font-medium">No wallets yet</Text>
                  <Text className="text-slate-400 text-sm mt-1 text-center">
                    Go to the Wallets tab to create your first wallet
                  </Text>
                </View>
              ) : (
                wallets.map(wallet => {
                  const isSelected = selectedWallet === wallet.name;
                  return (
                    <TouchableOpacity
                      key={wallet.id}
                      onPress={() => handleSelect(wallet.name)}
                      activeOpacity={0.65}
                      className={`flex-row items-center px-4 rounded-2xl ${isSelected ? 'bg-teal-100 border-2 border-teal-300' : 'bg-card'}`}
                      style={{ paddingVertical: 11, gap: 14 }}
                    >
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center ${isSelected ? 'bg-teal-200' : ''}`}
                        style={{ backgroundColor: isSelected ? undefined : wallet.color + '20' }}
                      >
                        <Text style={{ fontSize: 21 }}>{wallet.icon}</Text>
                      </View>
                      <Text
                        className={`flex-1 text-base ${isSelected ? 'text-teal-700 font-semibold' : 'text-textPrimary'}`}
                      >
                        {wallet.name}
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
        </Pressable>
      </Modal>
    </View>
  );
}
