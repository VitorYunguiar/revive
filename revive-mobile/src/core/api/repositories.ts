import { apiFetch } from './client';
import type {
  Addiction,
  UpdateAddictionInput,
  BootstrapData,
  CreateAddictionInput,
  CreateGoalInput,
  CreateRecordInput,
  CreateRelapseInput,
  CreateUrgeEventInput,
  Goal,
  ListUrgeEventsInput,
  UrgeEvent,
  UrgeEventPage,
} from '@/domain/types';

export const reviveApi = {
  getMe: () => apiFetch<{ usuario: BootstrapData['usuario'] }>('/me'),
  bootstrap: () => apiFetch<BootstrapData>('/v2/bootstrap'),
  createAddiction: (input: CreateAddictionInput) =>
    apiFetch<{ vicio: Addiction }>('/vicios', { method: 'POST', body: JSON.stringify(input) }),
  getAddiction: (id: string) => apiFetch<{ vicio: Addiction }>(`/vicios/${id}`),
  updateAddiction: (id: string, input: UpdateAddictionInput) => apiFetch<{ vicio: Addiction }>(`/v2/vicios/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteAddiction: (id: string) => apiFetch<{ mensagem: string }>(`/vicios/${id}`, { method: 'DELETE' }),
  createRecord: (input: CreateRecordInput, idempotencyKey?: string) =>
    apiFetch('/v2/registros', { method: 'POST', body: JSON.stringify(input), idempotencyKey }),
  createRelapse: (addictionId: string, input: CreateRelapseInput, idempotencyKey?: string) =>
    apiFetch(`/v2/vicios/${addictionId}/recaida`, {
      method: 'POST',
      body: JSON.stringify(input),
      idempotencyKey,
    }),
  createUrgeEvent: (input: CreateUrgeEventInput, idempotencyKey?: string) =>
    apiFetch<{ vontade: UrgeEvent }>('/vontades', {
      method: 'POST',
      body: JSON.stringify(input),
      idempotencyKey,
    }),
  listUrgeEvents: (input: ListUrgeEventsInput) => {
    const params = new URLSearchParams({
      vicio_id: input.vicio_id,
      inicio: input.inicio,
      fim: input.fim,
      timezone: input.timezone,
      limit: String(input.limit ?? 50),
    });
    if (input.cursor) params.set('cursor', input.cursor);
    return apiFetch<UrgeEventPage>(`/vontades?${params.toString()}`);
  },
  createGoal: (input: CreateGoalInput, idempotencyKey?: string) =>
    apiFetch<{ meta: Goal }>('/v2/metas', {
      method: 'POST',
      body: JSON.stringify(input),
      idempotencyKey,
    }),
  completeGoal: (goalId: string, idempotencyKey?: string) =>
    apiFetch<{ meta: Goal }>(`/v2/metas/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify({ concluida: true }),
      idempotencyKey,
    }),
  deleteGoal: (goalId: string) => apiFetch(`/metas/${goalId}`, { method: 'DELETE' }),
  logout: () =>
    apiFetch<void>('/v2/auth/logout', {
      method: 'POST',
      retryAuth: false,
    }),
  deleteAccount: () => apiFetch<void>('/v2/account', { method: 'DELETE' }),
};
