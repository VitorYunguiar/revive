/**
 * @file AchievementsPage.jsx
 * @description Pagina de conquistas (achievements/badges) da aplicacao REVIVE.
 *
 * Exibe sistema de gamificacao com badges organizados por categoria
 * (streak, economia, metas, consistencia). Cada badge possui um requisito
 * numerico e mostra progresso visual (barra de progresso) ate ser desbloqueado.
 *
 * Utiliza useMemo para calcular quais badges foram conquistados e o progresso
 * de cada um. Animacoes escalonadas (stagger) com Framer Motion.
 *
 * @component
 * @see {@link badgeDefinitions} Definicoes estaticas dos badges no constants.js
 * @see {@link useData} Hook para acessar dados de vicios, metas e registros
 */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, DollarSign, Target, BookOpen, Lock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { glassSurface, screenTransition, badgeDefinitions, staggerContainer, staggerItem } from '../utils/constants';

/** @type {Object.<string, React.Component>} Mapa de nomes de icone para componentes Lucide */
const iconMap = { Flame, DollarSign, Target, BookOpen };

/**
 * Componente da pagina de Conquistas.
 *
 * Calcula dois conjuntos memorizados:
 * 1. earnedBadges: Set com IDs dos badges ja conquistados
 * 2. progress: Array com dados completos de cada badge incluindo % de progresso
 *
 * Renderiza badges agrupados por categoria com animacao stagger.
 *
 * @returns {JSX.Element} Pagina de conquistas com barra de progresso total e grid de badges
 */
export default function AchievementsPage() {
  const { addictions, goals, allRecords } = useData();

  /**
   * Determina quais badges foram conquistados comparando valores atuais
   * (maxStreak, totalSavings, completedGoals, totalLogs) com requisitos de cada badge.
   * Complexidade: O(n + b) onde n = vicios/metas/registros, b = numero de badges definidos.
   * @type {Set<string>} Conjunto de IDs dos badges conquistados
   */
  const earnedBadges = useMemo(() => {
    const earned = new Set();
    const maxStreak = addictions.reduce((max, v) => Math.max(max, v.dias_abstinencia || 0), 0);
    const totalSavings = addictions.reduce((acc, v) => acc + (Number(v.valor_economizado) || 0), 0);
    const completedGoals = goals.filter(m => m.concluida).length;
    const totalLogs = allRecords.length;

    badgeDefinitions.forEach(badge => {
      let value = 0;
      if (badge.category === 'streak') value = maxStreak;
      else if (badge.category === 'savings') value = totalSavings;
      else if (badge.category === 'goals') value = completedGoals;
      else if (badge.category === 'consistency') value = totalLogs;

      if (value >= badge.requirement) earned.add(badge.id);
    });

    return earned;
  }, [addictions, goals, allRecords]);

  /**
   * Calcula o progresso percentual de cada badge (0-100%).
   * Reutiliza os mesmos calculos de earnedBadges para determinar o valor atual.
   * Complexidade: O(n + b) onde n = dados e b = badges.
   * @type {Array<Object>} Array de badges com campos adicionais: earned, progress, current
   */
  const progress = useMemo(() => {
    const maxStreak = addictions.reduce((max, v) => Math.max(max, v.dias_abstinencia || 0), 0);
    const totalSavings = addictions.reduce((acc, v) => acc + (Number(v.valor_economizado) || 0), 0);
    const completedGoals = goals.filter(m => m.concluida).length;
    const totalLogs = allRecords.length;

    return badgeDefinitions.map(badge => {
      let value = 0;
      if (badge.category === 'streak') value = maxStreak;
      else if (badge.category === 'savings') value = totalSavings;
      else if (badge.category === 'goals') value = completedGoals;
      else if (badge.category === 'consistency') value = totalLogs;

      return {
        ...badge,
        earned: earnedBadges.has(badge.id),
        progress: Math.min((value / badge.requirement) * 100, 100),
        current: value
      };
    });
  }, [earnedBadges, addictions, goals, allRecords]);

  const categories = [
    { id: 'streak', label: 'Streak', icon: Flame },
    { id: 'savings', label: 'Economia', icon: DollarSign },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'consistency', label: 'Consistencia', icon: BookOpen },
  ];

  return (
    <motion.div {...screenTransition} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Conquistas</h2>
        <div className={`${glassSurface} rounded-2xl px-4 py-2 flex items-center gap-2`}>
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-lg font-bold text-white">{earnedBadges.size}</span>
          <span className="text-white/50 text-sm">/ {badgeDefinitions.length}</span>
        </div>
      </div>

      {/* Points Summary */}
      <div className={`${glassSurface} rounded-3xl p-6`}>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-white/50">Progresso Total</p>
            <p className="text-2xl font-bold text-white">{Math.round((earnedBadges.size / badgeDefinitions.length) * 100)}%</p>
          </div>
        </div>
        <div className="w-full bg-slate-700/40 rounded-full h-2 mt-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(earnedBadges.size / badgeDefinitions.length) * 100}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
          />
        </div>
      </div>

      {/* Badge Grid by Category */}
      {categories.map(cat => {
        const badges = progress.filter(b => b.category === cat.id);
        const CatIcon = cat.icon;
        return (
          <div key={cat.id}>
            <div className="flex items-center gap-2 mb-3">
              <CatIcon className="w-5 h-5 text-white/60" />
              <h3 className="text-lg font-semibold text-white">{cat.label}</h3>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {badges.map(badge => {
                const BadgeIcon = iconMap[badge.icon] || Flame;
                return (
                  <motion.div
                    key={badge.id}
                    variants={staggerItem}
                    className={`${glassSurface} rounded-2xl p-5 text-center relative overflow-hidden transition ${
                      badge.earned ? '' : 'opacity-50 grayscale'
                    }`}
                  >
                    {!badge.earned && (
                      <div className="absolute top-2 right-2">
                        <Lock className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                    <div
                      className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                      style={{ backgroundColor: `${badge.color}20` }}
                    >
                      <BadgeIcon className="w-6 h-6" style={{ color: badge.color }} />
                    </div>
                    <p className="font-semibold text-white text-sm mb-1">{badge.name}</p>
                    <p className="text-xs text-white/50 mb-3">{badge.description}</p>
                    {!badge.earned && (
                      <div className="w-full bg-slate-700/40 rounded-full h-1.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${badge.progress}%`, backgroundColor: badge.color }}
                        />
                      </div>
                    )}
                    {badge.earned && (
                      <span className="text-xs text-emerald-400 font-medium">Desbloqueado!</span>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        );
      })}
    </motion.div>
  );
}
