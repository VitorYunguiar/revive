/**
 * @file auth.service.js
 * @description Servico de autenticacao e gerenciamento de perfil na API REVIVE.
 *
 * Responsavel por login, cadastro de novos usuarios, verificacao de validade
 * do token JWT e operacoes de leitura/atualizacao do perfil do usuario
 * autenticado.
 *
 * Diferente dos demais servicos, `verificarToken` utiliza `fetch` diretamente
 * em vez de `apiCall`, pois precisa apenas validar o status HTTP sem
 * tratamento de erro padronizado.
 *
 * @module services/auth.service
 * @see {@link module:services/api} Modulo adaptador HTTP
 */

import { apiCall } from './api';
import { API_BASE } from '../config/env';

/**
 * Realiza o login do usuario com email e senha.
 *
 * @param {string} email - Email do usuario cadastrado.
 * @param {string} senha - Senha do usuario.
 * @returns {Promise<Object>} Objeto contendo `token` (JWT) e dados basicos do
 *   usuario (ex: `nome`, `email`).
 * @throws {Error} Se as credenciais forem invalidas (401) ou o servidor retornar erro.
 *
 * @example
 * const { token } = await login('usuario@email.com', 'minhasenha123');
 * // POST /api/auth/login
 */
export async function login(email, senha) {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha })
  });
}

/**
 * Cadastra um novo usuario na plataforma REVIVE.
 *
 * @param {string} nome - Nome completo do usuario.
 * @param {string} email - Email do usuario (sera usado para login).
 * @param {string} senha - Senha escolhida pelo usuario.
 * @returns {Promise<Object>} Objeto contendo `token` (JWT) e dados do usuario
 *   recem-cadastrado.
 * @throws {Error} Se o email ja estiver em uso (409) ou os dados forem invalidos (400).
 *
 * @example
 * const { token } = await cadastro('Joao Silva', 'joao@email.com', 'senha123');
 * // POST /api/auth/cadastro
 */
export async function cadastro(nome, email, senha) {
  return apiCall('/auth/cadastro', {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha })
  });
}

/**
 * Verifica se um token JWT ainda e valido.
 *
 * Faz uma requisicao GET para `/vicios` com o token e verifica se a resposta
 * e bem-sucedida (status 2xx). Se o status for diferente de 2xx, lanca erro
 * indicando que o token e invalido.
 *
 * **Nota:** Esta funcao usa `fetch` diretamente em vez de `apiCall` para ter
 * controle manual sobre a verificacao de status, sem o tratamento de erro
 * padronizado do adaptador.
 *
 * @param {string} token - Token JWT a ser verificado.
 * @returns {Promise<Object>} Dados retornados pela API (lista de vicios) se o token for valido.
 * @throws {Error} Lanca "Token invalido" se a resposta HTTP nao for ok.
 *
 * @example
 * try {
 *   await verificarToken(token);
 *   // Token e valido
 * } catch (e) {
 *   // Token expirado ou invalido
 * }
 * // GET /api/vicios (com header Authorization)
 */
export async function verificarToken(token) {
  const response = await fetch(`${API_BASE}/vicios`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Token invalido');
  return response.json();
}

/**
 * Busca os dados do perfil do usuario autenticado.
 *
 * @param {string} token - Token JWT de autenticacao.
 * @returns {Promise<Object>} Objeto com os dados do usuario, incluindo
 *   `nome`, `email`, `data_criacao`, etc.
 * @throws {Error} Se o token for invalido ou a requisicao falhar.
 *
 * @example
 * const perfil = await getMe(token);
 * // GET /api/me
 */
export async function getMe(token) {
  return apiCall('/me', {}, token);
}

/**
 * Atualiza o nome do usuario autenticado.
 *
 * @param {string} nome - Novo nome do usuario.
 * @param {string} token - Token JWT de autenticacao.
 * @returns {Promise<Object>} Objeto com os dados atualizados do usuario.
 * @throws {Error} Se o nome for invalido (400) ou o token estiver expirado.
 *
 * @example
 * await updateMe('Joao Pedro', token);
 * // PATCH /api/me  body: { nome: "Joao Pedro" }
 */
export async function updateMe(nome, token) {
  return apiCall('/me', {
    method: 'PATCH',
    body: JSON.stringify({ nome })
  }, token);
}
