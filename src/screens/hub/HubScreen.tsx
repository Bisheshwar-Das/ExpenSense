// screens/HubScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import { RootNavigationProp } from '@/navigation/types';
import { useSettings } from '@/contexts/SettingsContext';

const comingSoon = (feature: string) =>
  Alert.alert('Coming Soon 🚀', `${feature} will be available in a future update.`);

function HubRow({
  icon,
  label,
  subtitle,
  color,
  onPress,
  badge,
  disabled,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  color: string;
  onPress: () => void;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      className="flex-row items-center px-4 py-3.5 bg-card rounded-2xl mb-2"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: color + '20' }}
      >
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-textPrimary font-semibold text-sm">{label}</Text>
        {subtitle && <Text className="text-textSecondary text-xs mt-0.5">{subtitle}</Text>}
      </View>
      {badge ? (
        <View className="bg-primary/10 px-2 py-0.5 rounded-full mr-2">
          <Text className="text-primary text-xs font-semibold">{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2 mt-4 px-1">
      {label}
    </Text>
  );
}

export default function HubScreen() {
  const navigation = useNavigation<any>();
  const { currency } = useSettings();

  return (
    <ScrollView className="flex-1 bg-background">
      <AppHeader title="Hub" subtitle="Your financial command centre" titleAlign="left">
        {/* Quick identity strip */}
        <View className="flex-row items-center gap-3 bg-white/10 rounded-2xl px-4 py-3">
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold text-sm">Welcome back</Text>
            <Text className="text-white/60 text-xs">Manage everything from here</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            className="bg-white/20 p-2 rounded-xl"
          >
            <Ionicons name="settings-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </AppHeader>

      <View className="px-4 pb-8">
        {/* ── Goals ── */}
        <SectionLabel label="Goals" />
        <HubRow
          icon="trending-up-outline"
          label="Savings Goals"
          subtitle="Track progress toward your targets"
          color="#22C55E"
          onPress={() => navigation.navigate('Savings')}
        />
        <HubRow
          icon="pie-chart-outline"
          label="Budgets"
          subtitle="Control your spending by category"
          color="#8B5CF6"
          onPress={() => navigation.navigate('Budgets')}
        />

        {/* ── Tools ── */}
        <SectionLabel label="Tools" />
        <HubRow
          icon="pricetag-outline"
          label="Categories"
          subtitle="Customise your transaction categories"
          color="#14B8A6"
          onPress={() => navigation.navigate('Categories')}
        />
        <HubRow
          icon="repeat-outline"
          label="Scheduled Transactions"
          subtitle="Set up recurring income and expenses"
          color="#0891B2"
          onPress={() => comingSoon('Scheduled Transactions')}
          badge="Soon"
          disabled
        />
        <HubRow
          icon="calendar-outline"
          label="Calendar View"
          subtitle="See your transactions on a calendar"
          color="#F59E0B"
          onPress={() => comingSoon('Calendar View')}
          badge="Soon"
          disabled
        />
        <HubRow
          icon="pricetags-outline"
          label="Tags"
          subtitle="Label and filter transactions with tags"
          color="#EC4899"
          onPress={() => comingSoon('Tags')}
          badge="Soon"
          disabled
        />
        <HubRow
          icon="download-outline"
          label="Export Data"
          subtitle="Export transactions to CSV"
          color="#10B981"
          onPress={() => comingSoon('Export Data')}
          badge="Soon"
          disabled
        />

        {/* ── Premium ── */}
        <SectionLabel label="Premium" />
        <TouchableOpacity onPress={() => comingSoon('Premium')} activeOpacity={0.8}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-4 mb-2"
          >
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3">
                <Ionicons name="sparkles" size={20} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">Upgrade to Premium</Text>
                <Text className="text-white/70 text-xs">Unlock themes, backup & more</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
            </View>
            <View className="flex-row gap-2 flex-wrap">
              {['Themes', 'Cloud Backup', 'Multi-currency', 'Advanced Reports'].map(f => (
                <View key={f} className="bg-white/15 rounded-full px-2.5 py-1">
                  <Text className="text-white text-xs font-medium">{f}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Account ── */}
        <SectionLabel label="Account" />
        <HubRow
          icon="settings-outline"
          label="Settings"
          subtitle="Currency, preferences and more"
          color="#64748B"
          onPress={() => navigation.navigate('Settings')}
        />
        <HubRow
          icon="person-outline"
          label="Profile"
          subtitle="Your account details"
          color="#0891B2"
          onPress={() => comingSoon('Profile')}
          badge="Soon"
          disabled
        />
        <HubRow
          icon="information-circle-outline"
          label="About"
          subtitle="Version, support and feedback"
          color="#F59E0B"
          onPress={() => comingSoon('About')}
        />
      </View>
    </ScrollView>
  );
}
