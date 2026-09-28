import { describe, expect, it } from '@jest/globals';
import { canRenderProtectedContent, privacyTransition } from './lock-state';

describe('privacy lock state', () => {
  it('locks after background and requests system authentication on return', () => {
    expect(privacyTransition(true, 'active', 'background')).toBe('lock');
    expect(privacyTransition(true, 'background', 'active')).toBe('authenticate');
    expect(privacyTransition(true, 'active', 'inactive')).toBe('none');
    expect(privacyTransition(false, 'active', 'background')).toBe('none');
  });

  it('does not reveal content while restoring, changing account, loading preference, or locked', () => {
    const ready = {
      restoringSession: false,
      userId: 'account-a',
      ownerUserId: 'account-a',
      preferenceLoaded: true,
      enabled: true,
      locked: true,
    };
    expect(canRenderProtectedContent({ ...ready, restoringSession: true })).toBe(false);
    expect(canRenderProtectedContent({ ...ready, ownerUserId: 'account-b' })).toBe(false);
    expect(canRenderProtectedContent({ ...ready, preferenceLoaded: false })).toBe(false);
    expect(canRenderProtectedContent({ ...ready, userId: null })).toBe(false);
    expect(canRenderProtectedContent(ready)).toBe(false);
    expect(canRenderProtectedContent({ ...ready, locked: false })).toBe(true);
  });

  it('keeps the app usable when the optional lock is off', () => {
    expect(canRenderProtectedContent({
      restoringSession: false,
      userId: 'account-a',
      ownerUserId: 'account-a',
      preferenceLoaded: true,
      enabled: false,
      locked: false,
    })).toBe(true);
  });
});
