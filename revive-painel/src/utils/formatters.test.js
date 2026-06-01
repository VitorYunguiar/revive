import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calcularTempoDecorrido } from './formatters';

describe('calcularTempoDecorrido', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-08T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a fallback message when no start date exists', () => {
    expect(calcularTempoDecorrido(null)).toBe('Sem data de inicio');
  });

  it('describes same-day starts as started today', () => {
    expect(calcularTempoDecorrido('2026-04-08T08:30:00Z')).toBe('Iniciado hoje');
  });

  it('formats short periods in days', () => {
    expect(calcularTempoDecorrido('2026-04-06T12:00:00Z')).toBe('Iniciado ha 2 dias');
  });

  it('formats medium periods in months', () => {
    expect(calcularTempoDecorrido('2026-02-07T12:00:00Z')).toBe('Iniciado ha 2 meses');
  });

  it('formats long periods in years', () => {
    expect(calcularTempoDecorrido('2024-02-28T12:00:00Z')).toBe('Iniciado ha 2 anos');
  });
});
