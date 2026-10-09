import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';

export async function verifyHabitEdits(app, sql, jwtSecret) {
  const owner = randomUUID(), other = randomUUID(), habit = randomUUID(), session = randomUUID();
  await sql.query("insert into public.usuarios(id,nome,email,senha_hash) values($1,'Synthetic edit',$2,'synthetic'),($3,'Synthetic other',$4,'synthetic')", [owner, `${owner}@example.invalid`, other, `${other}@example.invalid`]);
  await sql.query("insert into public.app_sessions(id,usuario_id,refresh_token_hash,family_id,expires_at) values($1,$2,$3,$4,now()+interval '1 day')", [session, owner, randomUUID(), randomUUID()]);
  await sql.query("insert into public.vicios(id,usuario_id,nome_vicio,data_inicio,valor_economizado_por_dia) values($1,$2,'Synthetic habit',(now() at time zone 'UTC')::date,10)", [habit, owner]);
  const token = jwt.sign({ id: owner, sid: session, token_type: 'access' }, jwtSecret);
  const patch = body => request(app).patch(`/api/v2/vicios/${habit}`).set('Authorization', `Bearer ${token}`).send(body);
  try {
    assert.equal((await request(app).patch(`/api/v2/vicios/${habit}`).send({ revision: 1, ativo: false })).status, 401);
    assert.equal((await patch({ revision: 1, data_inicio: '2026-02-30' })).status, 422);
    assert.equal((await patch({ revision: 1, data_inicio: '9999-01-01' })).status, 422);
    const corrected = await patch({ revision: 1, data_inicio: '2026-10-01' });
    assert.equal(corrected.status, 200, JSON.stringify(corrected.body));
    assert.equal(corrected.body.vicio.revision, 2);
    const [one, two] = await Promise.all([patch({ revision: 2, nome_vicio: 'First' }), patch({ revision: 2, nome_vicio: 'Second' })]);
    assert.deepEqual([one.status, two.status].sort(), [200, 409]);
    const foreign = await sql.query('select public.edit_revive_habit($1,$2,3,$3::jsonb) as result', [other, habit, '{"ativo":false}']);
    assert.equal(foreign.rows[0].result.status, 404);
    const before = (await sql.query('select * from public.segmentos_economia where vicio_id=$1', [habit])).rows[0];
    assert.equal((await patch({ revision: 3, valor_economizado_por_dia: 20 })).status, 200);
    const segments = (await sql.query('select * from public.segmentos_economia where vicio_id=$1 order by effective_from,id', [habit])).rows;
    assert.equal(segments.length, 2);
    assert.equal(segments[0].id, before.id);
    assert.equal(Number(segments[0].valor_diario), 10);
    assert.equal(Number(segments[1].valor_diario), 20);
    assert.equal(segments[0].effective_to.getTime(), segments[1].effective_from.getTime());
    const legacyStats = await request(app).get(`/api/vicios/${habit}`).set('Authorization', `Bearer ${token}`);
    assert.equal(legacyStats.status, 200);
    assert.ok(Number(legacyStats.body.vicio.valor_economizado) < Number(legacyStats.body.vicio.dias_abstinencia) * 20);
    const newGoal = await request(app).post('/api/v2/metas').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', randomUUID())
      .send({ vicio_id: habit, descricao_meta: 'Synthetic prospective baseline', valor_objetivo: 100, iniciar_hoje: true });
    assert.equal(newGoal.status, 201, JSON.stringify(newGoal.body));
    assert.ok(Math.abs(Number(newGoal.body.meta.valor_economizado_inicio) - Number(legacyStats.body.vicio.valor_economizado)) < 0.02);
    assert.equal((await patch({ revision: 4, data_inicio: '2026-09-01' })).body.codigo, 'INICIO_COM_HISTORICO');
    await sql.query("insert into public.registros_diarios(vicio_id,humor,data_registro) values($1,'synthetic','2026-10-02')", [habit]);
    await sql.query("insert into public.metas(usuario_id,vicio_id,descricao_meta,dias_objetivo) values($1,$2,'Synthetic preserved',7)", [owner, habit]);
    await sql.query("insert into public.historico_recaidas(vicio_id,motivo,data_recaida,resetar_contador) values($1,'synthetic','2026-10-03',false)", [habit]);
    await sql.query("insert into public.conquistas_permanentes(usuario_id,vicio_id,categoria,valor_alvo,awarded_at,origem,cobertura) values($1,$2,'streak',1,now(),'snapshot_observation','confirmed')", [owner, habit]);
    const preserved = async () => (await sql.query(`select
      (select array_agg(id order by id) from public.registros_diarios where vicio_id=$1) as records,
      (select array_agg(id order by id) from public.historico_recaidas where vicio_id=$1) as relapses,
      (select array_agg(id order by id) from public.metas where vicio_id=$1) as goals,
      (select array_agg(id order by id) from public.progresso_periodos where vicio_id=$1) as periods,
      (select array_agg(id order by id) from public.conquistas_permanentes where vicio_id=$1) as awards`, [habit])).rows[0];
    const ids = await preserved();
    assert.equal((await patch({ revision: 4, ativo: false })).status, 200);
    assert.deepEqual(await preserved(), ids);
    assert.equal((await sql.query('select data_ultima_recaida from public.vicios where id=$1', [habit])).rows[0].data_ultima_recaida, null);
    const key = randomUUID();
    const record = () => request(app).post('/api/v2/registros').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', key).send({ vicio_id: habit, data_registro: '2026-10-04', humor: 'synthetic' });
    assert.equal((await record()).body.codigo, 'HABITO_ARQUIVADO');
    assert.equal((await sql.query('select idempotency_key from public.api_idempotency where usuario_id=$1 and idempotency_key=$2', [owner, key])).rowCount, 0);
    const bootstrap = await request(app).get('/api/v2/bootstrap').set('Authorization', `Bearer ${token}`);
    assert.equal(bootstrap.status, 200, JSON.stringify(bootstrap.body));
    assert.equal(bootstrap.body.vicios.find(row => row.id === habit).ativo, false);
    assert.equal(bootstrap.body.vicios.find(row => row.id === habit).inicio_editavel, false);
    assert.equal((await patch({ revision: 5, ativo: true })).status, 200);
    // Bootstrap may add earned awards, but does not remove any existing history.
    const after = await preserved();
    for (const kind of ['records','relapses','goals','periods']) assert.deepEqual(after[kind], ids[kind]);
    assert.ok(ids.awards.every(id => after.awards.includes(id)));
    assert.equal((await record()).status, 201);
    assert.equal((await record()).status, 201);
    assert.equal((await sql.query("select id from public.registros_diarios where vicio_id=$1 and data_registro='2026-10-04'", [habit])).rowCount, 1);
    assert.equal((await sql.query('select concluida from public.metas where vicio_id=$1', [habit])).rows[0].concluida, false);
  } finally {
    await sql.query('select public.delete_revive_account($1)', [owner]);
    await sql.query('select public.delete_revive_account($1)', [other]);
  }
  console.log('Habit edits: real HTTP/PostgreSQL concurrency, history, economy segments and archived retry passed.');
}
