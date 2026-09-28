import { describe, expect, it } from '@jest/globals';
import { URGE_TRIGGER_CATALOG, urgeTriggerLabel } from './urge-triggers';

describe('urge trigger codes', () => {
  it('keeps stable machine codes separate from Portuguese labels', () => {
    expect(URGE_TRIGGER_CATALOG).toEqual([
      { code: 'estresse', label: 'Estresse' },
      { code: 'tedio', label: 'Tédio' },
      { code: 'situacao_social', label: 'Situação social' },
      { code: 'rotina', label: 'Rotina' },
      { code: 'outro', label: 'Outro' },
    ]);
  });

  it('retains an unknown future code instead of discarding its meaning', () => {
    expect(urgeTriggerLabel('trigger_future_1')).toBe('Outro (trigger_future_1)');
  });
});
