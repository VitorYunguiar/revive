import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DetalhesPage from './pages/DetalhesPage';
import MetasPage from './pages/MetasPage';
import CalendarPage from './pages/CalendarPage';
import AchievementsPage from './pages/AchievementsPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import TipsPage from './pages/TipsPage';

export default function App() {
  const { token, user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60 text-lg animate-pulse">Carregando Revive...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        token && user ? <Navigate to="/" replace /> : <LoginPage />
      } />
      <Route path="/cadastro" element={
        token && user ? <Navigate to="/" replace /> : <LoginPage />
      } />

      {/* Protected routes inside AppShell */}
      <Route element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="metas" element={<MetasPage />} />
        <Route path="vicios/:id" element={<DetalhesPage />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="conquistas" element={<AchievementsPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="dicas" element={<TipsPage />} />
      </Route>

      {/* Catch all - redirect to dashboard or login */}
      <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
    </Routes>
  );
}
