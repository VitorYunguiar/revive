import { apiCall } from './api';

export async function listarVicios(token) {
  return apiCall('/vicios', {}, token);
}

export async function buscarVicio(id, token) {
  return apiCall(`/vicios/${id}`, {}, token);
}

export async function criarVicio(payload, token) {
  return apiCall('/vicios', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);
}

export async function excluirVicio(id, token) {
  return apiCall(`/vicios/${id}`, { method: 'DELETE' }, token);
}

export async function registrarRecaida(vicioId, motivo, resetarContador, token) {
  return apiCall(`/vicios/${vicioId}/recaida`, {
    method: 'POST',
    body: JSON.stringify({ motivo, resetarContador })
  }, token);
}
