// src/types/index.ts

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  wallet: string;
  type: 'income' | 'expense';
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  color: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
}