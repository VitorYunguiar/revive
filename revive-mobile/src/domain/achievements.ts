import type { BootstrapData } from './types';
import { completedGoals, maxStreak, totalSavings } from './metrics';

// Thresholds match revive-painel/src/utils/constants.js.
const groups = [
  { category: 'streak', label: 'Dias consecutivos', thresholds: [1, 7, 30, 90, 180, 365] },
  { category: 'savings', label: 'Reais economizados', thresholds: [50, 100, 500, 1000] },
  { category: 'goals', label: 'Metas concluídas', thresholds: [1, 5, 10] },
  { category: 'consistency', label: 'Registros diários', thresholds: [7, 30] },
] as const;

export function achievementProgress(data: BootstrapData) {
  const values = {
    streak: maxStreak(data.vicios), savings: totalSavings(data.vicios),
    goals: completedGoals(data.metas), consistency: data.registros.length,
  };
  return groups.flatMap((group) => group.thresholds.map((target) => ({
    id: `${group.category}-${target}`, label: `${target} ${group.label.toLowerCase()}`,
    category: group.label, target, current: values[group.category],
    earned: values[group.category] >= target,
    percent: Math.min(100, Math.max(0, values[group.category] / target * 100)),
  })));
}
