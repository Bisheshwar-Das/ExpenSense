// navigation/types.ts
import { NavigationProp, RouteProp } from '@react-navigation/native';

// Define all the routes and their params
export type RootStackParamList = {
  MainTabs: undefined;
  Transactions: undefined;
  TransactionDetails: { transactionId: string };
  EditTransaction: { transactionId: string };
  Settings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Wallets: undefined;
  Add: undefined;
  Reports: undefined;
  Goals: undefined;
};

// Navigation prop types for each screen
export type RootNavigationProp = NavigationProp<RootStackParamList>;
export type TabNavigationProp = NavigationProp<TabParamList>;

// Route prop types
export type TransactionDetailsRouteProp = RouteProp<RootStackParamList, 'TransactionDetails'>;
export type EditTransactionRouteProp = RouteProp<RootStackParamList, 'EditTransaction'>;
