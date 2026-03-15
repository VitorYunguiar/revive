import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReportsPage from './ReportsPage';

vi.mock('../contexts/DataContext', () => ({
  useData: () => ({
    vicios: [
      { id: '1', nome_vicio: 'Cigarro', dias_abstinencia: 10, valor_economizado: 120 },
      { id: '2', nome_vicio: 'Alcool', dias_abstinencia: 5, valor_economizado: 40 }
    ],
    metas: [{ id: 'm1', concluida: true }, { id: 'm2', concluida: false }],
    allRegistros: [
      { id: 'r1', data_registro: new Date().toISOString(), humor: 'bom' },
      { id: 'r2', data_registro: new Date().toISOString(), humor: 'excelente' }
    ],
    recaidas: [{ id: 're1', data_recaida: new Date().toISOString() }]
  })
}));

describe('ReportsPage', () => {
  it('renders summary cards from context data', () => {
    render(<ReportsPage />);

    expect(screen.getByText('Relatorios')).toBeInTheDocument();
    expect(screen.getByText('R$ 160')).toBeInTheDocument();
    expect(screen.getByText('Resumo por Vicio')).toBeInTheDocument();
    expect(screen.getByText('Cigarro')).toBeInTheDocument();
    expect(screen.getByText('Alcool')).toBeInTheDocument();
  });
});
