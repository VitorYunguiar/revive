const { buildProgressSnapshot, completeDays, economyForInterval, observedAccountAwards, observedAwards } = require('../../progress-metrics');

describe('persisted progress metrics', () => {
    const periods = [
        { id: 'anchor', started_at: '2026-01-01 12:00:00', ended_at: '2026-01-31 12:00:00', cobertura: 'confirmed' },
        { id: 'reset', started_at: '2026-01-31 12:00:00', ended_at: null, cobertura: 'confirmed' },
    ];

    it('uses complete UTC days, retains the historical record after a reset, and counts distinct check-in dates', () => {
        const snapshot = buildProgressSnapshot({
            periods,
            economySegments: [{ id: 'daily', effective_from: '2026-01-01 12:00:00', valor_diario: '10.00', cobertura: 'inferred' }],
            records: [{ data_registro: '2026-02-01' }, { data_registro: '2026-02-01' }, { data_registro: '2026-02-02' }],
            now: new Date('2026-02-02T12:00:00Z'),
        });

        expect(snapshot.sequencia_atual_dias).toBe(2);
        expect(snapshot.recorde_dias).toBe(30);
        expect(snapshot.dias_checkin).toBe(2);
        expect(snapshot.economia_sequencia).toEqual({ valor_estimado: 20, cobertura: 'inferred' });
    });

    it('does not invent a streak or savings value when legacy continuity is unknown', () => {
        const snapshot = buildProgressSnapshot({
            periods: [{ id: 'legacy', started_at: '2026-01-01 12:00:00', ended_at: null, cobertura: 'unknown' }],
            economySegments: [{ id: 'legacy-rate', effective_from: '2026-01-01 12:00:00', valor_diario: 12.5, cobertura: 'inferred' }],
            now: new Date('2026-02-01T12:00:00Z'),
        });
        expect(snapshot.sequencia_atual_dias).toBeNull();
        expect(snapshot.recorde_dias).toBeNull();
        expect(snapshot.economia_sequencia.valor_estimado).toBeNull();
        expect(snapshot.sequencia_atual_cobertura).toBe('unknown');
    });

    it('applies daily value changes only to the overlap and leaves milestone observations idempotent by key', () => {
        const period = { id: 'one', started_at: '2026-01-01T00:00:00Z', ended_at: '2026-01-03T00:00:00Z', cobertura: 'confirmed' };
        const economySegments = [
            { id: 'a', effective_from: '2026-01-01T00:00:00Z', effective_to: '2026-01-02T12:00:00Z', valor_diario: 10, cobertura: 'confirmed' },
            { id: 'b', effective_from: '2026-01-02T12:00:00Z', effective_to: null, valor_diario: 20, cobertura: 'confirmed' },
        ];
        expect(economyForInterval(period, economySegments, new Date('2026-01-03T00:00:00Z')))
            .toEqual({ valor_estimado: 25, cobertura: 'confirmed' });
        expect(completeDays('2026-03-01 12:00:00', '2026-03-03T11:59:59Z')).toBe(1);
        const awards = observedAwards({ usuarioId: 'user', vicioId: 'habit', periods: [period], economySegments, now: new Date('2026-01-03T00:00:00Z') });
        expect(awards.some(award => award.categoria === 'streak' && award.valor_alvo === 1 && award.origem === 'period_threshold')).toBe(true);
        expect(awards.some(award => award.categoria === 'savings' && award.valor_alvo === 50)).toBe(false);
    });

    it('observes account milestones from distinct check-in days and never grants from unknown coverage', () => {
        const awards = observedAccountAwards({
            usuarioId: 'user',
            periods: [{ vicio_id: 'habit', id: 'p', started_at: '2026-01-01T00:00:00Z', ended_at: null, cobertura: 'confirmed' }],
            economySegments: [{ vicio_id: 'habit', id: 'e', effective_from: '2026-01-01T00:00:00Z', valor_diario: 10, cobertura: 'confirmed' }],
            records: [{ data_registro: '2026-01-01' }, { data_registro: '2026-01-01' }, { data_registro: '2026-01-02' }],
            goals: [{ concluida: true }],
            now: new Date('2026-01-03T00:00:00Z'),
        });
        expect(awards.some(award => award.vicio_id === null && award.categoria === 'consistency' && award.valor_alvo === 1)).toBe(false);
        expect(awards.some(award => award.vicio_id === null && award.categoria === 'goals' && award.valor_alvo === 1)).toBe(true);
        expect(awards.some(award => award.vicio_id === null && award.categoria === 'savings' && award.valor_alvo === 50)).toBe(false);

        const unknown = observedAccountAwards({
            usuarioId: 'user',
            periods: [{ vicio_id: 'legacy', id: 'legacy', started_at: '2026-01-01T00:00:00Z', ended_at: null, cobertura: 'unknown' }],
            economySegments: [{ vicio_id: 'legacy', id: 'rate', effective_from: '2026-01-01T00:00:00Z', valor_diario: 100, cobertura: 'inferred' }],
            now: new Date('2026-02-01T00:00:00Z'),
        });
        expect(unknown.some(award => award.categoria === 'streak' || award.categoria === 'savings')).toBe(false);
    });
});
