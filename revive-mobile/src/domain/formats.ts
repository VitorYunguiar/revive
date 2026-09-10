/** Date-only values: never parse through UTC, which can change the selected day. */
export const localDateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function displayDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
}

export function maskDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return displayDate(value.trim());
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}

export function parseDate(value: string): string | undefined {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return undefined;
  const day = Number(match[1]), month = Number(match[2]), year = Number(match[3]);
  if (year < 1900 || year > 9999) return undefined;
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;
  return localDateKey(date);
}

export function dateFromKey(iso: string) {
  const [year = 2000, month = 1, day = 1] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function normalizeMoney(value: string) {
  const raw = value.replace(/R\$|\s/g, '');
  // Comma is the decimal separator; periods in a Brazilian pasted amount are groups.
  if (raw.includes(',')) return raw.replace(/\./g, '');
  if (/^-?\d{1,3}(\.\d{3})+$/.test(raw)) return raw.replace(/\./g, '');
  return raw.replace('.', ',');
}

export function parseMoney(value: string): number | undefined {
  const raw = normalizeMoney(value);
  if (!/^\d+(,\d{0,2})?$/.test(raw)) return undefined;
  const amount = Number(raw.replace(',', '.'));
  return Number.isFinite(amount) && amount <= 999999999.99 ? amount : undefined;
}

export function formatMoneyInput(value: string) {
  const amount = parseMoney(value);
  return amount === undefined ? value : amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
