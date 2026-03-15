import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/auth.service';
import { useUI } from './UIContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('revive_token') || '');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { showAlert, showToast } = useUI();

  useEffect(() => {
    if (token) {
      verificarToken();
    } else {
      setAuthLoading(false);
    }
  }, []);

  const verificarToken = async () => {
    try {
      await authService.verificarToken(token);
      setUser({ email: 'Usuario Autenticado' });
    } catch {
      handleLogout(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = useCallback(async (email, senha) => {
    const data = await authService.login(email, senha);
    setToken(data.token);
    localStorage.setItem('revive_token', data.token);
    setUser(data.usuario);
    showToast('success', 'Login realizado com sucesso!');
    return data;
  }, [showToast]);

  const handleCadastro = useCallback(async (nome, email, senha) => {
    const data = await authService.cadastro(nome, email, senha);
    showToast('success', 'Cadastro realizado! Faca login para continuar.');
    return data;
  }, [showToast]);

  const handleLogout = useCallback((showMessage = true) => {
    localStorage.removeItem('revive_token');
    setToken('');
    setUser(null);
    if (showMessage) showToast('info', 'Logout realizado com sucesso');
  }, [showToast]);

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
