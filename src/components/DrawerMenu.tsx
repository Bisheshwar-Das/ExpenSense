// components/DrawerMenu.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootNavigationProp } from '../navigation/types';
import { useSettings } from '../contexts/SettingsContext';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const navigation = useNavigation<RootNavigationProp>();
  const { currency } = useSettings();

  const handleNavigate = (screen: any) => {
    onClose();
    // Small delay so drawer closes before navigation
    setTimeout(() => {
      navigation.navigate(screen);
    }, 300);
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert('Coming Soon! 🚀', `${feature} will be available in a future update.`);
  };

  const menuItems = [
    {
      icon: 'settings-outline',
      label: 'Settings',
      onPress: () => handleNavigate('Settings'),
      color: '#0891B2',
    },
    {
      icon: 'bar-chart-outline',
      label: 'Reports',
      onPress: () => handleComingSoon('Reports'),
      color: '#8B5CF6',
      badge: 'Soon',
    },
    {
      icon: 'download-outline',
      label: 'Export Data',
      onPress: () => handleComingSoon('Export Data'),
      color: '#10B981',
      badge: 'Soon',
    },
    {
      icon: 'information-circle-outline',
      label: 'About',
      onPress: () => handleComingSoon('About'),
      color: '#F59E0B',
    },
    {
      icon: 'mail-outline',
      label: 'Contact Support',
      onPress: () => handleComingSoon('Contact Support'),
      color: '#EF4444',
    },
  ];

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        {/* Drawer - slides from RIGHT */}
        <Pressable
          className="absolute right-0 top-0 bottom-0 w-4/5 bg-white"
          onPress={e => e.stopPropagation()}
        >
          <ScrollView className="flex-1">
            {/* Header */}
            <View className="bg-primary p-6 pt-16">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-2xl font-bold">Expen$ense</Text>
                <TouchableOpacity onPress={onClose} className="p-2">
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text className="text-white/80 text-sm">Personal Finance Manager</Text>
            </View>

            {/* Menu Items */}
            <View className="p-4">
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={item.onPress}
                  className="flex-row items-center p-4 rounded-xl mb-2 bg-background"
                >
                  {/* Icon */}
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: item.color + '20' }}
                  >
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>

                  {/* Label */}
                  <Text className="flex-1 text-textPrimary font-medium text-base">
                    {item.label}
                  </Text>

                  {/* Badge (if any) */}
                  {item.badge && (
                    <View className="bg-primary/10 px-2 py-1 rounded-full">
                      <Text className="text-primary text-xs font-semibold">{item.badge}</Text>
                    </View>
                  )}

                  {/* Arrow */}
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View className="p-6 border-t border-border mt-auto">
              <Text className="text-textSecondary text-xs text-center mb-2">Expen$ense v1.0.0</Text>
              <Text className="text-textSecondary text-xs text-center">
                Made with ❤️ for better money management
              </Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
