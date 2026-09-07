import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

export const signUpSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Informe como quer ser chamado.'),
  password: z
    .string()
    .min(6, 'Use pelo menos 6 caracteres.')
    .regex(/[A-Z]/, 'Inclua uma letra maiúscula.')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Inclua um caractere especial.'),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type SignUpForm = z.infer<typeof signUpSchema>;
