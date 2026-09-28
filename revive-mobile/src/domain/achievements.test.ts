import { describe, expect, it } from '@jest/globals';
import { achievementProgress } from './achievements';
import { accountAccumulatedSavings, accountCurrentStreak, accountRecordHolder, distinctCheckinDays } from './metrics';
import type { Addiction, BootstrapData, ProgressSnapshot } from './types';

const progress = (current: number | null, record: number | null, coverage: ProgressSnapshot['recorde_cobertura'] = 'confirmed'): ProgressSnapshot => ({
  sequencia_atual_dias: current,
  sequencia_atual_cobertura: current == null ? 'unknown' : 'confirmed',
  recorde_dias: record,
  recorde_cobertura: coverage,
  dias_checkin: 0,
  economia_sequencia: { valor_estimado: coverage === 'unknown' ? null : 20, cobertura: coverage === 'unknown' ? 'unknown' : 'confirmed' },
  economia_acumulada: { valor_estimado: coverage === 'unknown' ? null : 200, cobertura: coverage },
  marcos: [],
});

const habit = (id: string, name: string, current: number | null, record: number | null, coverage?: ProgressSnapshot['recorde_cobertura']): Addiction => ({
  id, usuario_id: 'u', nome_vicio: name, data_inicio: '2026-01-01', progresso: progress(current, record, coverage),
});

const snapshot = (vicios: Addiction[], overrides: Partial<BootstrapData> = {}): BootstrapData => ({
  server_time: '2026-02-01T12:00:00.000Z',
  usuario: { id: 'u', nome: 'Teste', email: 'test@example.invalid' },
  vicios, registros: [], recaidas: [], metas: [], mensagem: null, conquistas: [], ...overrides,
});

describe('permanent achievement progress', () => {
  it('keeps a 30-day permanent award after reset and reports active and record streaks separately', () => {
    const first = habit('a', 'Hábito A', 2, 30);
    const second = habit('b', 'Hábito B', 4, 20);
    const data = snapshot([first, second], { conquistas: [{
      id: 'award-30', vicio_id: null, categoria: 'streak', valor_alvo: 30,
      awarded_at: '2026-01-30T12:00:00.000Z', origem: 'period_threshold', cobertura: 'confirmed',
    }] });
    const badges = achievementProgress(data);

    expect(badges.find((badge) => badge.id === 'streak-30')).toMatchObject({ earned: true, current: 4 });
    expect(accountCurrentStreak(data.vicios)?.id).toBe('b');
    expect(accountRecordHolder(data.vicios)?.id).toBe('a');
    expect(accountAccumulatedSavings(data.vicios)).toEqual({ value: 400, coverage: 'confirmed' });
  });

  it('leaves incomplete legacy history unavailable instead of inventing a record or a saved badge', () => {
    const data = snapshot([habit('legacy', 'Hábito legado', null, null, 'unknown')], { conquistas: [] });
    const badges = achievementProgress(data);

    expect(accountRecordHolder(data.vicios)).toBeNull();
    expect(accountAccumulatedSavings(data.vicios)).toEqual({ value: null, coverage: 'unknown' });
    expect(badges.find((badge) => badge.id === 'streak-30')).toMatchObject({ earned: false, current: null, unavailable: true });
  });

  it('keeps old snapshots readable but does not infer permanent awards from their current counter', () => {
    const legacy = snapshot([{ id: 'old', usuario_id: 'u', nome_vicio: 'Antigo', data_inicio: '2026-01-01', dias_abstinencia: 365 }], {
      conquistas: undefined,
    });
    const badges = achievementProgress(legacy);

    expect(accountRecordHolder(legacy.vicios)).toBeNull();
    expect(badges.find((badge) => badge.id === 'streak-365')).toMatchObject({ earned: false, current: null, legacyHistory: true });
  });

  it('counts unique check-in dates and gives an empty account no invented progress', () => {
    const records = [
      { id: '1', vicio_id: 'a', data_registro: '2026-01-01' },
      { id: '2', vicio_id: 'b', data_registro: '2026-01-01' },
      { id: '3', vicio_id: 'a', data_registro: '2026-01-02' },
    ];
    expect(distinctCheckinDays(records)).toBe(2);
    const badges = achievementProgress(snapshot([]));
    expect(badges.find((badge) => badge.id === 'streak-1')).toMatchObject({ current: null, unavailable: true, earned: false });
    expect(badges.find((badge) => badge.id === 'consistency-7')).toMatchObject({ current: 0, earned: false });
  });
});
