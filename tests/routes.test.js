const { describe, it, expect } = require('vitest');
const request = require('supertest');
const { app } = require('../index');

describe('api routes', () => {
    it('GET /api/health responds with status payload', async () => {
        const response = await request(app).get('/api/health');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
    });

    it('POST /api/auth/login validates required fields before DB access', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: '', senha: '' });

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            erro: 'Email e senha sao obrigatorios'
        });
    });

    it('POST /api/auth/cadastro validates required fields before DB access', async () => {
        const response = await request(app)
            .post('/api/auth/cadastro')
            .send({ nome: '', email: '', senha: '' });

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            erro: 'Todos os campos sao obrigatorios'
        });
    });
});
