// src/contexts/OnboardingContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

interface OnboardingContextType {
  isOnboarded: boolean;
  userProfile: UserProfile | null;
  isLoading: boolean;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_KEY = '@expensense_onboarding_completed';
const USER_PROFILE_KEY = '@expensense_user_profile';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding status and user profile when app starts
  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const [onboardingValue, profileValue] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem(USER_PROFILE_KEY),
      ]);

      setIsOnboarded(onboardingValue === 'true');
      if (profileValue) {
        setUserProfile(JSON.parse(profileValue));
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (profile: UserProfile) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(ONBOARDING_KEY, 'true'),
        AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile)),
      ]);

      setIsOnboarded(true);
      setUserProfile(profile);
      console.log('✅ Onboarding completed');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!userProfile) return;

      const updatedProfile = { ...userProfile, ...updates };
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const resetOnboarding = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ONBOARDING_KEY),
        AsyncStorage.removeItem(USER_PROFILE_KEY),
      ]);

      setIsOnboarded(false);
      setUserProfile(null);
      console.log('✅ Onboarding reset');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarded,
        userProfile,
        isLoading,
        completeOnboarding,
        resetOnboarding,
        updateProfile,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
