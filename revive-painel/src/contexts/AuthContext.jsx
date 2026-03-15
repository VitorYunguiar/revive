/**
 * @file AuthContext.jsx - Contexto de autenticacao da aplicacao Revive.
 *
 * @description
 * Gerencia todo o fluxo de autenticacao do usuario utilizando o **Context API do React**.
 * Implementa login, cadastro, logout e verificacao automatica de token JWT.
 *
 * **Estado gerenciado:**
 * - `token` - Token JWT armazenado em localStorage para persistencia entre sessoes
 * - `user` - Dados do usuario autenticado (ou null se deslogado)
 * - `authLoading` - Flag booleana indicando se a verificacao inicial do token esta em andamento
 *
 * **Funcoes expostas via hook useAuth():**
 * - `login(email, senha)` - Autentica o usuario
 * - `cadastro(nome, email, senha)` - Registra novo usuario
 * - `logout()` - Encerra a sessao
 *
 * **Persistencia:** O token JWT e salvo no `localStorage` com a chave `revive_token`,
 * permitindo que o usuario permaneca logado entre recarregamentos de pagina.
 *
 * @module contexts/AuthContext
 * @see {@link module:contexts/UIContext} - Usado para exibir toasts de feedback
 * @see {@link module:services/auth.service} - Servico de chamadas de API de autenticacao
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/auth.service';
import { useUI } from './UIContext';

/**
 * Contexto React para autenticacao.
 * Inicializado como `null` — componentes consumidores devem estar dentro do {@link AuthProvider}.
 * @type {React.Context<Object|null>}
 */
const AuthContext = createContext(null);

/**
 * Componente Provider que encapsula a logica de autenticacao.
 * Deve envolver toda a arvore de componentes que precisam de acesso a dados de auth.
 *
 * **Inicializacao lazy do token:**
 * O `useState` recebe uma funcao (lazy initializer) que le o token do localStorage
 * apenas na primeira renderizacao, evitando leituras desnecessarias do storage.
 *
 * @param {Object} props - Props do componente
 * @param {React.ReactNode} props.children - Componentes filhos
 * @returns {JSX.Element} Provider de autenticacao
 */
export function AuthProvider({ children }) {
  /** @type {[string, Function]} Token JWT — inicializado do localStorage (lazy init) */
  const [token, setToken] = useState(() => localStorage.getItem('revive_token') || '');
  /** @type {[Object|null, Function]} Dados do usuario autenticado */
  const [user, setUser] = useState(null);
  /** @type {[boolean, Function]} Indica se a verificacao inicial do token esta em andamento */
  const [authLoading, setAuthLoading] = useState(true);
  const { showAlert, showToast } = useUI();

  /**
   * Efeito de montagem: verifica se o token salvo no localStorage ainda e valido.
   * Executado apenas uma vez (array de dependencias vazio = componentDidMount).
   * Se nao houver token, desliga o loading imediatamente.
   */
  useEffect(() => {
    if (token) {
      verificarToken();
    } else {
      setAuthLoading(false);
    }
  }, []);

  /**
   * Verifica a validade do token JWT junto a API.
   * Se valido, restaura a sessao do usuario; se invalido, faz logout silencioso.
   * @returns {Promise<void>}
   */
  const verificarToken = async () => {
    try {
      await authService.verificarToken(token);
      setUser({ email: 'Usuario Autenticado' });
    } catch {
      // Token expirado ou invalido — faz logout sem exibir mensagem
      handleLogout(false);
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Realiza o login do usuario.
   * Salva o token no estado React E no localStorage (dupla persistencia).
   *
   * @param {string} email - E-mail do usuario
   * @param {string} senha - Senha do usuario
   * @returns {Promise<Object>} Dados retornados pela API (token + dados do usuario)
   * @throws {Error} Se as credenciais forem invalidas (propagado para o chamador)
   */
  const handleLogin = useCallback(async (email, senha) => {
    const data = await authService.login(email, senha);
    setToken(data.token);
    localStorage.setItem('revive_token', data.token);
    setUser(data.usuario);
    showToast('success', 'Login realizado com sucesso!');
    return data;
  }, [showToast]);

  /**
   * Registra um novo usuario na plataforma.
   * Nao faz login automatico — o usuario precisa logar manualmente apos o cadastro.
   *
   * @param {string} nome - Nome completo do usuario
   * @param {string} email - E-mail do usuario
   * @param {string} senha - Senha escolhida
   * @returns {Promise<Object>} Dados de confirmacao do cadastro
   * @throws {Error} Se o cadastro falhar (ex: e-mail ja existente)
   */
  const handleCadastro = useCallback(async (nome, email, senha) => {
    const data = await authService.cadastro(nome, email, senha);
    showToast('success', 'Cadastro realizado! Faca login para continuar.');
    return data;
  }, [showToast]);

  /**
   * Encerra a sessao do usuario.
   * Remove o token do localStorage e limpa o estado React.
   *
   * @param {boolean} [showMessage=true] - Se true, exibe toast de confirmacao.
   *   Passado como false quando o logout e automatico (ex: token expirado).
   */
  const handleLogout = useCallback((showMessage = true) => {
    localStorage.removeItem('revive_token');
    setToken('');
    setUser(null);
    if (showMessage) showToast('info', 'Logout realizado com sucesso');
  }, [showToast]);

  /**
   * Provider value: expoe estado de autenticacao e funcoes para os consumidores.
   * Note que as funcoes internas sao renomeadas para uma API publica mais limpa:
   * handleLogin -> login, handleCadastro -> cadastro, handleLogout -> logout.
   */
  return (
    <AuthContext.Provider value={{
      token, user, authLoading,
      login: handleLogin,
      cadastro: handleCadastro,
      logout: handleLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook customizado para acessar o contexto de autenticacao.
 *
 * **Pattern: Custom Hook para Context API**
 * Encapsula `useContext(AuthContext)` e adiciona validacao de uso.
 * Lanca erro se o componente nao estiver dentro de um `<AuthProvider>`.
 *
 * @returns {Object} Objeto com: token, user, authLoading, login(), cadastro(), logout()
 * @throws {Error} Se chamado fora de um AuthProvider
 *
 * @example
 * function LoginForm() {
 *   const { login, token, user } = useAuth();
 *   // ...
 * }
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
