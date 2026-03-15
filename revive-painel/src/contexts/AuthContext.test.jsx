import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const { mockShowToast, mockAuthService } = vi.hoisted(() => ({
  mockShowToast: vi.fn(),
  mockAuthService: {
    login: vi.fn(),
    cadastro: vi.fn(),
    verificarToken: vi.fn()
  }
}));

vi.mock('./UIContext', () => ({
  useUI: () => ({
    showAlert: vi.fn(),
    showToast: mockShowToast
  })
}));

vi.mock('../services/auth.service', () => mockAuthService);

function AuthConsumer() {
  const { login, token, user } = useAuth();

  return (
    <div>
      <button onClick={() => login('teste@revive.app', 'Senha@123')}>Login</button>
      <span data-testid="token">{token}</span>
      <span data-testid="user">{user?.email || ''}</span>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockAuthService.verificarToken.mockResolvedValue({});
  });

  it('stores token and user after login', async () => {
    mockAuthService.login.mockResolvedValue({
      token: 'fake-token',
      usuario: { email: 'teste@revive.app' }
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('fake-token');
      expect(screen.getByTestId('user')).toHaveTextContent('teste@revive.app');
    });

    expect(localStorage.getItem('revive_token')).toBe('fake-token');
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Login realizado com sucesso!');
  });
});
