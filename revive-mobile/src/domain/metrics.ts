import type { Addiction, BootstrapData, Goal } from './types';

export const asNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCurrency = (value: unknown) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asNumber(value));

export const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value));
};

export const maxStreak = (addictions: Addiction[]) => Math.max(0, ...addictions.map((item) => asNumber(item.dias_abstinencia)));
export const totalSavings = (addictions: Addiction[]) => addictions.reduce((sum, item) => sum + asNumber(item.valor_economizado), 0);
export const completedGoals = (goals: Goal[]) => goals.filter((goal) => Boolean(goal.concluida)).length;

export const moodDistribution = (data: BootstrapData) => {
  const result = new Map<string, number>();
  for (const record of data.registros) {
    const mood = record.humor?.trim() || 'Não informado';
    result.set(mood, (result.get(mood) || 0) + 1);
  }
  return [...result.entries()].sort((a, b) => b[1] - a[1]);
};
