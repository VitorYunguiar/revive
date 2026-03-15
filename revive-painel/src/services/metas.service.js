/**
 * @file metas.service.js
 * @description Servico de CRUD de metas pessoais na API REVIVE.
 *
 * Metas representam objetivos que o usuario define para si mesmo durante o
 * processo de recuperacao (ex: "Correr 3x por semana", "Ler 1 livro por mes").
 * Este modulo permite listar, criar, marcar como concluida e excluir metas.
 *
 * @module services/metas.service
 * @see {@link module:services/api} Modulo adaptador HTTP
 */

import { apiCall } from './api';

/**
 * Lista todas as metas do usuario autenticado.
 *
 * @param {string} token - Token JWT de autenticacao.
 * @returns {Promise<Array<Object>>} Array de objetos de meta, cada um contendo
 *   `id`, `titulo`, `descricao`, `concluida`, `data_criacao`, etc.
 * @throws {Error} Se o token for invalido ou a requisicao falhar.
 *
 * @example
 * const metas = await listarMetas(token);
 * // GET /api/metas
 */
export async function listarMetas(token) {
  return apiCall('/metas', {}, token);
}

/**
 * Cria uma nova meta para o usuario autenticado.
 *
 * @param {Object} payload - Dados da nova meta.
 * @param {string} payload.titulo - Titulo descritivo da meta.
 * @param {string} [payload.descricao] - Descricao detalhada da meta.
 * @param {string} token - Token JWT de autenticacao.
 * @returns {Promise<Object>} Objeto da meta recem-criada, incluindo o `id` gerado.
 * @throws {Error} Se os dados forem invalidos (400) ou ocorrer erro de autenticacao.
 *
 * @example
 * const meta = await criarMeta({ titulo: 'Meditar diariamente' }, token);
 * // POST /api/metas
 */
export async function criarMeta(payload, token) {
  return apiCall('/metas', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);
}

/**
 * Marca uma meta existente como concluida.
 *
 * Envia um PATCH com `{ concluida: true }` para atualizar o status da meta.
 * Esta acao e irreversivel na interface — uma vez concluida, a meta nao pode
 * ser reaberta pelo frontend.
 *
 * @param {string|number} metaId - Identificador unico da meta.
 * @param {string} token - Token JWT de autenticacao.
 * @returns {Promise<Object>} Objeto da meta atualizada com `concluida: true`.
 * @throws {Error} Se a meta nao for encontrada (404) ou o usuario nao tiver permissao.
 *
 * @example
 * await completarMeta(7, token);
 * // PATCH /api/metas/7  body: { concluida: true }
 */
export async function completarMeta(metaId, token) {
  return apiCall(`/metas/${metaId}`, {
    method: 'PATCH',
    body: JSON.stringify({ concluida: true })
  }, token);
}

/**
 * Exclui uma meta existente pelo seu ID.
 *
 * @param {string|number} metaId - Identificador unico da meta a ser excluida.
 * @param {string} token - Token JWT de autenticacao.
 * @returns {Promise<Object>} Confirmacao da exclusao retornada pela API.
 * @throws {Error} Se a meta nao for encontrada (404) ou o usuario nao tiver permissao.
 *
 * @example
 * await excluirMeta(7, token);
 * // DELETE /api/metas/7
 */
export async function excluirMeta(metaId, token) {
  return apiCall(`/metas/${metaId}`, { method: 'DELETE' }, token);
}
