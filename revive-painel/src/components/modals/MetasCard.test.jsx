import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MetasCard from './MetasCard';

const renderMetasCard = (onAddMeta = vi.fn().mockResolvedValue()) => {
  render(
    <MetasCard
      metas={[]}
      vicios={[{
        id: 'vicio-1',
        nome_vicio: 'Cigarro',
        dias_abstinencia: 63,
        valor_economizado: '995'
      }]}
      onAddMeta={onAddMeta}
      onCompleteMeta={vi.fn()}
      onDeleteMeta={vi.fn()}
      loading={false}
    />
  );

  return onAddMeta;
};

describe('MetasCard', () => {
  it('submits new goals with a today baseline by default', async () => {
    const onAddMeta = renderMetasCard();

    fireEvent.click(screen.getByRole('button', { name: /nova meta/i }));
    fireEvent.click(screen.getByRole('button', { name: /selecione um hábito/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Cigarro' }));
    fireEvent.change(screen.getByPlaceholderText('Descrição da meta...'), {
      target: { value: '30 dias limpo' }
    });
    fireEvent.change(screen.getByPlaceholderText('Dias objetivo'), {
      target: { value: '30' }
    });
    fireEvent.click(screen.getByRole('button', { name: /adicionar meta/i }));

    await waitFor(() => expect(onAddMeta).toHaveBeenCalledTimes(1));
    expect(onAddMeta).toHaveBeenCalledWith(expect.objectContaining({
      vicio_id: 'vicio-1',
      descricao_meta: '30 dias limpo',
      dias_objetivo: '30',
      iniciar_hoje: true,
      dias_abstinencia_inicio: 63,
      valor_economizado_inicio: 995
    }));
  });
});
