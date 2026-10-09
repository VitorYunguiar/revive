const nodemailer = require('nodemailer');
const net = require('node:net');
const dns = require('node:dns');
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

it('closes a real stalled SMTP connection before a late greeting can send mail', async () => {
    let peer;
    let received = '';
    let closed;
    const disconnected = new Promise(resolve => { closed = resolve; });
    const server = net.createServer(socket => {
        peer = socket;
        socket.on('data', bytes => { received += bytes.toString(); });
        socket.once('close', closed);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        const started = Date.now();
        await expect(createRecoveryEmail({ NODE_ENV: 'test', SMTP_HOST: '127.0.0.1', SMTP_PORT: String(server.address().port), RECOVERY_EMAIL_FROM: 'synthetic@example.invalid' }).send(message)).rejects.toThrow();
        await disconnected;
        expect(Date.now() - started).toBeLessThan(2800);
        expect(received).toBe('');
        expect(peer.destroyed).toBe(true);
    } finally { peer?.destroy(); await new Promise(resolve => server.close(resolve)); }
});

it('aborts slow DNS so resolving after the deadline never opens an SMTP connection', async () => {
    let connected = 0;
    const server = net.createServer(socket => { connected++; socket.destroy(); });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let completeLookup;
    vi.spyOn(dns, 'lookup').mockImplementation((_host, options, callback) => {
        completeLookup = () => callback(null, options.all ? [{ address: '127.0.0.1', family: 4 }] : '127.0.0.1', 4);
    });
    try {
        const started = Date.now();
        await expect(createRecoveryEmail({ NODE_ENV: 'test', SMTP_HOST: 'smtp-late.example.invalid', SMTP_PORT: String(server.address().port), RECOVERY_EMAIL_FROM: 'synthetic@example.invalid' }).send(message)).rejects.toThrow();
        expect(Date.now() - started).toBeLessThan(2800);
        expect(completeLookup).toBeTypeOf('function');
        completeLookup();
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(connected).toBe(0);
    } finally { await new Promise(resolve => server.close(resolve)); }
});
