import { apiCall } from './api';

export async function getMensagemDiaria(tipoVicio = 'geral', token) {
  return apiCall(`/mensagens/diaria?tipo_vicio=${tipoVicio}`, {}, token);
}
