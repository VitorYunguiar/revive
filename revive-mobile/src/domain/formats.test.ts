import { describe, test, expect } from '@jest/globals';
import { dateFromKey, displayDate, formatMoneyInput, localDateKey, maskDate, parseDate, parseMoney } from './formats';

describe('Datas brasileiras', () => {
  test('formata digitação parcial, colagem ISO e exclusão', () => {
    expect(['0', '08', '080', '08092026'].map(maskDate)).toEqual(['0', '08', '08/0', '08/09/2026']);
    expect(maskDate('2026-09-08')).toBe('08/09/2026');
    expect(maskDate('08/09/202')).toBe('08/09/202');
    expect(maskDate('')).toBe('');
  });
  test('valida dias reais e anos bissextos sem alterar o dia local', () => {
    expect(parseDate('29/02/2024')).toBe('2024-02-29');
    for (const invalid of ['29/02/2025', '31/04/2026', '00/09/2026', '08/13/2026', '08/09/26']) expect(parseDate(invalid)).toBeUndefined();
    expect(localDateKey(dateFromKey('2026-09-08'))).toBe('2026-09-08');
    expect(displayDate('2026-09-08')).toBe('08/09/2026');
  });
});

describe('Valores monetários', () => {
  test('aceita vírgula, ponto decimal e valores colados em reais', () => {
    expect(['12,50', '12.50', 'R$ 1.234,56', '1.234', '0'].map(parseMoney)).toEqual([12.5, 12.5, 1234.56, 1234, 0]);
    expect(formatMoneyInput('1234,5')).toBe('1.234,50');
    expect(formatMoneyInput('')).toBe('');
  });
  test('não converte entradas inválidas em economia válida', () => {
    for (const invalid of ['', '-1', 'abc', '1,234', '1,2,3', 'Infinity', '1000000000']) expect(parseMoney(invalid)).toBeUndefined();
  });
});
