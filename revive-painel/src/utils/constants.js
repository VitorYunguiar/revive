// ====================================
// DESIGN TOKENS & CONSTANTS
// ====================================

// Glass Surface Classes
export const glassSurface = 'bg-slate-900/80 border border-slate-700/60 shadow-[0_20px_40px_rgba(2,6,23,0.4)]';
export const glassMutedSurface = 'bg-slate-900/60 border border-slate-700/40';

// Form Field Base
export const fieldBase = 'w-full px-4 py-3 rounded-2xl bg-slate-900/70 border border-slate-700/50 text-white placeholder-white/50 focus:border-[#5CC8FF] focus:ring-2 focus:ring-[#5CC8FF]/30 outline-none transition';

// Pill/Badge Base
export const pillBase = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border';

// Framer Motion Configs
export const navButtonMotion = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.98 }
};

export const cardMotion = {
  whileHover: { y: -6, boxShadow: '0 35px 80px rgba(15, 20, 40, 0.55)' },
  transition: { type: 'spring', stiffness: 260, damping: 25 }
};

export const accentButtonMotion = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.98 }
};

// Stagger animation for grids
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
};

// Page transition
export const screenTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

// Backward-compatible alias while migrating naming conventions.
export const pageTransition = screenTransition;

// KPI Border Map
export const kpiBorderMap = {
  emerald: 'border-slate-600/70',
  cyan: 'border-slate-600/70',
  yellow: 'border-slate-600/70',
  red: 'border-slate-600/70'
};

// Mood colors
export const moodColors = {
  excelente: '#10b981',
  bom: '#3b82f6',
  neutro: '#8b5cf6',
  ruim: '#f59e0b',
  'péssimo': '#ef4444'
};

// Mood options
export const moodOptions = [
  { value: 'excelente', label: 'Excelente', emoji: '😄' },
  { value: 'bom', label: 'Bom', emoji: '🙂' },
  { value: 'neutro', label: 'Neutro', emoji: '😐' },
  { value: 'ruim', label: 'Ruim', emoji: '😟' },
  { value: 'péssimo', label: 'Péssimo', emoji: '😢' }
];

// Badge definitions for achievements
export const badgeDefinitions = [
  // Streak badges
  { id: 'streak-1', category: 'streak', name: '1 Dia Limpo', description: 'Primeiro dia de abstinencia', icon: 'Flame', requirement: 1, color: '#7CF6C4' },
  { id: 'streak-7', category: 'streak', name: '1 Semana', description: '7 dias consecutivos', icon: 'Flame', requirement: 7, color: '#35D3FF' },
  { id: 'streak-30', category: 'streak', name: '1 Mes', description: '30 dias consecutivos', icon: 'Flame', requirement: 30, color: '#8b5cf6' },
  { id: 'streak-90', category: 'streak', name: '3 Meses', description: '90 dias consecutivos', icon: 'Flame', requirement: 90, color: '#f59e0b' },
  { id: 'streak-180', category: 'streak', name: '6 Meses', description: '180 dias consecutivos', icon: 'Flame', requirement: 180, color: '#ef4444' },
  { id: 'streak-365', category: 'streak', name: '1 Ano', description: '365 dias consecutivos', icon: 'Flame', requirement: 365, color: '#ec4899' },
  // Savings badges
  { id: 'savings-50', category: 'savings', name: 'R$50 Economizados', description: 'Primeiros R$50 economizados', icon: 'DollarSign', requirement: 50, color: '#7CF6C4' },
  { id: 'savings-100', category: 'savings', name: 'R$100 Economizados', description: 'R$100 no bolso', icon: 'DollarSign', requirement: 100, color: '#35D3FF' },
  { id: 'savings-500', category: 'savings', name: 'R$500 Economizados', description: 'Meio mil economizado', icon: 'DollarSign', requirement: 500, color: '#8b5cf6' },
  { id: 'savings-1000', category: 'savings', name: 'R$1.000 Economizados', description: 'Mil reais economizados', icon: 'DollarSign', requirement: 1000, color: '#f59e0b' },
  // Goal badges
  { id: 'goal-first', category: 'goals', name: 'Primeira Meta', description: 'Concluiu a primeira meta', icon: 'Target', requirement: 1, color: '#7CF6C4' },
  { id: 'goal-5', category: 'goals', name: '5 Metas', description: 'Concluiu 5 metas', icon: 'Target', requirement: 5, color: '#35D3FF' },
  { id: 'goal-10', category: 'goals', name: '10 Metas', description: 'Concluiu 10 metas', icon: 'Target', requirement: 10, color: '#8b5cf6' },
  // Consistency badges
  { id: 'log-7', category: 'consistency', name: '7 Registros', description: '7 registros diarios', icon: 'BookOpen', requirement: 7, color: '#7CF6C4' },
  { id: 'log-30', category: 'consistency', name: '30 Registros', description: '30 registros diarios', icon: 'BookOpen', requirement: 30, color: '#35D3FF' },
];
