import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { BootstrapData } from '@/domain/types';
import { completedGoals, formatCurrency, maxStreak, totalSavings } from '@/domain/metrics';

const csvCell = (value: unknown) => {
  const raw = value == null ? '' : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const shareTextFile = async (name: string, content: string, mimeType: string) => {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento não disponível neste aparelho.');
  const file = new File(Paths.cache, name);
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Exportar dados do Revive' });
};

export const shareJson = (data: BootstrapData) => shareTextFile(
  `revive-${new Date().toISOString().slice(0, 10)}.json`,
  JSON.stringify(data, null, 2),
  'application/json',
);

export const shareCsv = (data: BootstrapData) => {
  const header = ['tipo', 'habito', 'data', 'humor', 'descricao', 'pendente'];
  const habitNames = new Map(data.vicios.map((habit) => [habit.id, habit.nome_vicio]));
  const rows = [
    ...data.registros.map((record) => ['registro', habitNames.get(record.vicio_id), record.data_registro, record.humor, record.observacoes, record.pending]),
    ...data.recaidas.map((relapse) => ['recaida', habitNames.get(relapse.vicio_id), relapse.data_recaida, '', relapse.motivo, relapse.pending]),
    ...data.metas.map((goal) => ['meta', goal.vicios?.nome_vicio, goal.data_inicio_meta, '', goal.descricao_meta, goal.pending]),
  ];
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  return shareTextFile(`revive-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`, 'text/csv');
};

export const printSummary = (data: BootstrapData) => Print.printAsync({
  html: `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui;padding:32px;color:#142033}h1{color:#176b55}.card{border:1px solid #ccd7d2;border-radius:12px;padding:16px;margin:12px 0}</style></head><body>
    <h1>Resumo Revive</h1><p>Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</p>
    <div class="card"><strong>Maior sequência:</strong> ${maxStreak(data.vicios)} dias</div>
    <div class="card"><strong>Total economizado:</strong> ${escapeHtml(formatCurrency(totalSavings(data.vicios)))}</div>
    <div class="card"><strong>Metas concluídas:</strong> ${completedGoals(data.metas)}</div>
    <p>Este relatório é pessoal e não substitui orientação médica ou psicológica.</p>
  </body></html>`,
});
