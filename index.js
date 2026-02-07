// ====================================
// REVIVE API - Node.js + Express + Supabase
// ====================================

// Instalação de dependências necessárias:
// npm install express @supabase/supabase-js bcrypt jsonwebtoken dotenv cors

require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuarioId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ erro: 'Token inválido' });
    }
};

// ====================================
// ROTAS DE AUTENTICAÇÃO
// ====================================

// Cadastro de usuário
app.post('/api/auth/cadastro', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        
        // Validações
        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
        }
        
        if (senha.length < 6) {
            return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
        }
        
        if (!/[A-Z]/.test(senha)) {
            return res.status(400).json({ erro: 'Senha deve conter pelo menos uma letra maiúscula' });
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
            return res.status(400).json({ erro: 'Senha deve conter pelo menos um caractere especial' });
        }
        
        // Verificar se email já existe
        const { data: usuarioExistente } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .single();
        
        if (usuarioExistente) {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        
        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);
        
        // Inserir usuário
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ nome, email, senha_hash: senhaHash }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json({ 
            mensagem: 'Usuário cadastrado com sucesso',
            usuario: { id: data.id, nome: data.nome, email: data.email }
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao cadastrar usuário', detalhes: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
        }
        
        // Buscar usuário
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error || !usuario) {
            return res.status(401).json({ erro: 'Credenciais inválidas' });
        }
        
        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        
        if (!senhaValida) {
            return res.status(401).json({ erro: 'Credenciais inválidas' });
        }
        
        // Gerar token JWT
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
        res.status(500).json({ erro: 'Erro ao fazer login', detalhes: error.message });
    }
});

// ====================================
// ROTAS DE VÍCIOS/ABSTINÊNCIAS
// ====================================

// Listar vícios do usuário
app.get('/api/vicios', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vicios')
            .select('*')
            .eq('usuario_id', req.usuarioId)
            .eq('ativo', true)
            .order('data_criacao', { ascending: false });
        
        if (error) throw error;
        
        // Calcular estatísticas para cada vício
        const viciosComEstatisticas = data.map(vicio => {
            const dataBase = vicio.data_ultima_recaida || vicio.data_inicio;
            const diasAbstinencia = Math.floor((new Date() - new Date(dataBase)) / (1000 * 60 * 60 * 24));
            const valorEconomizado = diasAbstinencia * parseFloat(vicio.valor_economizado_por_dia);
            
            return {
                ...vicio,
                dias_abstinencia: diasAbstinencia,
                valor_economizado: valorEconomizado.toFixed(2)
            };
        });
        
        res.json({ vicios: viciosComEstatisticas });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar vícios', detalhes: error.message });
    }
});

// Criar novo vício
app.post('/api/vicios', authMiddleware, async (req, res) => {
    try {
        const { nome_vicio, data_inicio, valor_economizado_por_dia } = req.body;
        
        if (!nome_vicio || !data_inicio) {
            return res.status(400).json({ erro: 'Nome do vício e data de início são obrigatórios' });
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
            mensagem: 'Vício registrado com sucesso',
            vicio: data
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao registrar vício', detalhes: error.message });
    }
});

// Buscar vício específico com estatísticas
app.get('/api/vicios/:id', authMiddleware, async (req, res) => {
    try {
        const { data: vicio, error } = await supabase
            .from('vicios')
            .select('*')
            .eq('id', req.params.id)
            .eq('usuario_id', req.usuarioId)
            .single();
        
        if (error || !vicio) {
            return res.status(404).json({ erro: 'Vício não encontrado' });
        }
        
        const dataBase = vicio.data_ultima_recaida || vicio.data_inicio;
        const diasAbstinencia = Math.floor((new Date() - new Date(dataBase)) / (1000 * 60 * 60 * 24));
        const valorEconomizado = diasAbstinencia * parseFloat(vicio.valor_economizado_por_dia);
        
        res.json({
            vicio: {
                ...vicio,
                dias_abstinencia: diasAbstinencia,
                valor_economizado: valorEconomizado.toFixed(2),
                tempo_formatado: formatarTempo(diasAbstinencia)
            }
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar vício', detalhes: error.message });
    }
});

// Registrar recaída
app.post('/api/vicios/:id/recaida', authMiddleware, async (req, res) => {
    try {
        const { motivo, resetarContador } = req.body;
        
        // Buscar vício
        const { data: vicio, error: vicioError } = await supabase
            .from('vicios')
            .select('*')
            .eq('id', req.params.id)
            .eq('usuario_id', req.usuarioId)
            .single();
        
        if (vicioError || !vicio) {
            return res.status(404).json({ erro: 'Vício não encontrado' });
        }
        
        const dataBase = vicio.data_ultima_recaida || vicio.data_inicio;
        const diasAbstinencia = Math.floor((new Date() - new Date(dataBase)) / (1000 * 60 * 60 * 24));
        
        // Registrar no histórico
        const { data: recaidaRegistrada, error: recaidaError } = await supabase.from('historico_recaidas').insert([{
            vicio_id: req.params.id,
            data_recaida: new Date().toISOString(),
            motivo,
            dias_abstinencia_perdidos: diasAbstinencia
        }]).select().single();
        
        if (recaidaError) throw recaidaError;
        
        // Opcionalmente resetar o contador (apenas se explicitamente solicitado)
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
            mensagem: 'Recaída registrada. Você pode criar um registro para refletir sobre o que aconteceu.',
            dias_abstinencia_anteriores: diasAbstinencia,
            recaida: recaidaRegistrada,
            vicio: vicioAtualizado
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao excluir vício', detalhes: error.message });
    }
});

// Deletar vício com limpeza de dependências
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
            return res.status(404).json({ erro: 'Vício não encontrado' });
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

        res.json({ mensagem: 'Vício excluído definitivamente com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao excluir vício', detalhes: error.message });
    }
});

// ====================================
// ROTAS DE HISTÓRICO DE RECAÍDAS (NOVO)
// ====================================

app.get('/api/recaidas', authMiddleware, async (req, res) => {
    try {
        // Esta query busca todas as recaídas onde o vicio_id corresponde
        // a um vício que pertence ao usuário autenticado.
        const { data, error } = await supabase
            .from('historico_recaidas')
            .select('*, vicios!inner(usuario_id)')
            .eq('vicios.usuario_id', req.usuarioId);

        if (error) throw error;

        res.json({ recaidas: data });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar histórico de recaídas', detalhes: error.message });
    }
});


// ====================================
// ROTAS DE REGISTROS DIÁRIOS
// ====================================

// Criar registro diário
app.post('/api/registros', authMiddleware, async (req, res) => {
    try {
        const { vicio_id, humor, gatilhos, conquistas, observacoes } = req.body;
        
        if (!vicio_id) {
            return res.status(400).json({ erro: 'ID do vício é obrigatório' });
        }
        
        // Verificar se o vício pertence ao usuário
        const { data: vicio } = await supabase
            .from('vicios')
            .select('id')
            .eq('id', vicio_id)
            .eq('usuario_id', req.usuarioId)
            .single();
        
        if (!vicio) {
            return res.status(403).json({ erro: 'Vício não encontrado ou não pertence ao usuário' });
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
        res.status(500).json({ erro: 'Erro ao criar registro', detalhes: error.message });
    }
});

// Listar registros de um vício
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
        res.status(500).json({ erro: 'Erro ao buscar registros', detalhes: error.message });
    }
});

// ====================================
// ROTAS DE MENSAGENS MOTIVACIONAIS
// ====================================

// Obter mensagem motivacional do dia
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
        
        // Selecionar mensagem aleatória
        const mensagemAleatoria = data[Math.floor(Math.random() * data.length)];
        
        res.json({ mensagem: mensagemAleatoria });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar mensagem', detalhes: error.message });
    }
});

// ====================================
// ROTAS DE METAS
// ====================================

// Criar meta
app.post('/api/metas', authMiddleware, async (req, res) => {
    try {
        const { vicio_id, descricao_meta, dias_objetivo, valor_objetivo } = req.body;
        
        if (!descricao_meta) {
            return res.status(400).json({ erro: 'Descrição da meta é obrigatória' });
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
        res.status(500).json({ erro: 'Erro ao criar meta', detalhes: error.message });
    }
});

// Listar metas do usuário
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
        res.status(500).json({ erro: 'Erro ao buscar metas', detalhes: error.message });
    }
});

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

function formatarTempo(dias) {
    const anos = Math.floor(dias / 365);
    const meses = Math.floor((dias % 365) / 30);
    const diasRestantes = dias % 30;
    
    let resultado = [];
    if (anos > 0) resultado.push(`${anos} ano${anos > 1 ? 's' : ''}`);
    if (meses > 0) resultado.push(`${meses} mes${meses > 1 ? 'es' : ''}`);
    if (diasRestantes > 0) resultado.push(`${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`);
    
    return resultado.join(', ') || '0 dias';
}

// ====================================
// ROTA DE TESTE
// ====================================

app.get('/api/health', (req, res) => {
    res.json({ status: 'API REVIVE está funcionando!', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 API REVIVE rodando na porta ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});