// Explicit opt-in integration test against the Revive DEVELOPMENT project.
// Creates disposable accounts and removes only those accounts in finally.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { createClient } = require('@supabase/supabase-js');
const request = require('supertest');

async function main() {
  assert.equal(process.env.REVIVE_VERIFY_DEVELOPMENT, '1', 'Explicit development opt-in required');
  assert.equal(process.env.SUPABASE_URL, 'https://upqlaeqdaobzrepamnvs.supabase.co');
  assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY, 'Server key required');
  process.env.NODE_ENV = 'test';
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const remoteUrl = process.env.REVIVE_VERIFY_API_URL;
  if (remoteUrl) assert.equal(remoteUrl, 'https://revive-beryl.vercel.app', 'Only the verified development deployment is allowed');
  const app = remoteUrl || require('../index').app;
  const emails = [];
  const ids = [];
  const habits = [];
  const checked = [];
  const ok = label => { checked.push(label); console.log(`PASS ${label}`); };
  const call = (method, route, token, body, key) => {
    let req = request(app)[method](`/api/v2${route}`);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    if (key) req = req.set('Idempotency-Key', key);
    return body ? req.send(body) : req;
  };
  try {
    const sessions = [];
    const password = `Test!${crypto.randomBytes(18).toString('hex')}`;
    for (let i = 0; i < 2; i++) {
      const email = `migration-${crypto.randomUUID()}@example.invalid`;
      emails.push(email);
      const signup = await call('post', '/auth/cadastro', null, { nome: 'Migration verification', email, senha: password });
      assert.equal(signup.status, 201, `signup status ${signup.status}`);
      ids.push(signup.body.usuario.id);
      const login = await call('post', '/auth/login', null, { email, senha: password });
      assert.equal(login.status, 200);
      sessions.push(login.body);
    }
    ok('real signup and login for two accounts');
    const a = sessions[0], b = sessions[1];
    const habit = await admin.from('vicios').insert({ usuario_id: ids[0], nome_vicio: 'Migration verification', data_inicio: new Date().toISOString() }).select('id').single();
    assert.equal(habit.error, null); habits.push(habit.data.id);
    const vicio_id = habit.data.id;
    const milestone = await admin.from('marcos').insert({ vicio_id, tipo_marco: 'verification', dias_abstinencia: 1, data_marco: new Date().toISOString() });
    assert.equal(milestone.error, null);
    const first = await call('get', '/bootstrap', a.access_token);
    assert.equal(first.status, 200);
    assert.ok(first.body.vicios.some(v => v.id === vicio_id));
    const other = await call('get', '/bootstrap', b.access_token);
    assert.equal(other.status, 200);
    assert.equal(other.body.vicios.length, 0);
    const denied = await call('post', '/registros', b.access_token, { vicio_id }, crypto.randomUUID());
    assert.equal(denied.status, 404);
    ok('bootstrap and cross-account access isolation');
    const key = crypto.randomUUID();
    const body = { vicio_id, data_registro: new Date().toISOString().slice(0, 10), humor: 'teste' };
    const record = await call('post', '/registros', a.access_token, body, key);
    assert.equal(record.status, 201);
    const replay = await call('post', '/registros', a.access_token, body, key);
    assert.equal(replay.status, 201);
    assert.equal(replay.body.registro.id, record.body.registro.id);
    const conflict = await call('post', '/registros', a.access_token, { ...body, humor: 'outro' }, key);
    assert.equal(conflict.status, 409);
    ok('sequential idempotency replay and payload conflict');
    const goal = await call('post', '/metas', a.access_token, { vicio_id, descricao_meta: 'Verification', dias_objetivo: 7, iniciar_hoje: true }, crypto.randomUUID());
    assert.equal(goal.status, 201);
    const completed = await call('patch', `/metas/${goal.body.meta.id}`, a.access_token, { concluida: true }, crypto.randomUUID());
    assert.equal(completed.status, 200);
    const relapse = await call('post', `/vicios/${vicio_id}/recaida`, a.access_token, { occurred_at: new Date().toISOString(), resetarContador: true }, crypto.randomUUID());
    assert.equal(relapse.status, 201);
    ok('goal creation/completion and relapse');
    const device = await call('post', '/devices/push-token', a.access_token, { expo_push_token: `ExpoPushToken[${crypto.randomUUID()}]`, platform: 'android' });
    assert.equal(device.status, 204);
    const refreshed = await call('post', '/auth/refresh', null, { refresh_token: a.refresh_token });
    assert.equal(refreshed.status, 200);
    assert.notEqual(refreshed.body.refresh_token, a.refresh_token);
    const reused = await call('post', '/auth/refresh', null, { refresh_token: a.refresh_token });
    assert.equal(reused.status, 401);
    const familyRevoked = await call('post', '/auth/refresh', null, { refresh_token: refreshed.body.refresh_token });
    assert.equal(familyRevoked.status, 401);
    const logout = await call('post', '/auth/logout', b.access_token, { refresh_token: b.refresh_token });
    assert.equal(logout.status, 204);
    assert.equal((await call('post', '/auth/refresh', null, { refresh_token: b.refresh_token })).status, 401);
    ok('device registration, refresh rotation/reuse rejection and logout refresh revocation');
    // Fresh sessions for deletion; this does not assert immediate access-token revocation.
    for (let i = 0; i < ids.length; i++) {
      const login = await call('post', '/auth/login', null, { email: emails[i], senha: password });
      assert.equal(login.status, 200);
      assert.equal((await call('delete', '/account', login.body.access_token)).status, 204);
    }
    for (const table of ['usuarios', 'vicios', 'metas', 'app_sessions', 'api_idempotency', 'device_push_tokens']) {
      const r = await admin.from(table).select('*', { head: true, count: 'exact' }).in(table === 'usuarios' ? 'id' : 'usuario_id', ids);
      assert.equal(r.error, null); assert.equal(r.count, 0, `${table} cleanup`);
    }
    for (const table of ['registros_diarios', 'historico_recaidas', 'marcos']) {
      const r = await admin.from(table).select('*', { head: true, count: 'exact' }).in('vicio_id', habits);
      assert.equal(r.error, null); assert.equal(r.count, 0, `${table} cleanup`);
    }
    ok('account deletion and cleanup of all dependent fixtures');
    console.log(`Completed ${checked.length} live verification groups`);
  } finally {
    // Email filter also catches signup that inserted a user before failing session creation.
    for (const email of emails) {
      const lookup = await admin.from('usuarios').select('id').eq('email', email).maybeSingle();
      assert.equal(lookup.error, null, 'Cleanup lookup failed');
      if (lookup.data) {
        const cleanup = await admin.rpc('delete_revive_account', { p_usuario_id: lookup.data.id });
        assert.equal(cleanup.error, null, 'Fixture cleanup failed');
      }
    }
  }
}
main().catch(error => { console.error('Verification failed:', error.message); process.exitCode = 1; });
