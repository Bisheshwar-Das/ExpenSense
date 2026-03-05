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
  onEdit?: () => void;
  editLabel?: string;
  titleAlign?: 'left' | 'center';
  hideMenu?: boolean;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export default function AppHeader({
  title,
  subtitle,
  icon,
  onBack,
  onEdit,
  editLabel = 'Edit',
  titleAlign = 'center',
  hideMenu = false,
  backgroundColor,
  children,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  const RightSlot = () => {
    if (onEdit) {
      return (
        <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-white/90 text-base font-semibold">{editLabel}</Text>
        </TouchableOpacity>
      );
    }
    if (!hideMenu) {
      return (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          className="bg-white/20 p-2 rounded-xl"
        >
          <Ionicons name="menu" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      );
    }
    return <View style={{ width: 40 }} />;
  };

  return (
    <>
      <View
        className="pb-8 px-6 rounded-b-[30px]"
        style={{ paddingTop: insets.top + 16, backgroundColor: backgroundColor ?? '#14B8A6' }}
      >
        {titleAlign === 'left' ? (
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold" numberOfLines={1}>
                {icon && `${icon} `}
                {title}
              </Text>
              {subtitle && <Text className="text-white/80 text-sm mt-0.5">{subtitle}</Text>}
            </View>
            <View className="ml-4">
              <RightSlot />
            </View>
          </View>
        ) : (
          <View className="flex-row items-center mb-6">
            <View className="w-10">
              {onBack && (
                <TouchableOpacity onPress={onBack} className="bg-white/20 p-2 rounded-xl">
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white text-2xl font-bold" numberOfLines={1}>
                {icon && `${icon} `}
                {title}
              </Text>
              {subtitle && <Text className="text-white/80 text-sm mt-0.5">{subtitle}</Text>}
            </View>
            <View className="w-10 items-end">
              <RightSlot />
            </View>
          </View>
        )}
        {children}
      </View>

      {!hideMenu && <DrawerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />}
    </>
  );
}
