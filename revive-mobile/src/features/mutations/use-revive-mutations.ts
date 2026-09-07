import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { queryClient } from '@/core/query/client';
import { ApiError } from '@/core/api/errors';
import { reviveApi } from '@/core/api/repositories';
import { enqueueMutation, getCachedBootstrap, getPendingMutations } from '@/core/storage/database';
import { withPendingMutations } from '@/domain/pending-snapshot';
import { useSession } from '@/features/auth/session-context';
import { bootstrapKey } from '@/features/bootstrap/use-bootstrap';
import type { CreateGoalInput, CreateRecordInput, CreateRelapseInput } from '@/domain/types';

const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const localDate = () => new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

export function useReviveMutations() {
  const { user } = useSession();
  const invalidate = () => user && queryClient.invalidateQueries({ queryKey: bootstrapKey(user.id) });

  const applyPendingMutation = async () => {
    if (!user) return;
    const key = bootstrapKey(user.id);
    const current = await getCachedBootstrap(user.id)
      || queryClient.getQueryData<import('@/domain/types').BootstrapData>(key);
    if (!current) return;
    queryClient.setQueryData(key, withPendingMutations(current, await getPendingMutations(user.id)));
  };

  const executeOrQueue = async (
    type: 'record.create' | 'relapse.create' | 'goal.create' | 'goal.complete',
    payload: Record<string, unknown>,
    execute: (idempotencyKey: string) => Promise<unknown>,
  ) => {
    if (!user) throw new Error('Sessão ausente.');
    const idempotencyKey = Crypto.randomUUID();
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await enqueueMutation(user.id, type, payload, undefined, idempotencyKey);
      await applyPendingMutation();
      return 'queued' as const;
    }
    try {
      await execute(idempotencyKey);
      await invalidate();
      return 'synced' as const;
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        await enqueueMutation(user.id, type, payload, undefined, idempotencyKey);
        await applyPendingMutation();
        return 'queued' as const;
      }
      throw error;
    }
  };

  return {
    createRecord: (input: CreateRecordInput) => {
      const payload = { ...input, data_registro: input.data_registro || localDate(), timezone: input.timezone || timezone() };
      return executeOrQueue('record.create', payload, (key) => reviveApi.createRecord(payload, key));
    },
    createRelapse: (addictionId: string, input: CreateRelapseInput) => {
      const payload = { addictionId, ...input, occurred_at: input.occurred_at || new Date().toISOString(), timezone: input.timezone || timezone() };
      const { addictionId: routeId, ...body } = payload;
      return executeOrQueue('relapse.create', payload, (key) => reviveApi.createRelapse(routeId, body, key));
    },
    createGoal: (input: CreateGoalInput) => executeOrQueue('goal.create', input, (key) => reviveApi.createGoal(input, key)),
    completeGoal: (goalId: string) => executeOrQueue('goal.complete', { goalId }, (key) => reviveApi.completeGoal(goalId, key)),
  };
}
