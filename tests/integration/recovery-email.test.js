const nodemailer = require('nodemailer');
const { createRecoveryEmail } = require('../../recovery-email');

const message = { email: 'synthetic@example.invalid', code: '12345678', requestId: 'synthetic-request' };
const env = { SMTP_HOST: 'smtp.example.invalid', SMTP_USER: 'synthetic', SMTP_PASSWORD: 'synthetic', RECOVERY_EMAIL_FROM: 'noreply@example.invalid', NODE_ENV: 'production' };
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

it('rejects missing and local unauthenticated production transport without attempting delivery', async () => {
    const create = vi.spyOn(nodemailer, 'createTransport');
    for (const settings of [{}, { ...env, SMTP_PASSWORD: '' }, { ...env, SMTP_HOST: 'localhost' }]) {
        const adapter = createRecoveryEmail(settings);
        expect(adapter.configured).toBe(false);
        await expect(adapter.send(message)).rejects.toThrow('EMAIL_NOT_CONFIGURED');
    }
    expect(create).not.toHaveBeenCalled();
});
it('requires encrypted external SMTP and closes the transport after acceptance', async () => {
    const transport = { sendMail: vi.fn().mockResolvedValue({ accepted: [message.email], rejected: [] }), close: vi.fn() };
    const create = vi.spyOn(nodemailer, 'createTransport').mockReturnValue(transport);
    await createRecoveryEmail(env).send(message);
    expect(create.mock.calls[0][0]).toEqual(expect.objectContaining({ requireTLS: true, logger: false, debug: false }));
    expect(transport.close).toHaveBeenCalledOnce();
});
it('treats recipient rejection as a delivery failure', async () => {
    const transport = { sendMail: vi.fn().mockResolvedValue({ accepted: [], rejected: [message.email] }), close: vi.fn() };
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue(transport);
    await expect(createRecoveryEmail(env).send(message)).rejects.toThrow('EMAIL_REJECTED');
    expect(transport.close).toHaveBeenCalledOnce();
});
it('bounds a stalled SMTP send and closes the connection', async () => {
    vi.useFakeTimers();
    const transport = { sendMail: vi.fn(() => new Promise(() => {})), close: vi.fn() };
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue(transport);
    const result = expect(createRecoveryEmail(env).send(message)).rejects.toThrow('EMAIL_UNAVAILABLE');
    await vi.advanceTimersByTimeAsync(2500);
    await result;
    expect(transport.close).toHaveBeenCalledOnce();
});
