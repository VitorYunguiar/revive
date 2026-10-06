const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createCredentialAuth } = require('../../credential-auth');
function fixture() {
    const state = { version: 0, session: true, unavailable: false };
    const database = { from: table => {
        const query = { select: () => query, eq: () => query, is: () => query, gt: () => query,
            maybeSingle: async () => ({ error: state.unavailable ? {} : null,
                data: table === 'usuarios' ? { credential_version: state.version } : state.session ? { id: 'session' } : null }) };
        return query;
    } };
    const app = express(); app.get('/protected', createCredentialAuth({ supabase: database, jwtSecret: 'synthetic-secret' }), (_, res) => res.sendStatus(200));
    const call = claims => request(app).get('/protected').set('Authorization', `Bearer ${jwt.sign({ id: 'user', ...claims }, 'synthetic-secret', { expiresIn: '1m' })}`);
    return { state, call };
}
describe('web credentials rollout', () => {
    it('accepts versionless legacy JWTs only before the first password change', async () => {
        const test = fixture();
        expect((await test.call({})).status).toBe(200);
        test.state.version = 1;
        expect((await test.call({})).status).toBe(401);
        expect((await test.call({ cv: 0 })).status).toBe(401);
        expect((await test.call({ cv: 1 })).status).toBe(200);
        test.state.unavailable = true;
        expect((await test.call({ cv: 1 })).status).toBe(503);
    });
    it('honors mobile revocation on compatibility routes', async () => {
        const test = fixture();
        expect((await test.call({ sid: 'session', token_type: 'access' })).status).toBe(200);
        test.state.session = false;
        expect((await test.call({ sid: 'session', token_type: 'access' })).status).toBe(401);
        expect((await test.call({ sid: 'session', token_type: 'other' })).status).toBe(401);
    });
});
