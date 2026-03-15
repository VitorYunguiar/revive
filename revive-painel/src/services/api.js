/**
 * @file api.js
 * @description Modulo central de comunicacao HTTP com a API REVIVE.
 *
 * Implementa o **Adapter Pattern**: encapsula a Fetch API nativa em uma funcao
 * generica `apiCall` que injeta automaticamente o token JWT, faz parsing de JSON
 * e padroniza o tratamento de erros.
 *
 * Todos os modulos de servico (`vicios.service`, `metas.service`, etc.) consomem
 * exclusivamente esta funcao para realizar requisicoes, garantindo um unico ponto
 * de manutencao para headers, autenticacao e tratamento de falhas.
 *
 * @module services/api
 * @see {@link module:services/vicios.service} Exemplo de servico que consome apiCall
 * @see {@link module:services/auth.service}   Servico de autenticacao
 */

import { API_BASE } from '../config/env';

/**
 * Realiza uma chamada HTTP a API REVIVE.
 *
 * Fluxo interno:
 * 1. Monta os headers com `Content-Type: application/json`.
 * 2. Se um `token` for fornecido, adiciona o header `Authorization: Bearer <token>`.
 * 3. Executa `fetch` concatenando `API_BASE` + `endpoint`.
 * 4. Faz parsing do corpo da resposta como JSON.
 * 5. Se `response.ok` for `false` (status >= 400), lanca um `Error` com a mensagem
 *    retornada pela API (`mensagem` ou `erro`).
 *
 * @param {string} endpoint - Caminho relativo do endpoint (ex: '/vicios', '/auth/login').
 * @param {Object} [options={}] - Opcoes adicionais do fetch (`method`, `body`, `headers`, etc.).
 * @param {string|null} [token=null] - Token JWT para autenticacao (enviado como Bearer).
 * @returns {Promise<Object>} Dados da resposta parseados como JSON.
 * @throws {Error} Se a resposta HTTP nao for ok (status >= 400). A mensagem do erro
 *   e extraida de `data.mensagem` ou `data.erro`, com fallback para "Erro na requisicao".
 *
 * @example
 * // GET sem autenticacao
 * const dados = await apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
 *
 * @example
 * // GET autenticado
 * const vicios = await apiCall('/vicios', {}, token);
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
