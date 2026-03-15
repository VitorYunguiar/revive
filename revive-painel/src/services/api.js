import { API_BASE } from '../config/env';

/**
 * Central API call wrapper. Handles token injection, JSON parsing, and error formatting.
 */
export async function apiCall(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensagem || data.erro || 'Erro na requisicao');
  }

  return data;
}
