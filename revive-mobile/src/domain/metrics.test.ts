import { describe, expect, it } from '@jest/globals';
import { asNumber, completedGoals, maxStreak, moodDistribution, totalSavings } from './metrics';
import type { BootstrapData } from './types';

describe('mobile metric parity helpers', () => {
  it('normalizes numeric database values', () => {
    expect(asNumber('12.50')).toBe(12.5);
    expect(asNumber('invalid')).toBe(0);
  });

  it('summarizes addictions and goals', () => {
    const addictions = [
      { id: '1', usuario_id: 'u', nome_vicio: 'A', data_inicio: '2026-01-01', dias_abstinencia: 4, valor_economizado: '10.50' },
      { id: '2', usuario_id: 'u', nome_vicio: 'B', data_inicio: '2026-01-01', dias_abstinencia: 9, valor_economizado: 20 },
    ];
    expect(maxStreak(addictions)).toBe(9);
    expect(totalSavings(addictions)).toBe(30.5);
    expect(completedGoals([
      { id: '1', usuario_id: 'u', descricao_meta: 'A', concluida: true },
      { id: '2', usuario_id: 'u', descricao_meta: 'B', concluida: false },
    ])).toBe(1);
  });

  it('groups moods in descending frequency', () => {
    const data = {
      registros: [{ id: '1', vicio_id: 'v', data_registro: '2026-01-01', humor: 'Bem' }, { id: '2', vicio_id: 'v', data_registro: '2026-01-02', humor: 'Bem' }, { id: '3', vicio_id: 'v', data_registro: '2026-01-03', humor: 'Ansioso' }],
    } as BootstrapData;
    expect(moodDistribution(data)).toEqual([['Bem', 2], ['Ansioso', 1]]);
  });
});
