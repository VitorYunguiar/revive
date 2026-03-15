/**
 * @file mensagens.service.js
 * @description Servico de mensagens motivacionais diarias na API REVIVE.
 *
 * Fornece ao usuario uma mensagem de encorajamento personalizada por dia,
 * filtrada opcionalmente pelo tipo de vicio. A mensagem e gerada/selecionada
 * pelo backend e muda a cada dia.
 *
 * @module services/mensagens.service
 * @see {@link module:services/api} Modulo adaptador HTTP
 */

import { apiCall } from './api';

/**
 * Busca a mensagem motivacional diaria para o usuario.
 *
 * A API retorna uma mensagem diferente a cada dia. O parametro `tipoVicio`
 * permite filtrar mensagens mais relevantes ao contexto do usuario
 * (ex: mensagens especificas sobre tabagismo, alcoolismo, etc.).
 *
 * @param {string} [tipoVicio='geral'] - Tipo de vicio para contextualizar a
 *   mensagem (ex: 'cigarro', 'alcool', 'geral'). Valor padrao: 'geral'.
 * @param {string} token - Token JWT de autenticacao.
 * @returns {Promise<Object>} Objeto contendo a mensagem diaria, com propriedades
 *   como `mensagem` (texto da mensagem) e `autor` (autor da citacao, se houver).
 * @throws {Error} Se o token for invalido ou a requisicao falhar.
 *
 * @example
 * const msg = await getMensagemDiaria('cigarro', token);
 * // GET /api/mensagens/diaria?tipo_vicio=cigarro
 *
 * @example
 * const msg = await getMensagemDiaria('geral', token);
 * // GET /api/mensagens/diaria?tipo_vicio=geral
 */
export async function getMensagemDiaria(tipoVicio = 'geral', token) {
  return apiCall(`/mensagens/diaria?tipo_vicio=${tipoVicio}`, {}, token);
}
