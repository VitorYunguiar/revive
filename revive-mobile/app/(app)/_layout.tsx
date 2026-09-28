import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/features/auth/session-context';
import { PrivacyLockProvider } from '@/features/privacy/privacy-lock-provider';

export default function AuthenticatedLayout() {
  const { user, isRestoring } = useSession();
  if (!isRestoring && !user) return <Redirect href="/(public)/login" />;
  return (
    <PrivacyLockProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PrivacyLockProvider>
  );
}
