import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import WalletsScreen from '../screens/WalletsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#14B8A6',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            height: 65,
            paddingBottom: 10,
            paddingTop: 5,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        {/* Home Tab */}
        <Tab.Screen 
          name="Home" 
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />

        {/* Wallets Tab */}
        <Tab.Screen 
          name="Wallets" 
          component={WalletsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet" size={size} color={color} />
            ),
          }}
        />

        {/* Center Add Button - This is the magic! */}
        <Tab.Screen 
          name="Add" 
          component={AddTransactionScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.centerButtonContainer}>
                <View style={[
                  styles.centerButton,
                  { backgroundColor: focused ? '#0D9488' : '#14B8A6' }
                ]}>
                  <Ionicons name="add" size={32} color="#FFFFFF" />
                </View>
              </View>
            ),
            tabBarLabel: () => null, // Hide label for center button
          }}
        />

        {/* Goals Tab */}
        <Tab.Screen 
          name="Goals" 
          component={GoalsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="flag" size={size} color={color} />
            ),
          }}
        />

        {/* Settings Tab */}
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Styles for the elevated center button
const styles = StyleSheet.create({
  centerButtonContainer: {
    top: -25, // Move button UP (above navbar)
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF', // White border around button
  },
});