// navigation/types.ts
import { NavigationProp, RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: undefined;
  Transactions: { walletFilter?: string } | undefined;
  TransactionDetails: { transactionId: string };
  EditTransaction: { transactionId: string };
  WalletDetail: { walletId: string };
  Settings: undefined;
  Savings: undefined;
  Budgets: undefined;
  Hub: undefined;
  Categories: undefined;
  AddEditCategory: { categoryId?: string; defaultType?: 'expense' | 'income' };
};

export type TabParamList = {
  Home: undefined;
  Wallets: undefined;
  Add: undefined;
  Reports: undefined;
  Hub: undefined;
};

export type RootNavigationProp = NavigationProp<RootStackParamList>;
export type TabNavigationProp = NavigationProp<TabParamList>;

export type TransactionDetailsRouteProp = RouteProp<RootStackParamList, 'TransactionDetails'>;
export type EditTransactionRouteProp = RouteProp<RootStackParamList, 'EditTransaction'>;
export type AddEditCategoryRouteProp = RouteProp<RootStackParamList, 'AddEditCategory'>;
