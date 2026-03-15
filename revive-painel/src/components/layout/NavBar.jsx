import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, PieChart, Target, Plus, BarChart3, Calendar as CalendarIcon, Trophy, FileText, Lightbulb, User } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { glassSurface, navButtonMotion } from '../../utils/constants';

const navItems = [
  { path: '/', label: 'Jornada', icon: Heart },
  { path: '/analytics', label: 'Insights', icon: PieChart },
  { path: '/metas', label: 'Metas', icon: Target },
  { path: '/calendario', label: 'Calendario', icon: CalendarIcon },
  { path: '/conquistas', label: 'Conquistas', icon: Trophy },
  { path: '/relatorios', label: 'Relatorios', icon: FileText },
  { path: '/dicas', label: 'Dicas', icon: Lightbulb },
  { path: '/perfil', label: 'Perfil', icon: User },
];

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { vicioSelecionado } = useData();

  const allItems = [...navItems];
  if (vicioSelecionado) {
    allItems.splice(3, 0, {
      path: `/vicios/${vicioSelecionado.id}`,
      label: `Detalhes`,
      icon: BarChart3
    });
  }

  return (
    <div className={`${glassSurface} border border-slate-700/60 rounded-2xl p-2 mb-6 flex flex-wrap gap-2`}>
      {allItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <motion.button
            key={item.path}
            {...navButtonMotion}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
              isActive
                ? 'bg-[#1F2A3B] text-white border border-slate-600'
                : 'text-white/70 hover:text-white bg-slate-800/60 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </motion.button>
        );
      })}
      <motion.button
        {...navButtonMotion}
        onClick={() => navigate('/novo-vicio')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-[#7CF6C4] bg-[#7CF6C4]/10 hover:bg-[#7CF6C4]/20 border border-[#7CF6C4]/30 transition"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Novo</span>
      </motion.button>
    </div>
  );
};

export default NavBar;
