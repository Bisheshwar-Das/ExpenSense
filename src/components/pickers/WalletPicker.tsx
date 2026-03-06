// src/components/pickers/WalletPicker.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallets } from '../../contexts/WalletContext';

interface WalletPickerProps {
  selectedWalletId: string;
  onSelectWallet: (walletId: string) => void;
  label?: string;
}

export default function WalletPicker({
  selectedWalletId,
  onSelectWallet,
  label = 'Wallet',
}: WalletPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { wallets } = useWallets();
  const insets = useSafeAreaInsets();

  const selectedWalletData = wallets.find(w => w.id === selectedWalletId);

  return (
    <View>
      <Text
        style={{
          color: '#64748B',
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label} <Text style={{ color: '#EF4444' }}>*</Text>
      </Text>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        style={{
          backgroundColor: '#FFF',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selectedWalletData ? selectedWalletData.color + '20' : '#F8FAFC',
          }}
        >
          <Text style={{ fontSize: 15 }}>{selectedWalletData?.icon ?? '👛'}</Text>
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: '500',
            color: selectedWalletData ? '#0F172A' : '#94A3B8',
          }}
        >
          {selectedWalletData?.name ?? 'Select a wallet'}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#CBD5E1" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#F8FAFC',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
            }}
            onPress={e => e.stopPropagation()}
          >
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 24,
                paddingTop: 8,
                paddingBottom: 16,
              }}
            >
              <Text style={{ color: '#0F172A', fontSize: 18, fontWeight: '700' }}>
                Select Wallet
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#E2E8F0',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={16} color="#475569" />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 380 }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 20,
                gap: 4,
              }}
            >
              {wallets.map(wallet => {
                const isSelected = selectedWalletId === wallet.id;
                return (
                  <TouchableOpacity
                    key={wallet.id}
                    onPress={() => {
                      onSelectWallet(wallet.id);
                      setModalVisible(false);
                    }}
                    activeOpacity={0.65}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 16,
                      gap: 14,
                      backgroundColor: isSelected ? '#CCFBF1' : '#FFF',
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: '#5EEAD4',
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? '#99F6E4' : wallet.color + '20',
                      }}
                    >
                      <Text style={{ fontSize: 21 }}>{wallet.icon}</Text>
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: isSelected ? '#0F766E' : '#0F172A',
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {wallet.name}
                    </Text>
                    {isSelected && (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: '#14B8A6',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
