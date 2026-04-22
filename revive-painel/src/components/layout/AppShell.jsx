/**
 * @file AppShell.jsx
 * @description Shell principal da aplicacao que define a estrutura de layout.
 *
 * Implementa o padrao Composition Pattern do React, compondo os elementos
 * estruturais da aplicacao: Header, NavBar, area de conteudo e camadas de UI
 * globais (modais, toasts, alertas, error boundary).
 *
 * Hierarquia de composicao:
 * - ConfirmModal (overlay global de confirmacao)
 * - ToastContainer (notificacoes toast empilhadas)
 * - Header (cabecalho com logo, usuario e acoes)
 * - Alert (alerta contextual dismissavel)
 * - NavBar (navegacao horizontal com abas)
 * - ErrorBoundary (captura erros de renderizacao dos filhos)
 * - Outlet (conteudo da rota ativa via React Router)
 *
 * O conteudo das rotas e injetado via React Router <Outlet />,
 * permitindo que todas as paginas compartilhem o mesmo layout.
 *
 * Design Pattern: Composition Pattern (composicao de layout)
 *
 * @component
 * @see {@link Header} Cabecalho da aplicacao
 * @see {@link NavBar} Barra de navegacao
 * @see {@link ProtectedRoute} Wrapper de autenticacao que envolve o AppShell
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import NavBar from './NavBar';
import ConfirmModal from '../ui/ConfirmModal';
import ToastContainer from '../ui/Toast';
import ErrorBoundary from '../ui/ErrorBoundary';
import Alert from '../ui/Alert';
import NovoVicioWizard from '../modals/NovoVicioWizard';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';

/**
 * Layout principal que envolve todas as paginas autenticadas da aplicacao.
 *
 * Consome o UIContext para obter o estado do modal de confirmacao e alertas.
 * A area de conteudo utiliza max-w-7xl para limitar a largura em telas grandes
 * e padding responsivo (px-4 em mobile, px-8 em desktop).
 *
 * @returns {JSX.Element} Estrutura de layout com Header, NavBar, Outlet e camadas de UI
 */
const AppShell = () => {
  const {
    confirmModal,
    alert,
    setAlert,
    loading,
    isNewAddictionOpen,
    closeNewAddictionWizard
  } = useUI();
  const { createAddiction } = useData();

  return (
    <div className="min-h-screen text-app relative">
      <ConfirmModal {...confirmModal} />
      <ToastContainer />
      <NovoVicioWizard
        isOpen={isNewAddictionOpen}
        onClose={closeNewAddictionWizard}
        onSubmit={async (payload) => {
          await createAddiction(payload);
          closeNewAddictionWizard();
        }}
        loading={loading}
      />
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.message}</Alert>}
        <NavBar />
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default AppShell;
