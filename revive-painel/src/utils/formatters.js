export const MS_PER_DAY = 86_400_000;

/**
 * Calcula o tempo decorrido desde uma data e retorna string formatada.
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
