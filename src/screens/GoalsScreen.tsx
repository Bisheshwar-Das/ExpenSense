import React from 'react';
import { View, Text } from 'react-native';

export default function GoalsScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-textPrimary text-2xl font-bold mb-2">
        Goals
      </Text>
      <Text className="text-textSecondary">
        Coming soon...
      </Text>
    </View>
  );
}