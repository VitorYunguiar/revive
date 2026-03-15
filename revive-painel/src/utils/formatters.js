/**
 * @file formatters.js
 * @description Funcoes utilitarias de formatacao de dados para exibicao no painel REVIVE.
 *
 * Contem constantes auxiliares e funcoes puras que transformam valores brutos
 * (datas, numeros) em strings amigaveis para o usuario final.
 *
 * @module utils/formatters
 */

/**
 * Quantidade de milissegundos em um dia (24h).
 *
 * Utilizada como divisor para converter diferencas de timestamps em dias
 * inteiros. Valor: 86.400.000 ms.
 *
 * @type {number}
 * @constant
 */
export const MS_PER_DAY = 86_400_000;

/**
 * Calcula o tempo decorrido desde uma data e retorna uma string descritiva
 * em portugues (PT-BR).
 *
 * A logica segue faixas progressivas:
 * - **0 dias** — "Iniciado hoje"
 * - **1 dia** — "Iniciado ha 1 dia"
 * - **2-29 dias** — "Iniciado ha X dias"
 * - **30-364 dias** — "Iniciado ha X mes(es)"
 * - **365+ dias** — "Iniciado ha X ano(s)"
 *
 * @param {string|Date} dataInicio - Data de inicio (ISO string ou objeto Date).
 *   Se falsy, retorna mensagem padrao indicando ausencia de data.
 * @returns {string} Texto descritivo do tempo decorrido (ex: "Iniciado ha 15 dias").
 *
 * @example
 * calcularTempoDecorrido('2024-01-01'); // "Iniciado ha 14 meses"
 * calcularTempoDecorrido(null);         // "Sem data de inicio"
 */
export function calcularTempoDecorrido(dataInicio) {
  if (!dataInicio) return 'Sem data de inicio';
  const inicio = new Date(dataInicio);
  const agora = new Date();
  const diffTime = Math.abs(agora - inicio);
  const diffDays = Math.floor(diffTime / MS_PER_DAY);

  if (diffDays === 0) return 'Iniciado hoje';
  if (diffDays === 1) return 'Iniciado ha 1 dia';
  if (diffDays < 30) return `Iniciado ha ${diffDays} dias`;
  if (diffDays < 365) {
    const meses = Math.floor(diffDays / 30);
    return `Iniciado ha ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  }
  const anos = Math.floor(diffDays / 365);
  return `Iniciado ha ${anos} ${anos === 1 ? 'ano' : 'anos'}`;
}
