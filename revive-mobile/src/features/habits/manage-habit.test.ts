import { beforeEach, expect, jest, test } from '@jest/globals';
import { updateHabit } from './manage-habit';
import { reviveApi } from '@/core/api/repositories';
import { tokenStore } from '@/core/auth/token-store';
import { getPendingMutations } from '@/core/storage/database';
import NetInfo from '@react-native-community/netinfo';
import type { BootstrapData } from '@/domain/types';

jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn() }));
jest.mock('@/core/api/repositories', () => ({ reviveApi: { bootstrap: jest.fn(), updateAddiction: jest.fn() } }));
jest.mock('@/core/auth/token-store', () => ({ tokenStore: { getGeneration: () => 1, isCurrent: jest.fn(), getUser: jest.fn() } }));
jest.mock('@/core/storage/database', () => ({ getPendingMutations: jest.fn(), cacheBootstrap: jest.fn() }));
jest.mock('@/core/sync/sync-engine', () => ({ syncPendingMutations: jest.fn() }));
jest.mock('@/core/query/client', () => ({ queryClient: { setQueryData: jest.fn() } }));
const fresh: BootstrapData = { usuario: { id: 'a', nome: 'Synthetic', email: 'synthetic@example.invalid' }, server_time: '', vicios: [{ id: 'h', usuario_id: 'a', nome_vicio: 'Synthetic', revision: 2, data_inicio: '2026-10-01' }], registros: [], recaidas: [], metas: [], mensagem: null };
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(tokenStore.isCurrent).mockReturnValue(true);
  jest.mocked(tokenStore.getUser).mockResolvedValue(fresh.usuario);
  jest.mocked(NetInfo.fetch).mockResolvedValue({ isConnected: true, isInternetReachable: true } as never);
  jest.mocked(reviveApi.bootstrap).mockResolvedValue(fresh);
  jest.mocked(getPendingMutations).mockResolvedValue([]);
});
test('refuses offline editing and does not enqueue or send an archive', async () => {
  jest.mocked(NetInfo.fetch).mockResolvedValue({ isConnected: false } as never);
  await expect(updateHabit('a', 'h', { revision: 2, ativo: false })).rejects.toThrow('Conecte-se');
  expect(reviveApi.updateAddiction).not.toHaveBeenCalled();
});
test('keeps a failed habit operation queued and asks for recovery before archiving', async () => {
  jest.mocked(getPendingMutations).mockResolvedValue([{ payload: { addictionId: 'h' }, type: 'relapse.create', status: 'failed' }] as never);
  await expect(updateHabit('a', 'h', { revision: 2, ativo: false })).rejects.toThrow('operações pendentes');
  expect(reviveApi.updateAddiction).not.toHaveBeenCalled();
});
test('uses a fresh revision and refuses to overwrite a competing edit', async () => {
  await expect(updateHabit('a', 'h', { revision: 1, nome_vicio: 'Draft' })).rejects.toMatchObject({ status: 409 });
  expect(reviveApi.updateAddiction).not.toHaveBeenCalled();
});
test('allows only reactivation to unblock an event rejected after another device archived the habit', async () => {
  jest.mocked(reviveApi.bootstrap).mockResolvedValue({ ...fresh, vicios: [{ ...fresh.vicios[0]!, ativo: false }] });
  jest.mocked(getPendingMutations).mockResolvedValue([{ payload: { vicio_id: 'h' }, type: 'record.create', status: 'failed' }] as never);
  await updateHabit('a', 'h', { revision: 2, ativo: true });
  expect(reviveApi.updateAddiction).toHaveBeenCalledWith('h', { revision: 2, ativo: true });
});
test('aborts when the session changes during the fresh bootstrap', async () => {
  jest.mocked(reviveApi.bootstrap).mockImplementation(async () => { jest.mocked(tokenStore.isCurrent).mockReturnValue(false); return fresh; });
  await expect(updateHabit('a', 'h', { revision: 2, ativo: false })).rejects.toThrow('sessão mudou');
  expect(reviveApi.updateAddiction).not.toHaveBeenCalled();
});
test('confirms a same-account edit and refreshes its canonical snapshot', async () => {
  await updateHabit('a', 'h', { revision: 2, ativo: false });
  expect(reviveApi.updateAddiction).toHaveBeenCalledWith('h', { revision: 2, ativo: false });
  expect(reviveApi.bootstrap).toHaveBeenCalledTimes(2);
});
