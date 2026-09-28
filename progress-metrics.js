const DAY_MS = 86_400_000;
const COVERAGE_RANK = { confirmed: 0, inferred: 1, unknown: 2 };

function timestamp(value) {
    if (value == null) return null;
    if (value instanceof Date) return value.getTime();
    const text = String(value);
    const withZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(text) ? text : `${text}Z`;
    const result = Date.parse(withZone);
    return Number.isFinite(result) ? result : null;
}

function completeDays(start, end) {
    const startAt = timestamp(start);
    const endAt = timestamp(end);
    if (startAt == null || endAt == null) return null;
    return Math.max(0, Math.floor((endAt - startAt) / DAY_MS));
}

function combineCoverage(...values) {
    return values.reduce((result, value) => {
        const current = value || 'unknown';
        return (COVERAGE_RANK[current] ?? COVERAGE_RANK.unknown) > (COVERAGE_RANK[result] ?? COVERAGE_RANK.unknown)
            ? current : result;
    }, 'confirmed');
}

function periodEnd(period, now) {
    return period.ended_at || now;
}

function economyForInterval(period, segments, now) {
    const start = timestamp(period.started_at);
    if (start == null) return { valor_estimado: null, cobertura: 'unknown' };
    const days = completeDays(period.started_at, periodEnd(period, now));
    if (days == null) return { valor_estimado: null, cobertura: 'unknown' };
    const end = start + days * DAY_MS;
    if (end === start) {
        return { valor_estimado: 0, cobertura: period.cobertura || 'unknown' };
    }

    const ordered = segments
        .map(segment => ({ segment, start: timestamp(segment.effective_from), end: segment.effective_to ? timestamp(segment.effective_to) : Number.POSITIVE_INFINITY }))
        .filter(item => item.start != null && item.end != null && item.end > start && item.start < end)
        .sort((a, b) => a.start - b.start || String(a.segment.id).localeCompare(String(b.segment.id)));
    let cursor = start;
    let amount = 0;
    let coverage = period.cobertura || 'unknown';
    for (const item of ordered) {
        const overlapStart = Math.max(start, item.start);
        const overlapEnd = Math.min(end, item.end);
        if (overlapEnd <= overlapStart) continue;
        if (overlapStart > cursor) coverage = 'unknown';
        if (item.segment.valor_diario == null || item.segment.cobertura === 'unknown') {
            coverage = 'unknown';
        } else {
            coverage = combineCoverage(coverage, item.segment.cobertura);
            amount += ((overlapEnd - overlapStart) / DAY_MS) * Number(item.segment.valor_diario);
        }
        cursor = Math.max(cursor, overlapEnd);
    }
    if (cursor < end) coverage = 'unknown';
    return {
        valor_estimado: coverage === 'unknown' ? null : Math.round((amount + Number.EPSILON) * 100) / 100,
        cobertura: coverage,
    };
}

function buildProgressSnapshot({ periods = [], economySegments = [], records = [], awards = [], now = new Date() }) {
    const ordered = [...periods].sort((a, b) => {
        const byStart = (timestamp(a.started_at) ?? 0) - (timestamp(b.started_at) ?? 0);
        return byStart || String(a.id).localeCompare(String(b.id));
    });
    const current = ordered.find(period => period.ended_at == null) || null;
    const duration = period => completeDays(period.started_at, periodEnd(period, now));
    const knownDurations = ordered
        .filter(period => period.cobertura !== 'unknown')
        .map(duration)
        .filter(value => value != null);
    const recordCoverage = ordered.some(period => period.cobertura === 'unknown')
        ? 'unknown'
        : knownDurations.length
            ? combineCoverage(...ordered.filter(period => period.cobertura !== 'unknown' && duration(period) === Math.max(...knownDurations)).map(period => period.cobertura))
            : 'unknown';
    const currentDays = current && current.cobertura !== 'unknown' ? duration(current) : null;
    const currentEconomy = current
        ? economyForInterval(current, economySegments, now)
        : { valor_estimado: null, cobertura: 'unknown' };
    const cumulativeParts = ordered.map(period => economyForInterval(period, economySegments, now));
    const cumulativeCoverage = combineCoverage(...cumulativeParts.map(item => item.cobertura));
    const cumulativeEconomy = cumulativeCoverage === 'unknown'
        ? null
        : Math.round((cumulativeParts.reduce((sum, item) => sum + (item.valor_estimado || 0), 0) + Number.EPSILON) * 100) / 100;
    const distinctCheckinDays = new Set(records.map(record => String(record.data_registro || '').slice(0, 10)).filter(Boolean));

    return {
        sequencia_atual_dias: currentDays,
        sequencia_atual_cobertura: current?.cobertura || 'unknown',
        recorde_dias: recordCoverage === 'unknown' || !knownDurations.length ? null : Math.max(...knownDurations),
        recorde_cobertura: recordCoverage,
        dias_checkin: distinctCheckinDays.size,
        economia_sequencia: currentEconomy,
        economia_acumulada: { valor_estimado: cumulativeEconomy, cobertura: cumulativeCoverage },
        marcos: awards.map(award => ({
            id: award.id,
            categoria: award.categoria,
            valor_alvo: Number(award.valor_alvo),
            awarded_at: award.awarded_at,
            origem: award.origem,
            cobertura: award.cobertura,
        })),
    };
}

function observedAwards({ usuarioId, vicioId, periods = [], economySegments = [], now = new Date() }) {
    const result = [];
    const timestampNow = now.toISOString();
    const streakThresholds = [1, 7, 30, 90, 180, 365];
    const savingsThresholds = [50, 100, 500, 1000];

    for (const period of periods) {
        const days = completeDays(period.started_at, periodEnd(period, now));
        if (days == null || period.cobertura === 'unknown') continue;
        for (const threshold of streakThresholds.filter(value => value <= days)) {
            const confirmed = period.cobertura === 'confirmed';
            result.push({
                usuario_id: usuarioId,
                vicio_id: vicioId,
                categoria: 'streak',
                valor_alvo: threshold,
                awarded_at: confirmed ? new Date((timestamp(period.started_at) || 0) + threshold * DAY_MS).toISOString() : timestampNow,
                origem: confirmed ? 'period_threshold' : 'snapshot_observation',
                cobertura: period.cobertura,
            });
        }
        const economy = economyForInterval(period, economySegments, now);
        if (economy.valor_estimado == null) continue;
        for (const threshold of savingsThresholds.filter(value => value <= economy.valor_estimado)) {
            result.push({
                usuario_id: usuarioId,
                vicio_id: vicioId,
                categoria: 'savings',
                valor_alvo: threshold,
                awarded_at: timestampNow,
                origem: 'snapshot_observation',
                cobertura: combineCoverage(period.cobertura, economy.cobertura),
            });
        }
    }
    return result;
}

function observedAccountAwards({ usuarioId, periods = [], economySegments = [], records = [], goals = [], now = new Date() }) {
    const result = [];
    const timestampNow = now.toISOString();
    const byHabit = new Map();
    for (const period of periods) {
        const list = byHabit.get(period.vicio_id) || [];
        list.push(period);
        byHabit.set(period.vicio_id, list);
    }
    const streakCandidates = [...byHabit.values()].flatMap(habitPeriods => habitPeriods.map(period => ({
        period,
        days: period.cobertura === 'unknown' ? null : completeDays(period.started_at, periodEnd(period, now)),
    }))).filter(candidate => candidate.days != null);
    for (const threshold of [1, 7, 30, 90, 180, 365]) {
        const candidate = streakCandidates
            .filter(item => item.days >= threshold)
            .sort((a, b) => Number(b.period.cobertura === 'confirmed') - Number(a.period.cobertura === 'confirmed')
                || b.days - a.days
                || String(a.period.id).localeCompare(String(b.period.id)))[0];
        if (!candidate) continue;
        const confirmed = candidate.period.cobertura === 'confirmed';
        result.push({
            usuario_id: usuarioId,
            vicio_id: null,
            categoria: 'streak',
            valor_alvo: threshold,
            awarded_at: confirmed
                ? new Date((timestamp(candidate.period.started_at) || 0) + threshold * DAY_MS).toISOString()
                : timestampNow,
            origem: confirmed ? 'period_threshold' : 'snapshot_observation',
            cobertura: candidate.period.cobertura,
        });
    }

    let accumulated = 0;
    let savingsCoverage = 'confirmed';
    for (const [vicioId, habitPeriods] of byHabit) {
        const habitSegments = economySegments.filter(segment => segment.vicio_id === vicioId);
        for (const period of habitPeriods) {
            const economy = economyForInterval(period, habitSegments, now);
            if (economy.valor_estimado == null) savingsCoverage = 'unknown';
            else accumulated += economy.valor_estimado;
            savingsCoverage = combineCoverage(savingsCoverage, period.cobertura, economy.cobertura);
        }
    }
    if (savingsCoverage !== 'unknown') {
        for (const threshold of [50, 100, 500, 1000].filter(value => value <= accumulated)) {
            result.push({
                usuario_id: usuarioId,
                vicio_id: null,
                categoria: 'savings',
                valor_alvo: threshold,
                awarded_at: timestampNow,
                origem: 'snapshot_observation',
                cobertura: savingsCoverage,
            });
        }
    }

    const completedGoals = goals.filter(goal => goal.concluida === true).length;
    for (const threshold of [1, 5, 10].filter(value => value <= completedGoals)) {
        result.push({
            usuario_id: usuarioId, vicio_id: null, categoria: 'goals', valor_alvo: threshold,
            awarded_at: timestampNow, origem: 'snapshot_observation', cobertura: 'confirmed',
        });
    }
    const checkinDays = new Set(records.map(record => String(record.data_registro || '').slice(0, 10)).filter(Boolean)).size;
    for (const threshold of [7, 30].filter(value => value <= checkinDays)) {
        result.push({
            usuario_id: usuarioId, vicio_id: null, categoria: 'consistency', valor_alvo: threshold,
            awarded_at: timestampNow, origem: 'snapshot_observation', cobertura: 'confirmed',
        });
    }
    return result;
}

module.exports = {
    DAY_MS, buildProgressSnapshot, completeDays, economyForInterval,
    observedAccountAwards, observedAwards, timestamp,
};
