import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import WalletsScreen from '../screens/WalletsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import TransactionDetailsScreen from '../screens/TransactionDetailsScreen';
import EditTransactionScreen from '../screens/EditTransactionScreen';
import TransactionsScreen from '../screens/TransactionsScreen';

// Import types
import { RootStackParamList, TabParamList } from './types';
import WalletDetailScreen from '@/screens/WalletDetailScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Main Tab Navigator (with bottom tabs)
function TabNavigator() {
  return (
    <Tab.Navigator
      id="TabNavigator"
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
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />

      {/* Wallets Tab */}
      <Tab.Screen
        name="Wallets"
        component={WalletsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
        }}
      />

      {/* Center Add Button */}
      <Tab.Screen
        name="Add"
        component={AddTransactionScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerButtonContainer}>
              <View
                style={[styles.centerButton, { backgroundColor: focused ? '#0D9488' : '#14B8A6' }]}
              >
                <Ionicons name="add" size={32} color="#FFFFFF" />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />

      {/* Reports Tab - Replaces Settings */}
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />

      {/* Goals Tab */}
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="flag" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Root Stack Navigator (wraps tabs + modal screens)
export default function AppNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator id="RootStack">
          {/* Main app with tabs */}
          <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />

          {/* Modal/Detail screens (shown on top of tabs) */}
          <Stack.Screen
            name="Transactions"
            component={TransactionsScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="TransactionDetails"
            component={TransactionDetailsScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="EditTransaction"
            component={EditTransactionScreen}
            options={{
              headerShown: false,
            }}
          />

          {/* Settings Screen - Now a modal */}
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="WalletDetail"
            component={WalletDetailScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  centerButtonContainer: {
    top: -25,
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
    borderColor: '#FFFFFF',
  },
});
