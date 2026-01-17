// components/WalletPicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
// ⭐ Import the wallet context
import { useWallets } from '../contexts/WalletContext';

interface WalletPickerProps {
  selectedWallet: string;
  onSelectWallet: (walletName: string) => void;
}

export default function WalletPicker({
  selectedWallet,
  onSelectWallet,
}: WalletPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Get wallets from context instead of DEFAULT_WALLETS
  const { wallets } = useWallets();

  const handleSelect = (walletName: string) => {
    onSelectWallet(walletName);
    setModalVisible(false);
  };

  // Find selected wallet from the dynamic list
  const selectedWalletData = wallets.find(w => w.name === selectedWallet);

  return (
    <View className="px-6 py-4">
      <Text className="text-textSecondary text-sm mb-3">Wallet</Text>
      
      {/* Wallet Button */}
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 flex-row items-center justify-between"
        onPress={() => setModalVisible(true)}
      >
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: (selectedWalletData?.color || '#6366F1') + '20' }}
          >
            <Text className="text-xl">{selectedWalletData?.icon || '👛'}</Text>
          </View>
          <Text className="text-textPrimary font-medium text-base">
            {selectedWallet}
          </Text>
        </View>
        <Text className="text-textSecondary">›</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View className="px-6 py-4 border-b border-border">
              <View className="flex-row items-center justify-between">
                <Text className="text-textPrimary text-xl font-semibold">
                  Select Wallet
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text className="text-primary text-lg font-medium">Done</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Wallet List */}
            <ScrollView className="max-h-96">
              <View className="px-6 py-4">
                {/* ⭐ Show message if no wallets exist */}
                {wallets.length === 0 ? (
                  <View className="py-8 items-center">
                    <Text className="text-4xl mb-3">👛</Text>
                    <Text className="text-textPrimary font-medium text-base mb-2">
                      No wallets yet
                    </Text>
                    <Text className="text-textSecondary text-sm text-center">
                      Go to the Wallets tab to create your first wallet
                    </Text>
                  </View>
                ) : (
                  /* ⭐ Map through dynamic wallets */
                  wallets.map((wallet) => (
                    <TouchableOpacity
                      key={wallet.id}
                      onPress={() => handleSelect(wallet.name)}
                      className={`flex-row items-center p-4 rounded-2xl mb-3 ${
                        selectedWallet === wallet.name
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-background'
                      }`}
                    >
                      {/* Wallet Icon */}
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: wallet.color + '20' }}
                      >
                        <Text className="text-2xl">{wallet.icon}</Text>
                      </View>

                      {/* Wallet Info */}
                      <View className="flex-1">
                        <Text className="text-textPrimary font-semibold text-base">
                          {wallet.name}
                        </Text>
                      </View>

                      {/* Checkmark */}
                      {selectedWallet === wallet.name && (
                        <Text className="text-primary text-2xl">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}