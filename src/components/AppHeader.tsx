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
  onBack?: () => void;
  children?: React.ReactNode;
}

export default function AppHeader({ title, subtitle, icon, onBack, children }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <View
        className="bg-primary pb-8 px-6 rounded-b-[30px]"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center mb-6">
          {/* Left — back button or empty spacer */}
          <View className="w-10">
            {onBack && (
              <TouchableOpacity onPress={onBack} className="bg-white/20 p-2 rounded-xl">
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Center — title + subtitle */}
          <View className="flex-1 items-center">
            <Text className="text-white text-2xl font-bold" numberOfLines={1}>
              {icon && `${icon} `}
              {title}
            </Text>
            {subtitle && <Text className="text-white/80 text-sm mt-0.5">{subtitle}</Text>}
          </View>

          {/* Right — hamburger always */}
          <View className="w-10 items-end">
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              className="bg-white/20 p-2 rounded-xl"
            >
              <Ionicons name="menu" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {children}
      </View>

      <DrawerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
}
