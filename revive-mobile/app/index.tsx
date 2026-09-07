import React from 'react';
import { Redirect } from 'expo-router';
import { LoadingState, Screen } from '@/ui/components';
import { useSession } from '@/features/auth/session-context';

export default function IndexRoute() {
  const { user, isRestoring } = useSession();
  if (isRestoring) return <Screen scroll={false}><LoadingState label="Restaurando sessão..." /></Screen>;
  return <Redirect href={user ? '/(app)/(tabs)' : '/(public)/login'} />;
}
