import { apiCall } from './api';
import { API_BASE } from '../config/env';

export async function login(email, senha) {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha })
  });
}

export async function cadastro(nome, email, senha) {
  return apiCall('/auth/cadastro', {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha })
  });
}

export async function verificarToken(token) {
  const response = await fetch(`${API_BASE}/vicios`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Token invalido');
  return response.json();
}

export async function getMe(token) {
  return apiCall('/me', {}, token);
}

export async function updateMe(nome, token) {
  return apiCall('/me', {
    method: 'PATCH',
    body: JSON.stringify({ nome })
  }, token);
}
