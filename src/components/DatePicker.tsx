// components/DatePickerField.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerFieldProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export default function DatePickerField({
  date,
  onDateChange,
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  return (
    <View className="px-6 py-4">
      <Text className="text-textSecondary text-sm mb-3">Date</Text>
      
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 flex-row items-center justify-between"
        onPress={() => setShowPicker(true)}
      >
        <View className="flex-row items-center">
          <Text className="text-2xl mr-3">📅</Text>
          <Text className="text-textPrimary font-medium text-base">
            {date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        <Text className="text-textSecondary">›</Text>
      </TouchableOpacity>

      {/* Date Picker */}
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}