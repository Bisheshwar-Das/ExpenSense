// src/contexts/SettingsContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

type Theme = 'light' | 'dark';

type SettingsContextType = {
  currency: Currency;
  theme: Theme;
  setCurrency: (currency: Currency) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_KEY = '@expensense_settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]); // Default USD
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);

        // Load currency
        if (settings.currencyCode) {
          const savedCurrency = CURRENCIES.find(c => c.code === settings.currencyCode);
          if (savedCurrency) {
            setCurrencyState(savedCurrency);
            console.log('✅ Loaded currency:', savedCurrency.code);
          }
        }

        // Load theme
        if (settings.theme) {
          setThemeState(settings.theme);
          console.log('✅ Loaded theme:', settings.theme);
        }
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (updates: { currencyCode?: string; theme?: Theme }) => {
    try {
      const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
      const settings = settingsJson ? JSON.parse(settingsJson) : {};

      if (updates.currencyCode) {
        settings.currencyCode = updates.currencyCode;
      }
      if (updates.theme) {
        settings.theme = updates.theme;
      }

      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      throw error;
    }
  };

  const setCurrency = async (newCurrency: Currency) => {
    try {
      setCurrencyState(newCurrency);
      await saveSettings({ currencyCode: newCurrency.code });
      console.log('💾 Saved currency:', newCurrency.code);
    } catch (error) {
      console.error('Error saving currency:', error);
      throw error;
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await saveSettings({ theme: newTheme });
      console.log('💾 Saved theme:', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        currency,
        theme,
        setCurrency,
        setTheme,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
