import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import NavBar from './NavBar';
import ConfirmModal from '../ui/ConfirmModal';
import ToastContainer from '../ui/Toast';
import ErrorBoundary from '../ui/ErrorBoundary';
import Alert from '../ui/Alert';
import { useUI } from '../../contexts/UIContext';

const AppShell = () => {
  const { confirmModal, alert, setAlert } = useUI();

  return (
    <div className="min-h-screen text-white relative">
      <ConfirmModal {...confirmModal} />
      <ToastContainer />
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
