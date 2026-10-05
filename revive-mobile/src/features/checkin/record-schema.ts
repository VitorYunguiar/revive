import { z } from 'zod';

export const recordSchema = z.object({
  humor: z.string().trim().min(1, 'Selecione ou descreva seu humor.').max(100, 'Use até 100 caracteres para o humor.'),
  gatilhos: z.string().max(500, 'Use até 500 caracteres para os gatilhos.').optional(),
  conquistas: z.string().max(500, 'Use até 500 caracteres para as conquistas.').optional(),
  observacoes: z.string().max(1000, 'Use até 1000 caracteres para as observações.').optional(),
});
