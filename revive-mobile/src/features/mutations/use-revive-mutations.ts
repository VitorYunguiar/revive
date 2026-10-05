import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { queryClient } from '@/core/query/client';
import { enqueueMutation, getCachedBootstrap, getPendingMutations } from '@/core/storage/database';
import { syncPendingMutations } from '@/core/sync/sync-engine';
import { withPendingMutations } from '@/domain/pending-snapshot';
import { useSession } from '@/features/auth/session-context';
import { bootstrapKey } from '@/features/bootstrap/use-bootstrap';
import type { CreateGoalInput, CreateRecordInput, CreateRelapseInput } from '@/domain/types';
import { localDateKey } from '@/domain/formats';
import { tokenStore } from '@/core/auth/token-store';

const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export type MutationReceipt = { id: string; status: 'queued' | 'synced' | 'failed' };

export function useReviveMutations() {
  const { user } = useSession();
  const invalidate = () => user && queryClient.invalidateQueries({ queryKey: bootstrapKey(user.id) });

  const applyPendingMutation = async (generation: number) => {
    if (!user || !tokenStore.isCurrent(generation)) return;
    const key = bootstrapKey(user.id);
    const current = await getCachedBootstrap(user.id)
      || queryClient.getQueryData<import('@/domain/types').BootstrapData>(key);
    if (!current || current.usuario.id !== user.id) return;
    const pending = await getPendingMutations(user.id);
    if (tokenStore.isCurrent(generation)) queryClient.setQueryData(key, withPendingMutations(current, pending));
  };

  const executeOrQueue = async (
    type: 'record.create' | 'relapse.create' | 'goal.create' | 'goal.complete',
    payload: Record<string, unknown>,
  ): Promise<MutationReceipt> => {
    if (!user) throw new Error('Sessão ausente.');
    const generation = tokenStore.getGeneration();
    const sessionUser = await tokenStore.getUser();
    if (sessionUser?.id !== user.id || !tokenStore.isCurrent(generation)) throw new Error('A sessão mudou. Abra o formulário novamente.');
    const idempotencyKey = Crypto.randomUUID();
    const occurredAt = type === 'relapse.create' && typeof payload.occurred_at === 'string'
      ? payload.occurred_at
      : new Date().toISOString();
    // The durable local intent always exists before either the direct request
    // or any network-dependent synchronization work begins.
    await enqueueMutation(user.id, type, payload, occurredAt, idempotencyKey);
    // Once SQLite commits, later failures must never invite a second creation.
    try {
      await applyPendingMutation(generation);
      const state = await NetInfo.fetch();
      if (!state.isConnected || !tokenStore.isCurrent(generation)) return { id: idempotencyKey, status: 'queued' };
      await syncPendingMutations(user.id);
      if (!tokenStore.isCurrent(generation)) return { id: idempotencyKey, status: 'queued' };
      await invalidate();
      const pending = (await getPendingMutations(user.id)).find(item => item.id === idempotencyKey);
      return { id: idempotencyKey, status: pending?.status === 'failed' ? 'failed' : pending ? 'queued' : 'synced' };
    } catch {
      return { id: idempotencyKey, status: 'queued' };
    }
  };

  const createRecordWithReceipt = (input: CreateRecordInput) => executeOrQueue('record.create', {
    ...input, data_registro: input.data_registro || localDateKey(), timezone: input.timezone || timezone(),
  });
  const legacyStatus = (receipt: MutationReceipt) => receipt.status === 'synced' ? 'synced' as const : 'queued' as const;

  return {
    createRecordWithReceipt,
    createRecord: (input: CreateRecordInput) => createRecordWithReceipt(input).then(legacyStatus),
    createRelapse: (addictionId: string, input: CreateRelapseInput) => {
      const payload = { addictionId, ...input, occurred_at: input.occurred_at || new Date().toISOString(), timezone: input.timezone || timezone() };
      return executeOrQueue('relapse.create', payload).then(legacyStatus);
    },
    createGoal: (input: CreateGoalInput) => executeOrQueue('goal.create', input).then(legacyStatus),
    completeGoal: (goalId: string) => executeOrQueue('goal.complete', { goalId, concluida: true }).then(legacyStatus),
  };
}
