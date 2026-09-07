import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/features/auth/session-context';

export default function AuthenticatedLayout() {
  const { user, isRestoring } = useSession();
  if (!isRestoring && !user) return <Redirect href="/(public)/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
