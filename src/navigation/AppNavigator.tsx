import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import WalletsScreen from '../screens/wallets/WalletsScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import AddTransactionScreen from '../screens/transactions/AddTransactionScreen';
import TransactionDetailsScreen from '../screens/transactions/TransactionDetailsScreen';
import EditTransactionScreen from '../screens/transactions/EditTransactionScreen';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import HubScreen from '../screens/hub/HubScreen';
import SavingsScreen from '../screens/hub/SavingsScreen';
import BudgetsScreen from '../screens/hub/BudgetsScreen';
import CategoriesScreen from '../screens/hub/CategoriesScreen';
import AddEditCategoryScreen from '@/screens/hub/AddEditCategoryScreen';

// Import types
import { RootStackParamList, TabParamList } from './types';
import WalletDetailScreen from '@/screens/wallets/WalletDetailScreen';

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

      <Tab.Screen
        name="Hub"
        component={HubScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
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
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WalletDetail"
            component={WalletDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Savings" component={SavingsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Budgets" component={BudgetsScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="AddEditCategory"
            component={AddEditCategoryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Categories"
            component={CategoriesScreen}
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
