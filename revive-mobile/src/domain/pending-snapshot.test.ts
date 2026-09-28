import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { withPendingMutations } from './pending-snapshot';
import type { BootstrapData, ProgressSnapshot, QueuedMutation } from './types';

const snapshot: BootstrapData = { usuario: { id: 'u', nome: 'Teste', email: 'test@example.com' }, server_time: '', vicios: [], registros: [], recaidas: [], metas: [], mensagem: null };
const event: QueuedMutation = { id: 'event-1', userId: 'u', type: 'record.create', payload: { vicio_id: 'v', humor: 'Bem', data_registro: '2026-09-05' }, occurredAt: '', attempts: 0, nextRetryAt: '', status: 'pending' };
const pendingRelapse: QueuedMutation = {
  ...event,
  id: 'relapse-1',
  type: 'relapse.create',
  payload: { addictionId: 'habit', occurred_at: '2026-01-30T12:00:00.000Z', resetarContador: true },
};
const knownProgress: ProgressSnapshot = {
  sequencia_atual_dias: 30, sequencia_atual_cobertura: 'confirmed', recorde_dias: 30, recorde_cobertura: 'confirmed',
  dias_checkin: 4, economia_sequencia: { valor_estimado: 300, cobertura: 'confirmed' },
  economia_acumulada: { valor_estimado: 500, cobertura: 'confirmed' },
  marcos: [{ id: 'award-30', categoria: 'streak', valor_alvo: 30, awarded_at: '2026-01-31T12:00:00.000Z', origem: 'period_threshold', cobertura: 'confirmed' }],
};

afterEach(() => { jest.useRealTimers(); });

describe('pending snapshot', () => {
  it('keeps unsent records visible across a new server snapshot without modifying the source', () => {
    const projected = withPendingMutations(snapshot, [event]);
    expect(projected.registros[0]).toMatchObject({ id: event.id, pending: true, humor: 'Bem' });
    expect(snapshot.registros).toHaveLength(0);
    expect(withPendingMutations(projected, [event]).registros).toHaveLength(1);
  });
  it('never projects events from another account', () => {
    expect(withPendingMutations(snapshot, [{ ...event, userId: 'other' }]).registros).toHaveLength(0);
  });

  it('projects a queued reset locally while preserving the server record and permanent milestone', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-01T12:00:00.000Z'));
    const source = {
      ...snapshot,
      conquistas: [{ id: 'account-award', vicio_id: null, categoria: 'streak' as const, valor_alvo: 30, awarded_at: '2026-01-31T12:00:00.000Z', origem: 'period_threshold' as const, cobertura: 'confirmed' as const }],
      vicios: [{ id: 'habit', usuario_id: 'u', nome_vicio: 'Hábito', data_inicio: '2025-12-01', data_ultima_recaida: null, valor_economizado_por_dia: 10, dias_abstinencia: 30, progresso: knownProgress }],
    } as BootstrapData;
    const projected = withPendingMutations(source, [pendingRelapse]);
    const habit = projected.vicios[0];
    if (!habit) throw new Error('Test habit is missing');

    expect(habit.progresso).toMatchObject({
      sequencia_atual_dias: 2,
      recorde_dias: 30,
      pendente: true,
      economia_sequencia: { valor_estimado: 20 },
      economia_acumulada: { valor_estimado: 500 },
    });
    expect(habit.progresso?.marcos).toEqual(knownProgress.marcos);
    expect(projected.conquistas).toEqual(source.conquistas);
    expect(source.vicios[0]?.progresso).toEqual(knownProgress);
  });

  it('does not turn a queued reflection into a reset or invent a record from an older snapshot', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-01T12:00:00.000Z'));
    const legacy = {
      ...snapshot,
      vicios: [{ id: 'habit', usuario_id: 'u', nome_vicio: 'Hábito antigo', data_inicio: '2025-12-01', dias_abstinencia: 30 }],
    } as BootstrapData;
    const reflection = { ...pendingRelapse, id: 'reflection', payload: { ...pendingRelapse.payload, resetarContador: false } };
    const projected = withPendingMutations(legacy, [reflection]);
    const projectedHabit = projected.vicios[0];

    expect(projectedHabit?.dias_abstinencia).toBe(30);
    expect(projectedHabit?.progresso).toMatchObject({ sequencia_atual_dias: 30, recorde_dias: null, recorde_cobertura: 'unknown', pendente: true });
    expect(projected.conquistas).toBeUndefined();
  });
});
