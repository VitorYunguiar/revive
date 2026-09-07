const request = require('supertest');
const { app } = require('../../index');

describe('mobile API contract', () => {
    it('uses the structured error envelope for protected routes', async () => {
        const response = await request(app).get('/api/v2/bootstrap');
        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({ codigo: 'TOKEN_AUSENTE' });
        expect(response.body.request_id).toBeTruthy();
        expect(response.headers['x-request-id']).toBe(response.body.request_id);
    });

    it('validates login before accessing the database', async () => {
        const response = await request(app).post('/api/v2/auth/login').send({ email: '' });
        expect(response.status).toBe(422);
        expect(response.body.codigo).toBe('DADOS_INVALIDOS');
    });

    it('requires a refresh token', async () => {
        const response = await request(app).post('/api/v2/auth/refresh').send({});
        expect(response.status).toBe(422);
        expect(response.body.codigo).toBe('REFRESH_AUSENTE');
    });
});
