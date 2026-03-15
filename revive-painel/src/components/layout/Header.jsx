/**
 * @file Header.jsx
 * @description Cabecalho principal da aplicacao com logo, informacoes do usuario e acoes.
 *
 * Implementa um header sticky que se oculta automaticamente ao rolar a pagina
 * (auto-hide apos 120px de scroll). Contém:
 * - Logo e titulo "Revive" com subtitulo "Painel de Progresso"
 * - Botao de alternancia de tema (claro/escuro)
 * - Exibicao do nome/email do usuario autenticado
 * - Botao de logout
 *
 * Utiliza Framer Motion para animacoes de entrada e micro-interacoes nos botoes.
 * O comportamento de auto-hide e implementado via scroll listener com flag passive
 * para performance otimizada.
 *
 * @component
 * @see {@link AppShell} Componente pai que inclui o Header no layout
 * @see {@link AuthContext} Contexto que fornece dados do usuario e funcao de logout
 * @see {@link UIContext} Contexto que fornece tema e funcao de alternancia
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { glassSurface, navButtonMotion } from '../../utils/constants';

/**
 * Renderiza o cabecalho da aplicacao com auto-hide ao rolar.
 *
 * O header utiliza position sticky com z-index 40 e se esconde via
 * translate-y negativo quando o scroll ultrapassa 120px. Os botoes
 * possuem animacoes Framer Motion para feedback visual ao interagir.
 *
 * @returns {JSX.Element} Header animado com logo, controles de tema e sessao
 */
const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useUI();
  /** @type {[boolean, Function]} Controla ocultacao do header baseado na posicao de scroll */
  const [hideHeader, setHideHeader] = useState(false);

  /**
   * Listener de scroll com passive: true para nao bloquear a thread principal.
   * Oculta o header quando o scroll vertical ultrapassa 120px.
   */
  useEffect(() => {
    const handleScroll = () => {
      setHideHeader(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`sticky top-0 z-40 transition-transform duration-300 ${hideHeader ? '-translate-y-full' : 'translate-y-0'}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className={`${glassSurface} rounded-2xl border border-slate-700/60 px-4 sm:px-6 py-3 flex items-center justify-between gap-4`}>
          <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white border border-slate-700/60">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">Painel de Progresso</p>
              <h1 className="text-2xl font-semibold text-white tracking-tight">Revive</h1>
            </div>
          </motion.div>
          <div className="flex items-center gap-3">
            <motion.button
              {...navButtonMotion}
              onClick={toggleTheme}
              className="p-2 text-white/70 rounded-xl transition border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800"
              title="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white/70">
              <User className="w-4 h-4" />
              <span className="text-sm font-semibold">{user?.nome || user?.email}</span>
            </div>
            <motion.button
              {...navButtonMotion}
              onClick={logout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-white/80 rounded-xl transition border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:block text-sm font-semibold">Sair</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
