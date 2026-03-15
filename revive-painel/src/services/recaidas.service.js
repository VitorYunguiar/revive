/**
 * @file recaidas.service.js
 * @description Servico de listagem de recaidas na API REVIVE.
 *
 * Recaidas sao eventos registrados quando o usuario volta a consumir/praticar
 * um vicio. Este modulo fornece apenas a listagem consolidada de todas as
 * recaidas do usuario — o registro de novas recaidas e feito via
 * {@link module:services/vicios.service~registrarRecaida}.
 *
 * @module services/recaidas.service
 * @see {@link module:services/api} Modulo adaptador HTTP
 * @see {@link module:services/vicios.service~registrarRecaida} Funcao para registrar nova recaida
 */

import { apiCall } from './api';

/**
 * Lista todas as recaidas do usuario autenticado, de todos os vicios.
 *
 * Retorna um array com o historico completo de recaidas, contendo informacoes
 * como data, motivo, nome do vicio associado e se o contador foi resetado.
 *
 * @param {string} token - Token JWT de autenticacao.
 * @returns {Promise<Array<Object>>} Array de objetos de recaida, cada um contendo
 *   `id`, `data`, `motivo`, `vicio_id`, `resetou_contador`, etc.
 * @throws {Error} Se o token for invalido ou a requisicao falhar.
 *
 * @example
 * const recaidas = await listarRecaidas(token);
 * // GET /api/recaidas
 */
export async function listarRecaidas(token) {
  return apiCall('/recaidas', {}, token);
}
