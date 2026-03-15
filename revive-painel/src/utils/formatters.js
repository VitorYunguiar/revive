/**
 * Calcula o tempo decorrido desde uma data e retorna string formatada.
 */
export function calcularTempoDecorrido(dataInicio) {
  if (!dataInicio) return 'Sem data de inicio';
  const inicio = new Date(dataInicio);
  const agora = new Date();
  const diffTime = Math.abs(agora - inicio);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

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

/**
 * Formata valor monetario em BRL.
 */
export function formatarMoeda(valor) {
  return `R$ ${Number(valor).toFixed(2)}`;
}

/**
 * Formata data em pt-BR.
 */
export function formatarData(data, options = {}) {
  const defaultOptions = { day: '2-digit', month: 'long', year: 'numeric' };
  return new Date(data).toLocaleDateString('pt-BR', { ...defaultOptions, ...options });
}

/**
 * Formata data curta (dd/mm/yyyy).
 */
export function formatarDataCurta(data) {
  return new Date(data).toLocaleDateString('pt-BR');
}

/**
 * Calcula dias de diferenca entre duas datas.
 */
export function calcularDiasDiferenca(data1, data2 = new Date()) {
  return Math.floor(Math.abs(new Date(data2) - new Date(data1)) / (1000 * 60 * 60 * 24));
}
