import { describe, expect, it } from 'vitest';
import { calculateGoalProgress, getLocalDateString, goalUsesTodayBaseline } from './goalProgress';

describe('goalProgress', () => {
  it('uses full addiction history when no baseline is enabled', () => {
    const progress = calculateGoalProgress(
      { dias_objetivo: 30 },
      { dias_abstinencia: 15 }
    );

    expect(progress).toBe(50);
  });

  it('starts day goals from zero when the today baseline is enabled', () => {
    const progress = calculateGoalProgress(
      { dias_objetivo: 30, iniciar_hoje: true, dias_abstinencia_inicio: 63 },
      { dias_abstinencia: 63 }
    );

    expect(progress).toBe(0);
  });

  it('counts only savings after the baseline for value goals', () => {
    const progress = calculateGoalProgress(
      { valor_objetivo: 300, iniciar_hoje: true, valor_economizado_inicio: 995 },
      { valor_economizado: 1145 }
    );

    expect(progress).toBe(50);
  });

  it('accepts boolean values returned as strings from the API', () => {
    expect(goalUsesTodayBaseline({ iniciar_hoje: 'true' })).toBe(true);
  });

  it('formats local dates as yyyy-mm-dd', () => {
    expect(getLocalDateString(new Date(2026, 5, 16))).toBe('2026-06-16');
  });
});
