import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useApp } from '../../src/store/AppContext';
import { colors } from '../../src/theme/colors';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const icon =
  (name: IconName) =>
  ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name={name} size={size} color={color} />;

export default function TabLayout() {
  const { activeCases } = useApp();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.white, fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Scan', tabBarIcon: icon('radar') }} />
      <Tabs.Screen name="telemetry" options={{ title: 'Telemetry', tabBarIcon: icon('speedometer') }} />
      <Tabs.Screen name="cases" options={{ title: 'Cases', tabBarIcon: icon('clipboard-check-outline'), tabBarBadge: activeCases || undefined }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: icon('history') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('account-outline') }} />
    </Tabs>
  );
}
