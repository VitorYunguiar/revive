/**
 * @file ProfilePage.jsx
 * @description Pagina de perfil do usuario da aplicacao REVIVE.
 *
 * Exibe informacoes do usuario (nome, email), resumo estatistico
 * (vicios ativos, metas concluidas, registros), preferencias (tema claro/escuro),
 * acoes de dados (exportar JSON) e botao de logout.
 *
 * Utiliza tres contextos React: AuthContext (autenticacao), UIContext (tema)
 * e DataContext (dados do usuario).
 *
 * @component
 * @see {@link useAuth} Hook de autenticacao (usuario, logout)
 * @see {@link useUI} Hook de interface (tema, toggle)
 * @see {@link useData} Hook de dados (vicios, metas, registros, recaidas)
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Sun, Moon, Download, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';
import { glassSurface, screenTransition } from '../utils/constants';

/**
 * Componente da pagina de Perfil.
 *
 * Funcionalidade principal: exportacao completa dos dados do usuario em JSON
 * e alternancia de tema (claro/escuro) via toggle switch.
 * A exportacao cria um Blob JSON e dispara download automatico.
 *
 * @returns {JSX.Element} Pagina de perfil com info do usuario, estatisticas, preferencias e acoes
 */
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useUI();
  const { addictions, goals, allRecords, relapses } = useData();

  /**
   * Exporta todos os dados do usuario como arquivo JSON.
   * Inclui vicios, metas, registros, recaidas e timestamp de exportacao.
   * Cria Blob com JSON formatado (2 espacos) e dispara download via <a> programatico.
   */
  const exportData = () => {
    const data = { addictions, goals, registros: allRecords, relapses, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revive-dados-exportados.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div {...screenTransition} className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-white">Perfil</h2>

      {/* User Info */}
      <div className={`${glassSurface} rounded-3xl p-6`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#7CF6C4]/20 flex items-center justify-center">
            <User className="w-8 h-8 text-[#7CF6C4]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{user?.nome || 'Usuario'}</h3>
            <p className="text-white/50">{user?.email}</p>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-2xl font-bold text-[#7CF6C4]">{addictions.length}</p>
            <p className="text-xs text-white/50">Vicios Ativos</p>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-2xl font-bold text-[#35D3FF]">{goals.filter(m => m.concluida).length}</p>
            <p className="text-xs text-white/50">Metas Concluidas</p>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-2xl font-bold text-amber-400">{allRecords.length}</p>
            <p className="text-xs text-white/50">Registros</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className={`${glassSurface} rounded-3xl p-6`}>
        <h3 className="text-lg font-semibold text-white mb-4">Preferencias</h3>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 mb-3">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
            <div>
              <p className="font-medium text-white">Tema</p>
              <p className="text-xs text-white/50">{theme === 'dark' ? 'Escuro' : 'Claro'}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full transition relative ${theme === 'dark' ? 'bg-purple-500/40' : 'bg-amber-500/40'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${theme === 'dark' ? 'translate-x-0.5' : 'translate-x-6'}`} />
          </button>
        </div>
      </div>

      {/* Data Actions */}
      <div className={`${glassSurface} rounded-3xl p-6`}>
        <h3 className="text-lg font-semibold text-white mb-4">Dados</h3>

        <button
          onClick={exportData}
          className="w-full flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition mb-3"
        >
          <Download className="w-5 h-5 text-[#7CF6C4]" />
          <div className="text-left">
            <p className="font-medium text-white">Exportar Dados</p>
            <p className="text-xs text-white/50">Baixar todos os dados em JSON</p>
          </div>
        </button>

        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="font-medium text-white">Seguranca</p>
              <p className="text-xs text-white/50">Para alterar senha ou excluir conta, entre em contato com o suporte.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-rose-500/15 text-rose-200 border border-rose-300/30 hover:bg-rose-500/25 transition font-semibold"
      >
        <LogOut className="w-5 h-5" />
        Sair da Conta
      </button>
    </motion.div>
  );
}
