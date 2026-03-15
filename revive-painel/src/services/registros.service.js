import { apiCall } from './api';

export async function criarRegistro(payload, token) {
  return apiCall('/registros', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);
}

export async function listarRegistros(vicioId, token) {
  return apiCall(`/vicios/${vicioId}/registros`, {}, token);
}
