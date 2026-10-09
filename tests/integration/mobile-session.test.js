const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { createMobileApi, tokenHash } = require('../../mobile-api');

function fakeSupabase(initial) {
    const tables = structuredClone(initial);
    class Query {
        constructor(table) { this.table = table; this.filters = []; this.mode = 'select'; this.payload = null; }
        select(columns) { this.columns = columns; return this; }
        eq(field, value) { this.filters.push(row => row[field] === value); return this; }
        is(field, value) { this.filters.push(row => row[field] === value); return this; }
        gt(field, value) { this.filters.push(row => row[field] > value); return this; }
        insert(rows) { this.mode = 'insert'; this.payload = rows; return this; }
        update(values) { this.mode = 'update'; this.payload = values; return this; }
        delete() { this.mode = 'delete'; return this; }
        matches(row) { return this.filters.every(filter => filter(row)); }
        execute() {
            const rows = tables[this.table];
            if (!rows) return { data: null, error: new Error(`unknown table ${this.table}`) };
            if (this.mode === 'insert') {
                const inserted = this.payload.map(row => this.table === 'app_sessions'
                    ? { revoked_at: null, replaced_by: null, ...row }
                    : { ...row });
                rows.push(...inserted);
                return { data: inserted, error: null };
            }
            const matched = rows.filter(row => this.matches(row));
            if (this.mode === 'update') {
                matched.forEach(row => Object.assign(row, this.payload));
                return { data: matched, error: null };
            }
            if (this.mode === 'delete') {
                tables[this.table] = rows.filter(row => !this.matches(row));
                return { data: matched, error: null };
            }
            return { data: matched, error: null };
        }
        async maybeSingle() {
            if (this.table === 'usuarios' && this.columns === 'credential_version') {
                if (state.credentialLookupError) return { data: null, error: { code: state.credentialLookupError } };
                if (state.missingCredentialColumn) return { data: null, error: { code: '42703' } };
            }
            if (this.table === 'app_sessions' && state.failSessionLookup) return { data: null, error: new Error('database unavailable') };
            const result = this.execute(); return { ...result, data: result.data?.[0] || null };
        }
        async single() { const result = this.execute(); return { ...result, data: result.data?.[0] || null }; }
        then(resolve, reject) { return Promise.resolve(this.execute()).then(resolve, reject); }
    }
    const state = { failSessionLookup: false, createError: null, missingCredentialColumn: false, credentialLookupError: null };
    const client = {
        from: table => new Query(table),
        rpc: async (name, args) => {
            if (name === 'create_mobile_session') {
                if (state.changeHashOnCreate) tables.usuarios[0].senha_hash = 'changed-hash';
                if (state.createError) return { data: null, error: { code: state.createError } };
                const usuario = tables.usuarios.find(row => row.id === args.p_usuario_id);
                if (!usuario || usuario.senha_hash !== args.p_expected_hash) return { data: { status: 'invalid' }, error: null };
                tables.app_sessions.push({ id: args.p_id, usuario_id: usuario.id,
                    refresh_token_hash: args.p_refresh_hash, family_id: args.p_family_id,
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    user_agent: args.p_user_agent, revoked_at: null, replaced_by: null });
                return { data: { status: 'created', credential_version: 0 }, error: null };
            }
            if (name !== 'rotate_mobile_session') return { data: null, error: new Error(`unknown function ${name}`) };
            const current = tables.app_sessions.find(row => row.refresh_token_hash === args.p_refresh_token_hash);
            if (!current) return { data: { status: 'invalid' }, error: null };
            if (current.revoked_at) {
                if (current.replaced_by) {
                    tables.app_sessions.filter(row => row.family_id === current.family_id && !row.revoked_at)
                        .forEach(row => { row.revoked_at = new Date().toISOString(); });
                    return { data: { status: 'reused' }, error: null };
                }
                return { data: { status: 'invalid' }, error: null };
            }
            if (new Date(current.expires_at).getTime() <= Date.now()) {
                current.revoked_at = new Date().toISOString();
                return { data: { status: 'expired' }, error: null };
            }
            const usuario = tables.usuarios.find(row => row.id === current.usuario_id);
            if (!usuario) return { data: { status: 'invalid' }, error: null };
            tables.app_sessions.push({
                id: args.p_replacement_id, usuario_id: current.usuario_id,
                refresh_token_hash: args.p_replacement_hash, family_id: current.family_id,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                user_agent: args.p_user_agent, revoked_at: null, replaced_by: null,
            });
            current.revoked_at = new Date().toISOString();
            current.replaced_by = args.p_replacement_id;
            return { data: { status: 'rotated', usuario_id: usuario.id, nome: usuario.nome, email: usuario.email }, error: null };
        },
    };
    return { tables, client, state };
}

describe('mobile refresh-token lifecycle', () => {
    it.each([
        { missing: true, enabled: false, rpcError: 'PGRST202', status: 200 },
        { missing: false, enabled: false, rpcError: 'PGRST202', status: 500 },
        { missing: true, enabled: true, rpcError: 'PGRST202', status: 500 },
        { missing: true, enabled: false, rpcError: '42501', status: 500 },
        { missing: true, enabled: false, rpcError: 'PGRST202', lookupError: 'PGRST204', status: 500 },
        { missing: true, enabled: false, rpcError: 'PGRST202', changeHash: true, status: 401 },
    ])('creates legacy sessions only before migration with recovery disabled: %j', async scenario => {
        const database = fakeSupabase({ usuarios: [{ id: 'user-1', nome: 'Synthetic', email: 'test@example.invalid', senha_hash: 'hash', credential_version: 0 }], app_sessions: [] });
        Object.assign(database.state, { createError: scenario.rpcError, missingCredentialColumn: scenario.missing, credentialLookupError: scenario.lookupError, changeHashOnCreate: scenario.changeHash });
        const app = express(); app.use(express.json());
        app.use('/api/v2', createMobileApi({ supabase: database.client, bcrypt: { compare: async () => true }, jwtSecret: 'synthetic-secret', recoveryEnabled: scenario.enabled }));
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const response = await request(app).post('/api/v2/auth/login').send({ email: 'test@example.invalid', senha: 'Synthetic!1' });
            expect(response.status).toBe(scenario.status);
            expect(database.tables.app_sessions).toHaveLength(scenario.status === 200 ? 1 : 0);
            if (scenario.status === 200) expect(jwt.verify(response.body.access_token, 'synthetic-secret').cv).toBe(0);
        } finally { log.mockRestore(); }
    });
    it('rotates refresh tokens and revokes the family when an old token is reused', async () => {
        const secret = 'test-secret-with-enough-entropy-for-tests';
        const database = fakeSupabase({
            usuarios: [{ id: 'user-1', nome: 'Teste', email: 'teste@example.com', senha_hash: 'hash' }],
            app_sessions: [],
        });
        const app = express();
        app.use(express.json());
        app.use('/api/v2', createMobileApi({
            supabase: database.client,
            bcrypt: { compare: async () => true, hash: async () => 'hash' },
            jwtSecret: secret,
        }));

        const login = await request(app).post('/api/v2/auth/login').send({ email: 'teste@example.com', senha: 'Senha!1' });
        expect(login.status).toBe(200);
        expect(login.body.expires_in).toBe(900);
        const claims = jwt.verify(login.body.access_token, secret);
        expect(claims.token_type).toBe('access');
        expect(claims.exp - claims.iat).toBe(900);
        expect(database.tables.app_sessions[0].refresh_token_hash).toBe(tokenHash(login.body.refresh_token));
        expect(JSON.stringify(database.tables.app_sessions)).not.toContain(login.body.refresh_token);

        const refreshed = await request(app).post('/api/v2/auth/refresh').send({ refresh_token: login.body.refresh_token });
        expect(refreshed.status).toBe(200);
        expect(refreshed.body.refresh_token).not.toBe(login.body.refresh_token);
        expect(database.tables.app_sessions[0].revoked_at).toBeTruthy();
        expect(database.tables.app_sessions[0].replaced_by).toBe(database.tables.app_sessions[1].id);

        const reused = await request(app).post('/api/v2/auth/refresh').send({ refresh_token: login.body.refresh_token });
        expect(reused.status).toBe(401);
        expect(reused.body.codigo).toBe('REFRESH_REUTILIZADO');
        expect(database.tables.app_sessions.every(session => session.revoked_at)).toBe(true);

        const revokedAccess = await request(app).get('/api/v2/bootstrap')
            .set('Authorization', `Bearer ${refreshed.body.access_token}`);
        expect(revokedAccess.status).toBe(401);
        expect(revokedAccess.body.codigo).toBe('SESSAO_REVOGADA');

        database.state.failSessionLookup = true;
        const unavailable = await request(app).get('/api/v2/bootstrap')
            .set('Authorization', `Bearer ${login.body.access_token}`);
        expect(unavailable.status).toBe(503);
        expect(unavailable.body.codigo).toBe('SESSAO_INDISPONIVEL');
    });
});
