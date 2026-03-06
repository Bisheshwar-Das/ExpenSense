// src/navigation/types.ts
import { NavigationProp, RouteProp } from '@react-navigation/native';

// ─── Root Stack Params (Modal/Detail screens shown on top) ──────────────────

export type RootStackParamList = {
  MainTabs: undefined;
  Transactions: { walletFilter?: string } | undefined;
  TransactionDetails: { transactionId: string };
  EditTransaction: { transactionId: string };
  WalletDetail: { walletId: string };
  Settings: undefined;
  Savings: undefined;
  Budgets: undefined;
  Categories: undefined;
  AddEditCategory: { categoryId?: string; defaultType?: 'expense' | 'income' };
};

// ─── Tab Navigator Params ─────────────────────────────────────────────────────

export type TabParamList = {
  Home: undefined;
  Wallets: undefined;
  Add: undefined;
  Reports: undefined;
  Hub: undefined;
};

// ─── Navigation Props ─────────────────────────────────────────────────────────

export type RootNavigationProp = NavigationProp<RootStackParamList>;
export type TabNavigationProp = NavigationProp<TabParamList>;

// ─── Route Props for screens with params ──────────────────────────────────────

export type TransactionDetailsRouteProp = RouteProp<RootStackParamList, 'TransactionDetails'>;
export type EditTransactionRouteProp = RouteProp<RootStackParamList, 'EditTransaction'>;
export type AddEditCategoryRouteProp = RouteProp<RootStackParamList, 'AddEditCategory'>;
export type WalletDetailRouteProp = RouteProp<RootStackParamList, 'WalletDetail'>;
