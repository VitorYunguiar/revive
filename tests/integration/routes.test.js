const request = require('supertest');
const { app } = require('../../index');

describe('api routes', () => {
    it('GET /api/health responds with status payload', async () => {
        const response = await request(app).get('/api/health');

        expect(response.statusCode).toBe(200);
        expect(response.headers['cache-control']).toBe('no-store');
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

    it('POST /api/auth/cadastro is not rejected by CORS for same-domain Render requests', async () => {
        const response = await request(app)
            .post('/api/auth/cadastro')
            .set('Origin', 'https://revive.onrender.com')
            .send({ nome: '', email: '', senha: '' });

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
            erro: 'Todos os campos sao obrigatorios'
        });
    });

    it('POST /api/auth/cadastro does not lock manual retries at the old auth limit', async () => {
        for (let attempt = 0; attempt < 20; attempt += 1) {
            const response = await request(app)
                .post('/api/auth/cadastro')
                .set('X-Forwarded-For', '203.0.113.10')
                .send({ nome: '', email: '', senha: '' });

            expect(response.statusCode).toBe(400);
            expect(response.body).toEqual({
                erro: 'Todos os campos sao obrigatorios'
            });
        }
    });
});
