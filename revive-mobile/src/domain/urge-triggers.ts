export const URGE_TRIGGER_CATALOG = [
  { code: 'estresse', label: 'Estresse' },
  { code: 'tedio', label: 'Tédio' },
  { code: 'situacao_social', label: 'Situação social' },
  { code: 'rotina', label: 'Rotina' },
  { code: 'outro', label: 'Outro' },
] as const;

export type KnownUrgeTriggerCode = typeof URGE_TRIGGER_CATALOG[number]['code'];

const labels = new Map<string, string>(URGE_TRIGGER_CATALOG.map(({ code, label }) => [code, label]));

/** Keeps future server codes intact while giving known codes a stable Brazilian Portuguese label. */
export function urgeTriggerLabel(code: string) {
  return labels.get(code) ?? `Outro (${code})`;
}
