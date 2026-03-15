import { apiCall } from './api';

export async function listarMetas(token) {
  return apiCall('/metas', {}, token);
}

export async function criarMeta(payload, token) {
  return apiCall('/metas', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);
}

export async function completarMeta(metaId, token) {
  return apiCall(`/metas/${metaId}`, {
    method: 'PATCH',
    body: JSON.stringify({ concluida: true })
  }, token);
}

export async function excluirMeta(metaId, token) {
  return apiCall(`/metas/${metaId}`, { method: 'DELETE' }, token);
}
