import { apiCall } from './api';

export async function listarRecaidas(token) {
  return apiCall('/recaidas', {}, token);
}
