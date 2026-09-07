const { ACCESS_TOKEN_TTL_SECONDS, tokenHash } = require('../../mobile-api');

describe('mobile session primitives', () => {
    it('uses 15 minute access tokens', () => {
        expect(ACCESS_TOKEN_TTL_SECONDS).toBe(900);
    });

    it('stores only a deterministic SHA-256 refresh-token hash', () => {
        const raw = 'refresh-token-that-must-not-be-stored';
        const hash = tokenHash(raw);
        expect(hash).toHaveLength(64);
        expect(hash).not.toContain(raw);
        expect(hash).toBe(tokenHash(raw));
    });
});
