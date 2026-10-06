const nodemailer = require('nodemailer');

// Production requires an authenticated TLS SMTP provider. No console/file mailer.
function createRecoveryEmail(env = process.env) {
    const port = Number(env.SMTP_PORT || 587);
    const secure = env.SMTP_SECURE === 'true';
    const local = ['127.0.0.1', 'localhost'].includes(env.SMTP_HOST);
    const configured = Boolean(env.SMTP_HOST && env.RECOVERY_EMAIL_FROM
        && Number.isInteger(port) && port > 0 && port <= 65535
        && (env.NODE_ENV !== 'production' || (env.SMTP_USER && env.SMTP_PASSWORD && !local)));
    return {
        configured,
        async send({ email, code, requestId }) {
            if (!configured) throw new Error('EMAIL_NOT_CONFIGURED');
            const transport = nodemailer.createTransport({
                host: env.SMTP_HOST, port, secure,
                requireTLS: !local || env.NODE_ENV === 'production',
                ...(env.SMTP_USER && { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }),
                connectionTimeout: 2000, greetingTimeout: 2000, socketTimeout: 2000,
                logger: false, debug: false,
                disableFileAccess: true, disableUrlAccess: true,
            });
            let timer;
            try {
                await Promise.race([
                    transport.sendMail({
                        from: env.RECOVERY_EMAIL_FROM, to: email,
                        subject: 'Código de recuperação do Revive',
                        text: `Seu código de recuperação do Revive é ${code}.\nEle expira em 10 minutos e pode ser usado uma vez.\nSe você não pediu a recuperação, ignore esta mensagem.`,
                        headers: { 'X-Revive-Recovery-Request': requestId },
                    }).then(result => {
                        if (!result.accepted?.length || result.rejected?.length) throw new Error('EMAIL_REJECTED');
                    }),
                    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('EMAIL_UNAVAILABLE')), 2500); }),
                ]);
            } finally { clearTimeout(timer); transport.close(); }
        },
    };
}
module.exports = { createRecoveryEmail };
