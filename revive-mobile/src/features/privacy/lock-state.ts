export type AppVisibilityState = 'active' | 'inactive' | 'background' | 'unknown';
export type PrivacyTransition = 'none' | 'lock' | 'authenticate';

export function privacyTransition(
  enabled: boolean,
  previous: AppVisibilityState,
  next: AppVisibilityState,
): PrivacyTransition {
  if (!enabled) return 'none';
  if (next === 'background') return 'lock';
  if (next === 'active' && previous === 'background') return 'authenticate';
  return 'none';
}

export function canRenderProtectedContent(input: {
  restoringSession: boolean;
  userId: string | null;
  ownerUserId: string | null;
  preferenceLoaded: boolean;
  enabled: boolean;
  locked: boolean;
}) {
  if (input.restoringSession || !input.userId || !input.preferenceLoaded || input.ownerUserId !== input.userId) return false;
  return !input.enabled || !input.locked;
}
