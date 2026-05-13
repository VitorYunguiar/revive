import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataProvider, useData } from './DataContext';

const {
  mockAuthState,
  mockShowToast,
  mockSetLoading,
  mockShowConfirm,
  mockListarVicios
} = vi.hoisted(() => ({
  mockAuthState: {
    token: 'test-token',
    user: { id: 'user-1' }
  },
  mockShowToast: vi.fn(),
  mockSetLoading: vi.fn(),
  mockShowConfirm: vi.fn(),
  mockListarVicios: vi.fn()
}));

vi.mock('./AuthContext', () => ({
  useAuth: () => mockAuthState
}));

vi.mock('./UIContext', () => ({
  useUI: () => ({
    showToast: mockShowToast,
    setLoading: mockSetLoading,
    showConfirm: mockShowConfirm
  })
}));

vi.mock('../services/vicios.service', () => ({
  listarVicios: mockListarVicios,
  buscarVicio: vi.fn(),
  criarVicio: vi.fn(),
  excluirVicio: vi.fn(),
  registrarRecaida: vi.fn()
}));

vi.mock('../services/metas.service', () => ({
  listarMetas: vi.fn().mockResolvedValue({ metas: [] }),
  criarMeta: vi.fn(),
  completarMeta: vi.fn(),
  excluirMeta: vi.fn()
}));

vi.mock('../services/recaidas.service', () => ({
  listarRecaidas: vi.fn().mockResolvedValue({ recaidas: [] })
}));

vi.mock('../services/mensagens.service', () => ({
  getMensagemDiaria: vi.fn().mockResolvedValue({ mensagem: { mensagem: 'Siga firme' } })
}));

vi.mock('../services/registros.service', () => ({
  listarRegistros: vi.fn().mockResolvedValue({ registros: [] }),
  criarRegistro: vi.fn()
}));

function Dummy() {
  const { addictions } = useData();
  return (
    <div>
      <span>Data provider mounted</span>
      <span data-testid="addictions">{addictions.map(addiction => addiction.nome_vicio).join(',')}</span>
    </div>
  );
}

describe('DataContext error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.token = 'test-token';
    mockAuthState.user = { id: 'user-1' };
    mockListarVicios.mockRejectedValue(new Error('erro de teste'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows toast when addictions loading fails', async () => {
    render(
      <DataProvider>
        <Dummy />
      </DataProvider>
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Nao foi possivel carregar seus vicios.');
    });
  });

  it('clears user data immediately when the authenticated user changes', async () => {
    mockListarVicios
      .mockResolvedValueOnce({
        vicios: [{
          id: 'vicio-1',
          nome_vicio: 'Cigarro',
          data_inicio: new Date().toISOString(),
          valor_economizado_por_dia: 0
        }]
      })
      .mockReturnValueOnce(new Promise(() => {}));

    const { rerender, getByTestId } = render(
      <DataProvider>
        <Dummy />
      </DataProvider>
    );

    await waitFor(() => {
      expect(getByTestId('addictions')).toHaveTextContent('Cigarro');
    });

    mockAuthState.token = 'second-token';
    mockAuthState.user = { id: 'user-2' };

    rerender(
      <DataProvider>
        <Dummy />
      </DataProvider>
    );

    await waitFor(() => {
      expect(getByTestId('addictions')).toHaveTextContent('');
    });
  });
});
