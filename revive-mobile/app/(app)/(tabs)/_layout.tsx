import React from 'react';
import { Tabs } from 'expo-router';
import { Heart, ListChecks, Target, ChartNoAxesCombined, UserRound } from 'lucide-react-native';
import { colors } from '@/ui/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border } }}>
      <Tabs.Screen name="index" options={{ title: 'Jornada', tabBarIcon: ({ color, size }) => <Heart color={color} size={size} /> }} />
      <Tabs.Screen name="habits" options={{ title: 'Hábitos', tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} /> }} />
      <Tabs.Screen name="goals" options={{ title: 'Metas', tabBarIcon: ({ color, size }) => <Target color={color} size={size} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: ({ color, size }) => <ChartNoAxesCombined color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
    </Tabs>
  );
}
