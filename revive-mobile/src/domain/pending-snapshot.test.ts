import { describe, expect, it } from '@jest/globals';
import { withPendingMutations } from './pending-snapshot';
import type { BootstrapData, QueuedMutation } from './types';

const snapshot: BootstrapData = { usuario: { id: 'u', nome: 'Teste', email: 'test@example.com' }, server_time: '', vicios: [], registros: [], recaidas: [], metas: [], mensagem: null };
const event: QueuedMutation = { id: 'event-1', userId: 'u', type: 'record.create', payload: { vicio_id: 'v', humor: 'Bem', data_registro: '2026-09-05' }, occurredAt: '', attempts: 0, nextRetryAt: '', status: 'pending' };

describe('pending snapshot', () => {
  it('keeps unsent records visible across a new server snapshot without modifying the source', () => {
    const projected = withPendingMutations(snapshot, [event]);
    expect(projected.registros[0]).toMatchObject({ id: event.id, pending: true, humor: 'Bem' });
    expect(snapshot.registros).toHaveLength(0);
    expect(withPendingMutations(projected, [event]).registros).toHaveLength(1);
  });
  it('never projects events from another account', () => {
    expect(withPendingMutations(snapshot, [{ ...event, userId: 'other' }]).registros).toHaveLength(0);
  });
});
