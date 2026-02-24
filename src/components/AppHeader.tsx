// components/AppHeader.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DrawerMenu from './DrawerMenu';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children?: React.ReactNode; // For balance cards, tabs, etc.
}

export default function AppHeader({ title, subtitle, icon, children }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <View
        className="bg-primary pb-8 px-6 rounded-b-[30px]"
        style={{ paddingTop: insets.top + 16 }}
      >
        {/* Header Row with Title and Menu */}
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-1">
            <Text className="text-white text-3xl font-bold mb-1">
              {icon && `${icon} `}
              {title}
            </Text>
            {subtitle && <Text className="text-white/80 text-sm">{subtitle}</Text>}
          </View>

          {/* Hamburger Menu Icon */}
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            className="bg-white/20 p-2 rounded-xl ml-3"
          >
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Custom Content (balance cards, tabs, etc.) */}
        {children}
      </View>

      {/* Drawer Menu */}
      <DrawerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}
