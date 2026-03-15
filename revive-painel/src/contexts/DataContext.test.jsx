import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataProvider } from './DataContext';

const {
  mockShowToast,
  mockSetLoading,
  mockShowConfirm,
  mockListarVicios
} = vi.hoisted(() => ({
  mockShowToast: vi.fn(),
  mockSetLoading: vi.fn(),
  mockShowConfirm: vi.fn(),
  mockListarVicios: vi.fn()
}));

vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    token: 'test-token',
    user: { id: 'user-1' }
  })
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
  return <div>Data provider mounted</div>;
}

describe('DataContext error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
