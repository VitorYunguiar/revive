import NetInfo from '@react-native-community/netinfo';
import { reviveApi } from '@/core/api/repositories';
import { ApiError } from '@/core/api/errors';
import { tokenStore } from '@/core/auth/token-store';
import { cacheBootstrap, getPendingMutations } from '@/core/storage/database';
import { syncPendingMutations } from '@/core/sync/sync-engine';
import { withHabitOperationLock } from '@/core/sync/habit-operation-lock';
import { queryClient } from '@/core/query/client';
import { withPendingMutations } from '@/domain/pending-snapshot';
import type { BootstrapData, QueuedMutation, UpdateAddictionInput } from '@/domain/types';

export const habitHasPending = (habitId: string, pending: QueuedMutation[], data: BootstrapData) => pending.some(item =>
  item.payload.vicio_id === habitId || item.payload.addictionId === habitId
  || (item.type === 'goal.complete' && data.metas.some(goal => goal.id === item.payload.goalId && goal.vicio_id === habitId)),
);

export const updateHabit = async (userId: string, habitId: string, input: UpdateAddictionInput) => {
  const generation = tokenStore.getGeneration();
  const checkSession = async () => {
    if (!tokenStore.isCurrent(generation) || (await tokenStore.getUser())?.id !== userId) throw new Error('A sessão mudou. Abra o hábito novamente.');
  };
  return withHabitOperationLock(userId, async () => {
    await checkSession();
    const network = await NetInfo.fetch();
    if (!network.isConnected || network.isInternetReachable === false) throw new Error('Conecte-se para editar, arquivar ou reativar. A edição não foi salva.');
    await syncPendingMutations(userId);
    await checkSession();
    const fresh = await reviveApi.bootstrap();
    await checkSession();
    if (fresh.usuario.id !== userId) throw new Error('A sessão mudou. Abra o hábito novamente.');
    const pending = await getPendingMutations(userId);
    const reactivating = input.ativo === true && Object.keys(input).every(key => key === 'revision' || key === 'ativo')
      && fresh.vicios.find(habit => habit.id === habitId)?.ativo === false;
    if (!reactivating && habitHasPending(habitId, pending, fresh)) throw new Error('Há operações pendentes deste hábito. Resolva-as em Sincronização antes de editar ou arquivar. Nenhuma operação foi descartada.');
    if (fresh.vicios.find(habit => habit.id === habitId)?.revision !== input.revision) throw new ApiError('O hábito mudou. Recarregue os dados e revise sua edição.', 409, 'REVISAO_CONFLITO');
    await checkSession();
    await reviveApi.updateAddiction(habitId, input);
    await checkSession();
    const confirmed = await reviveApi.bootstrap();
    await checkSession();
    if (confirmed.usuario.id !== userId) throw new Error('A sessão mudou. Abra o hábito novamente.');
    await cacheBootstrap(userId, confirmed);
    await checkSession();
    const remaining = await getPendingMutations(userId);
    await checkSession();
    queryClient.setQueryData(['bootstrap', userId], withPendingMutations(confirmed, remaining));
    return confirmed.vicios.find(habit => habit.id === habitId);
  });
};
