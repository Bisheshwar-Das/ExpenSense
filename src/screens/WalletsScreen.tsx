import React from 'react';
import { View, Text } from 'react-native';

export default function WalletsScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-textPrimary text-2xl font-bold mb-2">
        Wallets
      </Text>
      <Text className="text-textSecondary">
        Coming soon...
      </Text>
    </View>
  );
}