import React from 'react';
import { AppState } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import { claimNotificationIntent } from './notification-intent';
import { NotificationIntentProvider, NotificationNavigation } from './notification-navigation';
import { CHECKIN_PATH, REMINDER_KIND, REMINDER_PREFIX } from './reminder-contract';

let mockOwner: string | null = 'a';
let mockRestoring = false;
let mockUnlocked = true;
let mockGeneration = 1;
const mockPush = jest.fn();
const mockRouter = { push: mockPush };
const mockGetUser = jest.fn<() => Promise<{ id: string } | null>>();
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@/features/auth/session-context', () => ({ useSession: () => ({ user: mockOwner ? { id: mockOwner } : null, isRestoring: mockRestoring }) }));
jest.mock('@/features/privacy/privacy-lock-provider', () => ({ usePrivacyLock: () => ({ canOpenContent: mockUnlocked }) }));
jest.mock('@/core/auth/token-store', () => ({ tokenStore: { getGeneration: () => mockGeneration, isCurrent: (generation: number) => generation === mockGeneration, getUser: () => mockGetUser() } }));
jest.mock('expo-notifications', () => ({ getLastNotificationResponse: jest.fn(), clearLastNotificationResponse: jest.fn(), addNotificationResponseReceivedListener: jest.fn(), dismissNotificationAsync: jest.fn(), DEFAULT_ACTION_IDENTIFIER: 'default' }));
jest.mock('./notification-intent', () => ({ ...jest.requireActual<typeof import('./notification-intent')>('./notification-intent'), claimNotificationIntent: jest.fn() }));

const response = (): Notifications.NotificationResponse => ({ actionIdentifier: 'default', notification: { date: 1000, request: { identifier: `${REMINDER_PREFIX}test`, content: { data: { kind: REMINDER_KIND, ownerId: 'a', path: CHECKIN_PATH } } } } } as never);
const tree = () => <NotificationIntentProvider><NotificationNavigation /></NotificationIntentProvider>;
const initialAppState = AppState.currentState;
beforeEach(() => {
  jest.resetAllMocks(); mockOwner = 'a'; mockRestoring = false; mockUnlocked = true; mockGeneration = 1;
  AppState.currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  jest.mocked(Notifications.getLastNotificationResponse).mockReturnValue(response());
  jest.mocked(Notifications.addNotificationResponseReceivedListener).mockReturnValue({ remove: jest.fn() } as never);
  jest.mocked(claimNotificationIntent).mockResolvedValue(true);
  mockGetUser.mockImplementation(async () => mockOwner ? { id: mockOwner } : null);
});
afterEach(() => { AppState.currentState = initialAppState; jest.restoreAllMocks(); });

it('waits for restoration, login and device unlock before consuming the cold-start event', async () => {
  mockRestoring = true; mockOwner = null; mockUnlocked = false;
  const view = await render(tree());
  expect(mockPush).not.toHaveBeenCalled();
  expect(claimNotificationIntent).not.toHaveBeenCalled();
  mockRestoring = false;
  await view.rerender(tree());
  expect(claimNotificationIntent).not.toHaveBeenCalled();
  mockOwner = 'a';
  await view.rerender(tree());
  expect(mockPush).not.toHaveBeenCalled();
  mockUnlocked = true;
  await view.rerender(tree());
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith(CHECKIN_PATH));
  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(Notifications.clearLastNotificationResponse).toHaveBeenCalledTimes(1);
});

it('deduplicates the initial response and a simultaneous foreground callback', async () => {
  mockUnlocked = false;
  const view = await render(tree());
  const listener = jest.mocked(Notifications.addNotificationResponseReceivedListener).mock.calls[0]![0];
  await act(async () => { listener(response()); });
  mockUnlocked = true;
  await view.rerender(tree());
  await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
  expect(claimNotificationIntent).toHaveBeenCalledTimes(1);
});

it('discards the old account response after authenticating another account', async () => {
  mockOwner = 'b';
  await render(tree());
  await waitFor(() => expect(Notifications.clearLastNotificationResponse).toHaveBeenCalled());
  expect(mockPush).not.toHaveBeenCalled();
});

it('does not navigate when the same event was consumed by a previous launch', async () => {
  jest.mocked(claimNotificationIntent).mockResolvedValue(false);
  await render(tree());
  await waitFor(() => expect(Notifications.clearLastNotificationResponse).toHaveBeenCalled());
  expect(mockPush).not.toHaveBeenCalled();
});

it('retains a claimed tap if the privacy gate closes during the storage read', async () => {
  let finishRead!: (user: { id: string }) => void;
  mockGetUser.mockImplementationOnce(() => new Promise(resolve => { finishRead = resolve; }));
  const view = await render(tree());
  await waitFor(() => expect(mockGetUser).toHaveBeenCalled());
  mockUnlocked = false;
  await view.rerender(tree());
  await act(async () => { finishRead({ id: 'a' }); });
  expect(mockPush).not.toHaveBeenCalled();
  expect(Notifications.clearLastNotificationResponse).not.toHaveBeenCalled();
  mockUnlocked = true;
  await view.rerender(tree());
  await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
  expect(claimNotificationIntent).toHaveBeenCalledTimes(1);
});

it('rechecks the session after reading the stored owner', async () => {
  mockGetUser.mockImplementationOnce(async () => { mockGeneration += 1; return { id: 'a' }; });
  await render(tree());
  await waitFor(() => expect(Notifications.clearLastNotificationResponse).toHaveBeenCalled());
  expect(mockPush).not.toHaveBeenCalled();
});

it('ignores unknown paths and does not bypass a gate on storage failure', async () => {
  const invalid = response(); invalid.notification.request.content.data!.path = '/admin';
  jest.mocked(Notifications.getLastNotificationResponse).mockReturnValue(invalid);
  const view = await render(tree());
  expect(claimNotificationIntent).not.toHaveBeenCalled();
  const listener = jest.mocked(Notifications.addNotificationResponseReceivedListener).mock.calls[0]![0];
  jest.mocked(claimNotificationIntent).mockRejectedValue(new Error('Cannot persist'));
  await act(async () => { listener(response()); });
  expect(mockPush).not.toHaveBeenCalled();
  await view.unmount();
});
