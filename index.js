require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const MS_PER_DAY = 86_400_000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use(morgan('combined'));

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'REVIVE API',
            version: '1.0.0',
            description: 'API RESTful da plataforma REVIVE.'
        },
        servers: [{ url: `http://localhost:${PORT}` }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: [
        path.join(__dirname, 'docs', 'openapi.js')
    ]
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { erro: 'Muitas tentativas de autenticacao. Tente novamente em 15 minutos.' }
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: { erro: 'Limite de requisicoes excedido. Tente novamente em 1 minuto.' }
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ erro: 'Token nao fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuarioId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ erro: 'Token invalido' });
    }
};

function sanitize(str) {
    if (!str) return str;
    return String(str).trim();
}

function logInternalError(context, error) {
    console.error(`[${new Date().toISOString()}] ${context}`, {
        message: error?.message,
        stack: error?.stack
    });
}

function sendInternalError(res, userMessage, error) {
    logInternalError(userMessage, error);

    const payload = { erro: userMessage };
    if (!isProduction) {
        payload.detalhes = error?.message;
    }

    return res.status(500).json(payload);
}

app.post('/api/auth/cadastro', async (req, res) => {
    try {
        const nome = sanitize(req.body.nome);
        const email = sanitize(req.body.email);
        const { senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Todos os campos sao obrigatorios' });
        }

        if (senha.length < 6) {
            return res.status(400).json({ erro: 'Senha deve ter no minimo 6 caracteres' });
        }

        if (!/[A-Z]/.test(senha)) {
            return res.status(400).json({ erro: 'Senha deve conter pelo menos uma letra maiuscula' });
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
            return res.status(400).json({ erro: 'Senha deve conter pelo menos um caractere especial' });
        }

        const { data: usuarioExistente } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();

        if (usuarioExistente) {
            return res.status(400).json({ erro: 'Email ja cadastrado' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ nome, email, senha_hash: senhaHash }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            mensagem: 'Usuario cadastrado com sucesso',
            usuario: { id: data.id, nome: data.nome, email: data.email }
        });
    } catch (error) {
        return sendInternalError(res, 'Erro ao cadastrar usuario', error);
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const email = sanitize(req.body.email);
        const { senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha sao obrigatorios' });
        }

        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !usuario) {
            return res.status(401).json({ erro: 'Credenciais invalidas' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ erro: 'Credenciais invalidas' });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            mensagem: 'Login realizado com sucesso',
            token,
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
        });
    } catch (error) {
        return sendInternalError(res, 'Erro ao fazer login', error);
    }
});

app.get('/api/me', authMiddleware, async (req, res) => {
    try {
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('id, nome, email')
            .eq('id', req.usuarioId)
            .single();

        if (error || !usuario) {
            return res.status(404).json({ erro: 'Usuario nao encontrado' });
        }

        res.json({ usuario });
    } catch (error) {
        return sendInternalError(res, 'Erro ao buscar perfil', error);
    }
});

app.patch('/api/me', authMiddleware, async (req, res) => {
    try {
        const nome = sanitize(req.body.nome);

        if (!nome) {
            return res.status(400).json({ erro: 'Nome e obrigatorio' });
        }

        const { data, error } = await supabase
            .from('usuarios')
            .update({ nome })
            .eq('id', req.usuarioId)
            .select('id, nome, email')
            .single();

        if (error) throw error;

        res.json({ mensagem: 'Perfil atualizado', usuario: data });
    } catch (error) {
        return sendInternalError(res, 'Erro ao atualizar perfil', error);
    }
});

app.get('/api/vicios', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vicios')
            .select('*')
            .eq('usuario_id', req.usuarioId)
            .eq('ativo', true)
            .order('data_criacao', { ascending: false });

        if (error) throw error;

        const viciosComEstatisticas = data.map(vicio => {
            const stats = calculateAddictionStats(vicio);

            return {
                ...vicio,
                dias_abstinencia: stats.abstinenceDays,
                valor_economizado: stats.savedAmount.toFixed(2),
                tempo_formatado: stats.formattedDuration
            };
        });

        res.json({ vicios: viciosComEstatisticas });
    } catch (error) {
        return sendInternalError(res, 'Erro ao buscar vicios', error);
    }
});

app.post('/api/vicios', authMiddleware, async (req, res) => {
    try {
        const nome_vicio = sanitize(req.body.nome_vicio);
        const { data_inicio, valor_economizado_por_dia } = req.body;

        if (!nome_vicio || !data_inicio) {
            return res.status(400).json({ erro: 'Nome do vicio e data de inicio sao obrigatorios' });
        }

        const { data, error } = await supabase
            .from('vicios')
            .insert([{
                usuario_id: req.usuarioId,
                nome_vicio,
                data_inicio,
                valor_economizado_por_dia: valor_economizado_por_dia || 0
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            mensagem: 'Vicio registrado com sucesso',
            vicio: data
        });
    } catch (error) {
        return sendInternalError(res, 'Erro ao registrar vicio', error);
    }
});

app.get('/api/vicios/:id', authMiddleware, async (req, res) => {
    try {
        const { data: vicio, error } = await supabase
            .from('vicios')
            .select('*')
            .eq('id', req.params.id)
            .eq('usuario_id', req.usuarioId)
            .single();

        if (error || !vicio) {
            return res.status(404).json({ erro: 'Vicio nao encontrado' });
        }

        const stats = calculateAddictionStats(vicio);

        res.json({
            vicio: {
                ...vicio,
                dias_abstinencia: stats.abstinenceDays,
                valor_economizado: stats.savedAmount.toFixed(2),
                tempo_formatado: stats.formattedDuration
            }
        });
    } catch (error) {
        return sendInternalError(res, 'Erro ao buscar vicio', error);
    }
});

app.post('/api/vicios/:id/recaida', authMiddleware, async (req, res) => {
    try {
        const motivo = sanitize(req.body.motivo);
        const { resetarContador } = req.body;

        const { data: vicio, error: vicioError } = await supabase
            .from('vicios')
            .select('*')
            .eq('id', req.params.id)
            .eq('usuario_id', req.usuarioId)
            .single();

        if (vicioError || !vicio) {
            return res.status(404).json({ erro: 'Vicio nao encontrado' });
        }

        const dataBase = vicio.data_ultima_recaida || vicio.data_inicio;
        const diasAbstinencia = Math.floor((new Date() - new Date(dataBase)) / MS_PER_DAY);

        const { data: recaidaRegistrada, error: recaidaError } = await supabase.from('historico_recaidas').insert([{
            vicio_id: req.params.id,
            data_recaida: new Date().toISOString(),
            motivo,
            dias_abstinencia_perdidos: diasAbstinencia
        }]).select().single();

        if (recaidaError) throw recaidaError;

        let vicioAtualizado = vicio;
        if (resetarContador) {
            const { data: updated, error: updateError } = await supabase
                .from('vicios')
                .update({ data_ultima_recaida: new Date().toISOString() })
                .eq('id', req.params.id)
                .select()
                .single();

            if (updateError) throw updateError;
            vicioAtualizado = updated;
        }

        res.json({
            mensagem: 'Recaida registrada.',
            dias_abstinencia_anteriores: diasAbstinencia,
            recaida: recaidaRegistrada,
            vicio: vicioAtualizado
        });
    } catch (error) {
        return sendInternalError(res, 'Erro ao registrar recaida', error);
    }
});

// Cascade-deletes dependent records before removing the addiction
app.delete('/api/vicios/:id', authMiddleware, async (req, res) => {
    try {
        const vicioId = req.params.id;

        const { data: vicio, error: vicioError } = await supabase
            .from('vicios')
            .select('id')
            .eq('id', vicioId)
            .eq('usuario_id', req.usuarioId)
            .single();

        if (vicioError || !vicio) {
            return res.status(404).json({ erro: 'Vicio nao encontrado' });
        }

        const dependentTables = ['registros_diarios', 'historico_recaidas', 'metas'];
        for (const table of dependentTables) {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('vicio_id', vicioId);
            if (error) throw error;
        }

        const { error: deleteError } = await supabase
            .from('vicios')
            .delete()
            .eq('id', vicioId)
            .eq('usuario_id', req.usuarioId);

        if (deleteError) throw deleteError;

        res.json({ mensagem: 'Vicio excluido definitivamente com sucesso' });
    } catch (error) {
        return sendInternalError(res, 'Erro ao excluir vicio', error);
    }
});

app.get('/api/recaidas', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('historico_recaidas')
            .select('*, vicios!inner(usuario_id)')
            .eq('vicios.usuario_id', req.usuarioId);

        if (error) throw error;

        res.json({ recaidas: data });
    } catch (error) {
        return sendInternalError(res, 'Erro ao buscar historico de recaidas', error);
    }
});

app.post('/api/registros', authMiddleware, async (req, res) => {
    try {
        const { vicio_id } = req.body;
        const humor = sanitize(req.body.humor);
        const gatilhos = sanitize(req.body.gatilhos);
        const conquistas = sanitize(req.body.conquistas);
        const observacoes = sanitize(req.body.observacoes);

        if (!vicio_id) {
            return res.status(400).json({ erro: 'ID do vicio e obrigatorio' });
        }

        const { data: vicio } = await supabase
            .from('vicios')
            .select('id')
            .eq('id', vicio_id)
            .eq('usuario_id', req.usuarioId)
            .single();

        if (!vicio) {
            return res.status(403).json({ erro: 'Vicio nao encontrado ou nao pertence ao usuario' });
        }

        const { data, error } = await supabase
            .from('registros_diarios')
            .insert([{
                vicio_id,
                data_registro: new Date().toISOString().split('T')[0],
                humor,
                gatilhos,
                conquistas,
                observacoes
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            mensagem: 'Registro criado com sucesso',
            registro: data
        });
    } catch (error) {
        return sendInternalError(res, 'Erro ao criar registro', error);
    }
});

app.get('/api/vicios/:id/registros', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('registros_diarios')
            .select('*, vicios!inner(usuario_id)')
            .eq('vicio_id', req.params.id)
            .eq('vicios.usuario_id', req.usuarioId)
            .order('data_registro', { ascending: false });

        if (error) throw error;

        res.json({ registros: data });
    } catch (error) {
        return sendInternalError(res, 'Erro ao buscar registros', error);
    }
});

app.get('/api/mensagens/diaria', authMiddleware, async (req, res) => {
    try {
        const { tipo_vicio } = req.query;

        let query = supabase
            .from('mensagens_motivacionais')
            .select('*')
            .eq('ativa', true);

        if (tipo_vicio) {
            query = query.or(`tipo_vicio.eq.${tipo_vicio},tipo_vicio.eq.geral`);
        }

        const { data, error } = await query;

        if (error) throw error;

        const mensagemAleatoria = data[Math.floor(Math.random() * data.length)];

        res.json({ mensagem: mensagemAleatoria });
    } catch (error) {
        return sendInternalError(res, 'Erro ao buscar mensagem', error);
    }
});

app.post('/api/metas', authMiddleware, async (req, res) => {
    try {
        const descricao_meta = sanitize(req.body.descricao_meta);
        const { vicio_id, dias_objetivo, valor_objetivo } = req.body;

        if (!descricao_meta) {
            return res.status(400).json({ erro: 'Descricao da meta e obrigatoria' });
        }

        const { data, error } = await supabase
            .from('metas')
            .insert([{
                usuario_id: req.usuarioId,
                vicio_id,
                descricao_meta,
                dias_objetivo,
                valor_objetivo
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            mensagem: 'Meta criada com sucesso',
            meta: data
        });
    } catch (error) {
        return sendInternalError(res, 'Erro ao criar meta', error);
    }
});

app.get('/api/metas', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('metas')
            .select('*, vicios(nome_vicio)')
            .eq('usuario_id', req.usuarioId)
            .order('data_criacao', { ascending: false });

        if (error) throw error;

        res.json({ metas: data });
    } catch (error) {
        return sendInternalError(res, 'Erro ao buscar metas', error);
    }
});

// PATCH only toggles the `concluida` flag
app.patch('/api/metas/:id', authMiddleware, async (req, res) => {
    try {
        const { concluida } = req.body;

        const { data: meta, error: metaError } = await supabase
            .from('metas')
            .select('id')
            .eq('id', req.params.id)
            .eq('usuario_id', req.usuarioId)
            .single();

        if (metaError || !meta) {
            return res.status(404).json({ erro: 'Meta nao encontrada' });
        }

        const { data, error } = await supabase
            .from('metas')
            .update({ concluida })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ mensagem: 'Meta atualizada com sucesso', meta: data });
    } catch (error) {
        return sendInternalError(res, 'Erro ao atualizar meta', error);
    }
});

app.delete('/api/metas/:id', authMiddleware, async (req, res) => {
    try {
        const { data: meta, error: metaError } = await supabase
            .from('metas')
            .select('id')
            .eq('id', req.params.id)
            .eq('usuario_id', req.usuarioId)
            .single();

        if (metaError || !meta) {
            return res.status(404).json({ erro: 'Meta nao encontrada' });
        }

        const { error } = await supabase
            .from('metas')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ mensagem: 'Meta excluida com sucesso' });
    } catch (error) {
        return sendInternalError(res, 'Erro ao excluir meta', error);
    }
});

function formatDuration(days) {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;

    const result = [];
    if (years > 0) result.push(`${years} ano${years > 1 ? 's' : ''}`);
    if (months > 0) result.push(`${months} mes${months > 1 ? 'es' : ''}`);
    if (remainingDays > 0) result.push(`${remainingDays} dia${remainingDays > 1 ? 's' : ''}`);

    return result.join(', ') || '0 dias';
}

function calculateAddictionStats(addiction) {
    const baseDate = addiction.data_ultima_recaida || addiction.data_inicio;
    const abstinenceDays = Math.max(
        0,
        Math.floor((new Date() - new Date(baseDate)) / MS_PER_DAY)
    );
    const savedAmount = abstinenceDays * parseFloat(addiction.valor_economizado_por_dia || 0);

    return {
        abstinenceDays,
        savedAmount,
        formattedDuration: formatDuration(abstinenceDays)
    };
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'API REVIVE esta funcionando!', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`API REVIVE rodando na porta ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
        console.log(`API docs: http://localhost:${PORT}/api/docs`);
    });
}

module.exports = {
    app,
    sanitize,
    formatDuration,
    calculateAddictionStats
};
