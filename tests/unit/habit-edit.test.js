const { validateHabitPatch, listEditableHabits } = require('../../habit-edit');

it('normalizes only editable fields and preserves the expected revision', () => {
    expect(validateHabitPatch({ revision: 3, nome_vicio: ' Café ', valor_economizado_por_dia: 1234.56, ativo: false })).toEqual({ revision: 3, patch: { nome_vicio: 'Café', valor_economizado_por_dia: 1234.56, ativo: false }, fields: {} });
});
it('keeps old-schema bootstrap available during rollout, without granting editability or hiding other failures', async () => {
    const selections = [], owners = [];
    let error = { code: '42703', message: 'column vicios.habit_start_editable does not exist' };
    const client = { from: () => ({
        select(fields) { selections.push(fields); this.fields = fields; return this; },
        eq(field, value) { owners.push([field, value]); return this; },
        async order() { return this.fields === '*' ? { data: [], error: null } : { data: null, error }; },
    }) };
    expect(await listEditableHabits(client, 'owner')).toEqual({ data: [], error: null });
    expect(selections).toEqual(['*, inicio_editavel:habit_start_editable', '*']);
    expect(owners).toEqual([['usuario_id', 'owner'], ['usuario_id', 'owner']]);
    error = { code: '42501', message: 'permission denied' };
    selections.length = 0;
    expect((await listEditableHabits(client, 'owner')).error).toEqual(error);
    expect(selections).toHaveLength(1);
});
it.each([
    { revision: 0, ativo: false }, { revision: 1 }, { revision: 1, usuario_id: 'other' },
    { revision: 1, data_inicio: '2026-02-30' }, { revision: 1, data_inicio: '9999-01-01' },
    { revision: 1, valor_economizado_por_dia: '10,00' }, { revision: 1, valor_economizado_por_dia: -1 },
    { revision: 1, valor_economizado_por_dia: 1.234 }, { revision: 1, ativo: 'false' }, { revision: 1, nome_vicio: null },
])('rejects invalid edit without passing data to PostgreSQL: %j', body => {
    expect(Object.keys(validateHabitPatch(body).fields).length).toBeGreaterThan(0);
});
