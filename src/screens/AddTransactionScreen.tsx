import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function AddTransactionScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-textPrimary text-2xl font-bold mb-4">
        Add Transaction
      </Text>
      <Text className="text-textSecondary mb-8">
        We'll build this next!
      </Text>
      
      <TouchableOpacity 
        className="bg-primary px-6 py-3 rounded-xl"
        onPress={() => navigation.goBack()}
      >
        <Text className="text-white font-semibold">
          Go Back
        </Text>
      </TouchableOpacity>
    </View>
  );
}