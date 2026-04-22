/**
 * @file NavBar.jsx
 * @description Barra de navegacao horizontal com abas para todas as secoes da aplicacao.
 *
 * Renderiza uma barra de navegacao responsiva com botoes-aba para cada pagina
 * do sistema. O item ativo e destacado visualmente com fundo e borda diferenciados.
 * Em telas pequenas, os labels de texto sao ocultados, exibindo apenas os icones.
 *
 * Comportamento dinamico:
 * - Quando um vicio esta selecionado (vicioSelecionado do DataContext),
 *   um item "Detalhes" e inserido dinamicamente na posicao 4 da navegacao
 *   (apos "Metas"), apontando para a rota /vicios/:id.
 * - Um botao "Novo" (com destaque em verde) e sempre exibido ao final
 *   para abrir o fluxo de cadastro de novo vicio.
 *
 * Utiliza Framer Motion para micro-animacoes nos botoes e react-router
 * para navegacao programatica e deteccao da rota ativa.
 *
 * @component
 * @see {@link AppShell} Componente pai que inclui a NavBar no layout
 * @see {@link DataContext} Contexto que fornece o vicio selecionado
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Heart, PieChart, Target, Plus, BarChart3, Calendar as CalendarIcon, Trophy, FileText, Lightbulb, User } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';
import { glassSurface, navButtonMotion } from '../../utils/constants';

/**
 * Itens estaticos de navegacao com path, label e icone Lucide.
 * A ordem define a sequencia de exibicao na barra de navegacao.
 * @type {Array<{path: string, label: string, icon: React.ComponentType}>}
 */
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

/**
 * Renderiza a barra de navegacao horizontal com abas e botao de novo vicio.
 *
 * Constroi a lista de itens a partir do array estatico navItems e,
 * condicionalmente, insere o item "Detalhes" na posicao 4 quando ha
 * um vicio selecionado no DataContext (via splice no array clonado).
 *
 * @returns {JSX.Element} Barra de navegacao responsiva com estilizacao glassmorphism
 */
const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedAddiction: vicioSelecionado } = useData();
  const { openNewAddictionWizard } = useUI();

  // Clona navItems e insere dinamicamente o item "Detalhes" se houver vicio selecionado
  const allItems = [...navItems];
  if (vicioSelecionado) {
    allItems.splice(3, 0, {
      path: `/vicios/${vicioSelecionado.id}`,
      label: `Detalhes`,
      icon: BarChart3
    });
  }

  return (
    <div className={`${glassSurface} rounded-2xl p-2 mb-6 flex gap-2 overflow-x-auto`}>
      {allItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <Motion.button
            key={item.path}
            {...navButtonMotion}
            onClick={() => navigate(item.path)}
            title={item.label}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
              isActive
                ? 'bg-teal-400 text-slate-950 border border-teal-200 shadow-sm'
                : 'text-muted hover:text-app bg-transparent hover:bg-white/5 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Motion.button>
        );
      })}
      <Motion.button
        {...navButtonMotion}
        onClick={openNewAddictionWizard}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold text-teal-200 bg-teal-400/10 hover:bg-teal-400/16 border border-teal-300/25 transition whitespace-nowrap"
        title="Novo hábito"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Novo</span>
      </Motion.button>
    </div>
  );
};

export default NavBar;
