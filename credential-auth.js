const jwt = require('jsonwebtoken');

// Versionless web JWTs remain valid only while the account is at version zero.
function createCredentialAuth({ supabase, jwtSecret }) {
    return async (req, res, next) => {
        const [scheme, token] = (req.get('Authorization') || '').split(' ');
        if (scheme !== 'Bearer' || !token) return res.status(401).json({ erro: 'Token nao fornecido' });
        let claims;
        try {
            claims = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
            if (typeof claims.id !== 'string' || (claims.cv !== undefined && !Number.isSafeInteger(claims.cv))) throw new Error();
        } catch { return res.status(401).json({ erro: 'Token invalido' }); }
        try {
            const { data, error } = await supabase.from('usuarios').select('credential_version')
                .eq('id', claims.id).maybeSingle();
            if (error) throw new Error();
            if (!data || Number(data.credential_version) !== (claims.cv ?? 0)) return res.status(401).json({ erro: 'Sessao encerrada. Entre novamente.' });
            // Mobile access tokens used against compatibility routes must still
            // honor server-side revocation. A refresh token is never a JWT.
            if (claims.sid || claims.token_type) {
                if (!claims.sid || claims.token_type !== 'access') return res.status(401).json({ erro: 'Token invalido' });
                const session = await supabase.from('app_sessions').select('id').eq('id', claims.sid)
                    .eq('usuario_id', claims.id).is('revoked_at', null).gt('expires_at', new Date().toISOString()).maybeSingle();
                if (session.error) throw new Error();
                if (!session.data) return res.status(401).json({ erro: 'Sessao encerrada. Entre novamente.' });
            }
            req.usuarioId = claims.id;
            return next();
        } catch { return res.status(503).json({ erro: 'Nao foi possivel validar a sessao.' }); }
    };
}
module.exports = { createCredentialAuth };
