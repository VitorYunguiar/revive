import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus, Trash2, TrendingUp, DollarSign, Calendar, AlertCircle, CheckCircle, X, LogOut, User, BarChart3, Target, BookOpen, PieChart, Repeat, Star, Clock, Flame, ChevronDown } from 'lucide-react';
import NovoVicioWizard from './NovoVicioWizard';
import RecaidaModal from './RecaidaModal';
import MetasCard from './MetasCard';

// Boa Prática: Centralizar a URL da API em uma constante para fácil manutenção.
const API_BASE = 'http://localhost:3000/api';

const navButtonMotion = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.98 }
};

const cardMotion = {
  whileHover: { y: -6, boxShadow: '0 35px 80px rgba(15, 20, 40, 0.55)' },
  transition: { type: 'spring', stiffness: 260, damping: 25 }
};

const accentButtonMotion = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.98 }
};

const glassSurface = 'bg-slate-900/80 border border-slate-700/60 shadow-[0_20px_40px_rgba(2,6,23,0.4)]';
const glassMutedSurface = 'bg-slate-900/60 border border-slate-700/40';
const fieldBase = 'w-full px-4 py-3 rounded-2xl bg-slate-900/70 border border-slate-700/50 text-white placeholder-white/50 focus:border-[#5CC8FF] focus:ring-2 focus:ring-[#5CC8FF]/30 outline-none transition';
const pillBase = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border';

// ====================================
// COMPONENTES DE UI REUTILIZÁVEIS
// ====================================

/**
 * UI/UX: Componente de Alerta.
 * Fornece feedback visual claro e consistente para o usuário sobre o resultado de suas ações.
 * O uso de cores distintas para cada tipo de alerta (success, error, info) é uma prática fundamental de UX.
 */
const Alert = ({ type = 'info', children, onClose }) => {
  const colors = {
    success: 'border-emerald-300/60 bg-emerald-500/10 text-emerald-100',
    error: 'border-rose-300/60 bg-rose-500/10 text-rose-100',
    info: 'border-cyan-300/60 bg-cyan-500/10 text-cyan-100',
    warning: 'border-amber-300/60 bg-amber-500/10 text-amber-100'
  };

  return (
    <div className={`${glassSurface} p-4 rounded-2xl border-l-4 ${colors[type]} flex items-start justify-between mb-4 animate-fade-in`}>
      <div className="flex items-start gap-2">
        {type === 'success' && <CheckCircle className="w-5 h-5 mt-0.5" />}
        {type === 'error' && <AlertCircle className="w-5 h-5 mt-0.5" />}
        <div>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/**
 * UX: Modal de Confirmação.
 * Essencial para ações destrutivas (como exclusão) ou irreversíveis (registrar recaída).
 * Previne erros do usuário ao exigir um passo extra de confirmação.
 */
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${glassSurface} rounded-3xl max-w-md w-full p-6 border border-white/10`}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-white/70 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 transition border border-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-500/80 text-white hover:bg-rose-600 transition border border-rose-300/40"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de Select Customizado em Glassmorphism
const SelectHumor = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  const opcoes = [
    { value: 'excelente', label: '😄 Excelente', emoji: '😄' },
    { value: 'bom', label: '🙂 Bom', emoji: '🙂' },
    { value: 'neutro', label: '😐 Neutro', emoji: '😐' },
    { value: 'ruim', label: '😟 Ruim', emoji: '😟' },
    { value: 'péssimo', label: '😢 Péssimo', emoji: '😢' }
  ];

  const opcaoSelecionada = opcoes.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-left flex items-center justify-between hover:bg-white/20 focus:outline-none focus:border-[#7CF6C4] focus:bg-white/15 transition"
      >
        <span>{opcaoSelecionada ? opcaoSelecionada.label : label}</span>
        <ChevronDown className={`w-5 h-5 text-white/60 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-[#2D3250] border border-white/20 rounded-xl shadow-2xl z-10 overflow-hidden">
          {opcoes.map((opcao) => (
            <button
              key={opcao.value}
              type="button"
              onClick={() => {
                onChange(opcao.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 transition border-b border-white/10 last:border-b-0 ${
                value === opcao.value
                  ? 'bg-[#7CF6C4]/25 text-white'
                  : 'text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              <span className="text-2xl">{opcao.emoji}</span>
              <span className="font-medium">{opcao.label.split(' ').slice(1).join(' ')}</span>
              {value === opcao.value && <CheckCircle className="w-5 h-5 ml-auto text-[#7CF6C4]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de Gráfico de Rosca para o Dashboard
const DonutChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <p className="text-gray-400 flex items-center justify-center h-full">Sem dados de humor para exibir.</p>;

    let accumulated = 0;
    const segments = data.map(item => {
        const percentage = (item.value / total) * 100;
        const startAngle = (accumulated / total) * 360;
        accumulated += item.value;
        const endAngle = (accumulated / total) * 360;

        const largeArcFlag = percentage > 50 ? 1 : 0;

        const startX = 50 + 40 * Math.cos(Math.PI * (startAngle - 90) / 180);
        const startY = 50 + 40 * Math.sin(Math.PI * (startAngle - 90) / 180);
        const endX = 50 + 40 * Math.cos(Math.PI * (endAngle - 90) / 180);
        const endY = 50 + 40 * Math.sin(Math.PI * (endAngle - 90) / 180);

        const pathData = `M ${startX},${startY} A 40,40 0 ${largeArcFlag},1 ${endX},${endY}`;

        return <path key={item.label} d={pathData} fill="none" stroke={item.cor} strokeWidth="12" />;
    });

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4">
            <svg viewBox="0 0 100 100" className="w-36 h-36 md:w-40 md:h-40 transform -rotate-90">
                {segments}
            </svg>
            <div className="space-y-2">
                {data.map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }}></div>
                        <span className="text-sm text-gray-300 capitalize">{item.label} ({Math.round(item.value / total * 100)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Componente para exibir tendência (subida/descida)
const TrendIndicator = ({ trend }) => {
  const isPositive = trend >= 0;
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
      isPositive 
        ? 'bg-emerald-500/20 text-emerald-300' 
        : 'bg-red-500/20 text-red-300'
    }`}>
      <TrendingUp className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`} />
      {isPositive ? '+' : ''}{trend.toFixed(1)}%
    </div>
  );
};


// ====================================
// DASHBOARD DE ANÁLISES (NOVO/MELHORADO)
// ====================================
const AnalyticsDashboard = ({ vicios, metas, registros, recaidas }) => {

    // Lógica para KPIs principais. O uso de `useMemo` otimiza a performance,
    // evitando recálculos desnecessários a cada re-renderização.
    const totalEconomizado = useMemo(() => 
        vicios.reduce((acc, v) => acc + (Number(v.valor_economizado) || 0), 0),
        [vicios]
    );

    const viciosAtivos = useMemo(() => vicios.length, [vicios]);

    const metasConcluidas = useMemo(() =>
        metas.filter(meta => meta.concluida).length,
        [metas]
    );
    
    const diasUltimoRegistro = useMemo(() => {
        if (registros.length === 0) return '-';
        const ultimaData = new Date(registros[registros.length - 1].data_registro);
        const hoje = new Date();
        const diff = Math.floor((hoje - ultimaData) / (1000 * 60 * 60 * 24));
        return diff === 0 ? 'Hoje' : `${diff}d atrás`;
    }, [registros]);

    // Métrica: Taxa de recaída (recaídas / dias de observação)
    const taxaRecaida = useMemo(() => {
        if (recaidas.length === 0) return '0%';
        if (vicios.length === 0) return '0%';
        const diasMedia = vicios.reduce((acc, v) => {
            const inicio = new Date(v.data_inicio);
            const dias = Math.ceil((new Date() - inicio) / (1000 * 60 * 60 * 24)) || 1;
            return acc + dias;
        }, 0) / vicios.length;
        const taxa = (recaidas.length / diasMedia) * 100;
        return `${taxa.toFixed(1)}%`;
    }, [recaidas, vicios]);

    // Métrica: Tendência de recaídas (comparar últimos 30 vs 60 dias)
    const tendenciaRecaidas = useMemo(() => {
        const agora = new Date();
        const _30dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
        const _60dias = new Date(agora.getTime() - 60 * 24 * 60 * 60 * 1000);
        
        const recaidas30 = recaidas.filter(r => new Date(r.data_recaida) >= _30dias).length;
        const recaidas60 = recaidas.filter(r => new Date(r.data_recaida) >= _60dias && new Date(r.data_recaida) < _30dias).length;
        
        if (recaidas60 === 0) return 0;
        return ((recaidas30 - recaidas60) / recaidas60) * 100;
    }, [recaidas]);

    // Métrica: Conquistas recentes para exibição no dashboard.
    const conquistasRecentes = useMemo(() => {
        return registros
            .filter(r => r.conquistas && r.conquistas.trim() !== '')
            .sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro))
            .slice(0, 5)
            .map((r, index) => ({
                id: r.id || index,
                data: new Date(r.data_registro),
                descricao: r.conquistas
            }));
    }, [registros]);

    // Métrica: Distribuição de humor nos últimos 30 dias para o gráfico de rosca.
    const dadosHumor = useMemo(() => {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 30);
        
        const contagem = registros
            .filter(r => new Date(r.data_registro) >= dataLimite)
            .reduce((acc, reg) => {
                if(reg.humor) acc[reg.humor] = (acc[reg.humor] || 0) + 1;
                return acc;
            }, {});

        const cores = { excelente: '#10b981', bom: '#3b82f6', neutro: '#8b5cf6', ruim: '#f59e0b', péssimo: '#ef4444' };
        return Object.entries(contagem).map(([label, value]) => ({ label, value, cor: cores[label] || '#6b7280' }));
    }, [registros]);

    // Métrica: Tempo médio entre recaídas. Lógica complexa que agrupa por vício e calcula a média.
    const tempoMedioRecaidas = useMemo(() => {
        if (recaidas.length < 2) return 'N/A';
        
        const porVicio = recaidas.reduce((acc, r) => {
            if (!acc[r.vicio_id]) acc[r.vicio_id] = [];
            acc[r.vicio_id].push(new Date(r.data_recaida));
            return acc;
        }, {});

        const mediasGerais = [];
        for (const vicioId in porVicio) {
            const datas = porVicio[vicioId].sort((a, b) => a - b);
            if (datas.length < 2) continue;

            for (let i = 1; i < datas.length; i++) {
                const diffDias = (datas[i] - datas[i - 1]) / (1000 * 60 * 60 * 24);
                mediasGerais.push(diffDias);
            }
        }

        if (mediasGerais.length === 0) return 'N/A';
        const mediaFinal = mediasGerais.reduce((a, b) => a + b, 0) / mediasGerais.length;
        return `${mediaFinal.toFixed(1)} dias`;
    }, [recaidas]);

    // Métrica: Top 5 gatilhos que antecedem recaídas.
    const topGatilhosRecaidas = useMemo(() => {
        if (!recaidas.length || !registros.length) return [];
        
        const contagemGatilhos = {};
        recaidas.forEach(recaida => {
            const dataRecaida = new Date(recaida.data_recaida);
            const dataLimite = new Date(dataRecaida);
            dataLimite.setDate(dataRecaida.getDate() - 2); // Analisa registros até 2 dias antes

            registros
                .filter(r => r.vicio_id === recaida.vicio_id && new Date(r.data_registro) >= dataLimite && new Date(r.data_registro) < dataRecaida)
                .forEach(r => {
                    if (!r.gatilhos) return;
                    r.gatilhos.split(',').map(g => g.trim().toLowerCase()).filter(Boolean).forEach(g => {
                        contagemGatilhos[g] = (contagemGatilhos[g] || 0) + 1;
                    });
                });
        });
        return Object.entries(contagemGatilhos).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [registros, recaidas]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Painel de Análises Gerais</h2>

            {/* Design System: Uso de grid para layout responsivo e espaçamento consistente (gap-6). */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard icon={<Heart className="text-emerald-400 w-8 h-8" />} title="Vícios Ativos" value={viciosAtivos} border="emerald"/>
                <KpiCard icon={<DollarSign className="text-cyan-400 w-8 h-8" />} title="Total Economizado" value={`R$ ${totalEconomizado.toFixed(2)}`} border="cyan"/>
                <KpiCard icon={<CheckCircle className="text-yellow-400 w-8 h-8" />} title="Metas Concluídas" value={metasConcluidas} border="yellow"/>
                <KpiCard icon={<Repeat className="text-red-400 w-8 h-8" />} title="Taxa de Recaída" value={taxaRecaida} trend={tendenciaRecaidas} border="red"/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Distribuição de Humor (Últimos 30 dias)"><DonutChart data={dadosHumor} /></Card>
                <div className="space-y-6">
                    <Card title="Último Registro">
                        <div className="flex items-center justify-center h-full">
                            <p className="text-4xl font-bold text-[#7CF6C4] flex items-center gap-3">
                                <Clock className="w-8 h-8"/>
                                {diasUltimoRegistro}
                            </p>
                        </div>
                    </Card>
                    <Card title="Tempo Médio Entre Recaídas">
                        <div className="flex items-center justify-center h-full">
                            <p className="text-3xl font-bold text-purple-300 flex items-center gap-3">
                                <Flame className="w-6 h-6"/>
                                {tempoMedioRecaidas}
                            </p>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Top 5 Gatilhos Correlacionados com Recaídas">
                    {topGatilhosRecaidas.length > 0 ? (
                        <ul className="space-y-2">
                            {topGatilhosRecaidas.map(([gatilho, freq], index) =>(
                                <li key={index} className="flex items-center justify-between text-gray-300 bg-[#1A1D2E] p-3 rounded-lg border border-gray-700">
                                    <span className="capitalize flex items-center gap-2"><Flame className="w-4 h-4 text-red-400"/>{gatilho}</span>
                                    <span className="text-sm text-gray-400">{freq} ocorrências</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-400 flex items-center justify-center h-full">Nenhuma correlação de gatilho encontrada.</p>}
                </Card>

                <Card title="Conquistas Recentes">
                    <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
                        {conquistasRecentes.length > 0 ? conquistasRecentes.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 p-3 bg-[#1A1D2E] rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Star className="w-5 h-5 text-yellow-400"/>
                                </div>
                                <div>
                                    <p className="text-gray-300">{item.descricao}</p>
                                    <p className="text-xs text-gray-500">{item.data.toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>
                        )) : <p className="text-gray-400 flex items-center justify-center h-full">Nenhuma conquista registrada recentemente.</p>}
                    </div>
                </Card>
            </div>

            {/* Nova Seção: Alertas e Insights Personalizados */}
            <div className="grid grid-cols-1 gap-6">
                <Card title="Insights e Recomendações">
                    <div className="space-y-3">
                        {/* Alerta de Engajamento */}
                        {diasUltimoRegistro !== '-' && !diasUltimoRegistro.includes('Hoje') && (
                            <div className="flex items-start gap-3 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-yellow-300 font-semibold">Aumente seu Engajamento</p>
                                    <p className="text-sm text-yellow-200/80">Você não registra há {diasUltimoRegistro}. Reflexões diárias fortalecem a recuperação!</p>
                                </div>
                            </div>
                        )}

                        {/* Alerta de Risco - Tendência de Recaídas */}
                        {tendenciaRecaidas > 0 && (
                            <div className="flex items-start gap-3 p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-red-300 font-semibold">Aumento de Risco Detectado</p>
                                    <p className="text-sm text-red-200/80">Recaídas aumentaram {tendenciaRecaidas.toFixed(0)}% nos últimos 30 dias. Identifique gatilhos e procure apoio.</p>
                                </div>
                            </div>
                        )}

                        {/* Sucesso - Redução de Recaídas */}
                        {tendenciaRecaidas < 0 && recaidas.length > 0 && (
                            <div className="flex items-start gap-3 p-4 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-emerald-300 font-semibold">Você Está Melhorando!</p>
                                    <p className="text-sm text-emerald-200/80">Recaídas diminuíram {Math.abs(tendenciaRecaidas).toFixed(0)}% nos últimos 30 dias. Continue assim!</p>
                                </div>
                            </div>
                        )}

                        {/* Recomendação de Foco em Gatilhos */}
                        {topGatilhosRecaidas.length > 0 && (
                            <div className="flex items-start gap-3 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                                <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-blue-300 font-semibold">Foco em Gatilhos</p>
                                    <p className="text-sm text-blue-200/80">O gatilho "{topGatilhosRecaidas[0][0]}" aparece antes de recaídas. Desenvolva estratégias para lidar com isso.</p>
                                </div>
                            </div>
                        )}

                        {/* Mensagem de Motivação */}
                        {vicios.length > 0 && (
                            <div className="flex items-start gap-3 p-4 bg-purple-500/20 border border-purple-400/30 rounded-lg">
                                <Heart className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-purple-300 font-semibold">Sua Jornada</p>
                                    <p className="text-sm text-purple-200/80">Você já investiu <strong>R$ {totalEconomizado.toFixed(2)}</strong> em sua saúde. Cada dia é uma vitória!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Componentes auxiliares para estética do Dashboard.
const Card = ({ title, subtitle, actions, children }) => (
    <div className={`${glassSurface} rounded-2xl p-6`}>
        <div className="flex items-start justify-between gap-4 mb-4">
            <div>
                {subtitle && <p className="text-[11px] uppercase tracking-[0.28em] text-white/50 mb-1">{subtitle}</p>}
                <h3 className="text-xl font-semibold text-white">{title}</h3>
            </div>
            {actions}
        </div>
        <div>
            {children}
        </div>
    </div>
);

const kpiBorderMap = {
    emerald: 'border-slate-600/70',
    cyan: 'border-slate-600/70',
    yellow: 'border-slate-600/70',
    red: 'border-slate-600/70'
};

const KpiCard = ({ icon, title, value, border, trend }) => (
    <div className={`${glassSurface} rounded-2xl p-5 border-[1.5px] ${kpiBorderMap[border] || 'border-slate-700/60'}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
                {icon}
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">{title}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                </div>
            </div>
            {trend !== undefined && <TrendIndicator trend={trend} />}
        </div>
    </div>
);

const Field = ({ label, hint, children }) => (
    <label className="block space-y-2">
        <span className="text-sm font-semibold text-white/75">{label}</span>
        {children}
        {hint && <span className="text-xs text-white/50">{hint}</span>}
    </label>
);

const InputField = ({ label, hint, className = '', ...props }) => (
    <Field label={label} hint={hint}>
        <input className={`${fieldBase} ${className}`} {...props} />
    </Field>
);

const TextAreaField = ({ label, hint, className = '', ...props }) => (
    <Field label={label} hint={hint}>
        <textarea className={`${fieldBase} ${className}`} {...props} />
    </Field>
);


// ====================================
// COMPONENTE PRINCIPAL DA APLICAÇÃO
// ====================================
export default function ReviveAdmin() {
  // State Hooks
  const [token, setToken] = useState(localStorage.getItem('revive_token') || '');
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [vicios, setVicios] = useState([]);
  const [vicioSelecionado, setVicioSelecionado] = useState(null);
  const [registros, setRegistros] = useState([]); // Registros do vício selecionado
  const [allRegistros, setAllRegistros] = useState([]); // Todos os registros para o dashboard
  const [metas, setMetas] = useState([]);
  const [recaidas, setRecaidas] = useState([]); // Histórico de recaídas para o dashboard
  const [mensagemMotivacional, setMensagemMotivacional] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [recaidaVicio, setRecaidaVicio] = useState(null); // Vício com recaída em progresso
  const [hideHeader, setHideHeader] = useState(false);

  // Estados de Formulário
  const [formLogin, setFormLogin] = useState({ email: '', senha: '' });
  const [formCadastro, setFormCadastro] = useState({ nome: '', email: '', senha: '' });
  const [formVicio, setFormVicio] = useState({ nome_vicio: '', data_inicio: '', valor_economizado_por_dia: '' });
  const [formRegistro, setFormRegistro] = useState({ humor: '', gatilhos: '', conquistas: '', observacoes: '' });
  const [formMeta, setFormMeta] = useState({ descricao_meta: '', dias_objetivo: '', valor_objetivo: '' });

  // Efeito para verificar o token ao carregar a aplicação.
  useEffect(() => {
    if (token) {
      verificarToken();
    }
  }, [token]);

  // Efeito para carregar dados essenciais quando o usuário está logado.
  useEffect(() => {
    if (user) {
      carregarVicios();
      carregarMensagemMotivacional();
      carregarMetas();
      carregarRecaidas();
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setHideHeader(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Efeito para carregar todos os registros de todos os vícios, necessário para o dashboard de análises.
  useEffect(() => {
    const carregarTodosOsRegistros = async () => {
        if(vicios.length > 0) {
            try {
                // Performance: Usa Promise.all para buscar registros em paralelo.
                const promessas = vicios.map(v => apiCall(`/vicios/${v.id}/registros`));
                const resultados = await Promise.all(promessas);
                const todos = resultados.flatMap(res => res.registros || []);
                setAllRegistros(todos);
            } catch (error) {
                console.error("Erro ao carregar todos os registros", error);
                showAlert('error', 'Não foi possível carregar dados para as análises.');
            }
        }
    }
    carregarTodosOsRegistros();
  }, [vicios]); // Roda sempre que a lista de vícios muda.
  
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  /**
   * Boa Prática: Wrapper para chamadas de API.
   * Centraliza a lógica de fetch, tratamento de headers (como o token de autorização)
   * e a gestão de erros, tornando o código mais limpo e fácil de manter.
   */
  const apiCall = async (endpoint, options = {}) => {
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.mensagem || data.erro || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      showAlert('error', error.message || 'Ocorreu um erro na comunicação com o servidor.');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const verificarToken = async () => {
    try {
      // Uma chamada leve para verificar se o token é válido
      const response = await fetch(`${API_BASE}/vicios`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error("Token inválido");
      const data = await response.json();

      setUser({ email: 'Usuário Autenticado' }); // Idealmente, o user viria de um endpoint /me
      setView('dashboard');
    } catch (error) {
      handleLogout(false); // Faz logout sem mostrar alerta de sucesso
    }
  };


  const calcularTempoDecorrido = (dataInicio) => {
    if (!dataInicio) return 'Sem data de início';
    const inicio = new Date(dataInicio);
    const agora = new Date();
    const diffTime = Math.abs(agora - inicio);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Iniciado hoje';
    if (diffDays === 1) return 'Iniciado há 1 dia';
    if (diffDays < 30) return `Iniciado há ${diffDays} dias`;
    if (diffDays < 365) {
      const meses = Math.floor(diffDays / 30);
      return `Iniciado há ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    }
    const anos = Math.floor(diffDays / 365);
    return `Iniciado há ${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  };

  // Funções de Handler para Lógica de Negócio
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await apiCall('/auth/login', { method: 'POST', body: JSON.stringify(formLogin) });
      setToken(data.token);
      localStorage.setItem('revive_token', data.token);
      setUser(data.usuario);
      setView('dashboard');
      showAlert('success', 'Login realizado com sucesso!');
      setFormLogin({ email: '', senha: '' });
    } catch (error) { /* Erro já tratado no apiCall */ }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/auth/cadastro', { method: 'POST', body: JSON.stringify(formCadastro) });
      showAlert('success', 'Cadastro realizado! Faça login para continuar.');
      setView('login');
      setFormCadastro({ nome: '', email: '', senha: '' });
    } catch (error) { /* Erro já tratado no apiCall */ }
  };

  const handleLogout = (showAlertMessage = true) => {
    localStorage.removeItem('revive_token');
    setToken('');
    setUser(null);
    setView('login');
    setVicios([]);
    setVicioSelecionado(null);
    if (showAlertMessage) showAlert('info', 'Logout realizado com sucesso');
  };

  const carregarVicios = async () => {
    try {
      const data = await apiCall('/vicios');
      const viciosProcessados = (data.vicios || []).map(vicio => ({
        ...vicio,
        dias_abstinencia: Math.max(0, vicio.dias_abstinencia || 0),
        valor_economizado: Math.max(0, vicio.valor_economizado || 0),
        tempo_formatado: vicio.tempo_formatado || calcularTempoDecorrido(vicio.data_inicio)
      }));
      setVicios(viciosProcessados);
    } catch (error) { /* Erro já tratado no apiCall */ }
  };

  const carregarDetalhesVicio = async (id) => {
    try {
      const data = await apiCall(`/vicios/${id}`);
      const vicioProcessado = {
        ...data.vicio,
        dias_abstinencia: Math.max(0, data.vicio.dias_abstinencia || 0),
        valor_economizado: Math.max(0, data.vicio.valor_economizado || 0),
        tempo_formatado: data.vicio.tempo_formatado || calcularTempoDecorrido(data.vicio.data_inicio)
      };
      setVicioSelecionado(vicioProcessado);
      
      const regs = await apiCall(`/vicios/${id}/registros`);
      setRegistros(regs.registros || []);
      
      setView('detalhes');
    } catch (error) { /* Erro já tratado no apiCall */ }
  };

  const carregarMetas = async () => {
    try {
      const data = await apiCall('/metas');
      setMetas(data.metas || []);
    } catch (error) { /* Erro já tratado no apiCall */ }
  };
  
  const carregarRecaidas = async () => {
    try {
        const data = await apiCall('/recaidas');
        setRecaidas(data.recaidas || []);
    } catch (error) { console.error("Falha ao buscar recaídas"); }
  }

  const carregarMensagemMotivacional = async () => {
    try {
      const data = await apiCall('/mensagens/diaria?tipo_vicio=geral');
      setMensagemMotivacional(data.mensagem?.mensagem || 'Você está no caminho certo! Continue firme!');
    } catch (error) {
      setMensagemMotivacional('Cada dia é uma vitória! Parabéns pela sua jornada! 💪');
    }
  };

  const handleCriarVicio = async (payload) => {
    try {
      await apiCall('/vicios', { method: 'POST', body: JSON.stringify(payload) });
      showAlert('success', 'Vício criado com sucesso!');
      setFormVicio({ nome_vicio: '', data_inicio: '', valor_economizado_por_dia: '' });
      carregarVicios();
    } catch (error) { /* Erro já tratado no apiCall */ }
  };

  const handleExcluirVicio = (vicio) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir "${vicio.nome_vicio}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false });
        try {
          await apiCall(`/vicios/${vicio.id}`, { method: 'DELETE' });
          showAlert('success', 'Vício excluído com sucesso!');
          carregarVicios();
          if (vicioSelecionado?.id === vicio.id) {
            setView('dashboard');
            setVicioSelecionado(null);
          }
        } catch (error) { /* Erro já tratado no apiCall */ }
      },
      onClose: () => setConfirmModal({ isOpen: false })
    });
  };

  const handleRegistrarRecaida = (vicio) => {
    setRecaidaVicio(vicio);
  };

  const handleRefletirRecaida = async (vicio) => {
    try {
      // Registra a recaída SEM resetar o contador
      await apiCall(`/vicios/${vicio.id}/recaida`, { 
        method: 'POST',
        body: JSON.stringify({ motivo: '', resetarContador: false })
      });
      
      showAlert('success', 'Recaída registrada! Vamos refletir sobre o ocorrido.');
      
      // Fecha o modal
      setRecaidaVicio(null);
      
      // Carrega dados atualizados
      carregarVicios();
      carregarRecaidas();
      if (vicioSelecionado?.id === vicio.id) {
        carregarDetalhesVicio(vicio.id);
        // Scroll para o formulário de registro
        setTimeout(() => {
          document.getElementById('form-registro')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } catch (error) { /* Erro já tratado no apiCall */ }
  };

  const handleResetarRecaida = async (vicio) => {
    try {
      // Registra a recaída E reseta o contador
      await apiCall(`/vicios/${vicio.id}/recaida`, { 
        method: 'POST',
        body: JSON.stringify({ motivo: '', resetarContador: true })
      });
      
      showAlert('success', 'Contador resetado! Um novo capítulo começa. Aprenda e cresça! 💪');
      
      // Fecha o modal
      setRecaidaVicio(null);
      
      // Carrega dados atualizados
      carregarVicios();
      carregarRecaidas();
      if (vicioSelecionado?.id === vicio.id) {
        carregarDetalhesVicio(vicio.id);
      }
    } catch (error) { /* Erro já tratado no apiCall */ }
  };

  const handleCriarRegistro = async (e) => {
    e.preventDefault();
    if (!formRegistro.humor) {
      showAlert('error', 'Selecione um humor antes de salvar');
      return;
    }
    try {
      await apiCall('/registros', { method: 'POST', body: JSON.stringify({ ...formRegistro, vicio_id: vicioSelecionado.id }) });
      showAlert('success', 'Registro diário criado!');
      setFormRegistro({ humor: '', gatilhos: '', conquistas: '', observacoes: '' });
      carregarDetalhesVicio(vicioSelecionado.id);
    } catch (error) { /* Erro já tratado no apiCall */ }
  };

  const handleCriarMeta = async (formMeta) => {
    try {
      await apiCall('/metas', { method: 'POST', body: JSON.stringify(formMeta) });
      showAlert('success', 'Meta criada com sucesso!');
      carregarMetas();
    } catch (error) { /* Erro já tratado no apiCall */ }
  };

  const handleCompletarMeta = async (metaId) => {
    try {
      await apiCall(`/metas/${metaId}`, { method: 'PATCH', body: JSON.stringify({ concluida: true }) });
      showAlert('success', '✨ Parabéns! Meta concluída!');
      carregarMetas();
    } catch (error) { /* Erro já tratado no apiCall */ }
  };

  const handleExcluirMeta = (metaId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Meta',
      message: 'Tem certeza que deseja excluir esta meta?',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false });
        try {
          await apiCall(`/metas/${metaId}`, { method: 'DELETE' });
          showAlert('success', 'Meta excluída');
          carregarMetas();
        } catch (error) { /* Erro já tratado no apiCall */ }
      },
      onClose: () => setConfirmModal({ isOpen: false })
    });
  };

  // Renderização condicional da UI
  if (!token || !user) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-stretch relative z-10">
          <div className={`${glassSurface} rounded-3xl p-8 lg:p-10 border border-slate-700/50`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white border border-slate-700/60">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/60">Jornada de Autocuidado</p>
                <h1 className="text-3xl font-semibold text-white">Revive</h1>
              </div>
            </div>
            <p className="text-lg text-white/80 leading-relaxed mb-6">
              Um painel desenhado para celebrar cada passo rumo a uma vida mais leve. Visual limpo, glassmorphism refinado
              e fluxos prontos para a web ajudam voce a manter o foco em superacao, progresso e autocuidado.
            </p>
            <div className="space-y-3">
              {[
                { icon: <TrendingUp className="w-4 h-4" />, text: 'Acompanhe economia, dias limpos e metas em um so lugar' },
                { icon: <Clock className="w-4 h-4" />, text: 'Registre humor, gatilhos e conquistas com poucos toques' },
                { icon: <Star className="w-4 h-4" />, text: 'Micro animacoes suaves e superficies translucidas para motivar' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5">
                  <div className="w-8 h-8 rounded-xl bg-[#7CF6C4]/20 text-[#7CF6C4] flex items-center justify-center">
                    {item.icon}
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${glassSurface} rounded-3xl p-8 lg:p-10 border border-slate-700/50`}>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">Acesso</p>
                <h2 className="text-2xl font-semibold text-white">{view === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
              </div>
              <div className="p-2 bg-slate-800/60 rounded-full border border-slate-700/60 flex gap-2">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${view === 'login' ? 'bg-[#1F2A3B] text-white border border-slate-600' : 'text-white/70 hover:text-white'}`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setView('cadastro')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${view === 'cadastro' ? 'bg-[#1F2A3B] text-white border border-slate-600' : 'text-white/70 hover:text-white'}`}
                >
                  Criar conta
                </button>
              </div>
            </div>

            {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.message}</Alert>}

            {view === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <InputField
                  type="email"
                  required
                  label="Email"
                  value={formLogin.email}
                  onChange={(e) => setFormLogin({ ...formLogin, email: e.target.value })}
                  placeholder="seu@email.com"
                />
                <InputField
                  type="password"
                  required
                  label="Senha"
                  value={formLogin.senha}
                  onChange={(e) => setFormLogin({ ...formLogin, senha: e.target.value })}
                  placeholder="********"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl font-semibold bg-[#1F2A3B] text-white border border-slate-600 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Entrando...' : 'Entrar e continuar a jornada'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCadastro} className="space-y-4">
                <InputField
                  type="text"
                  required
                  label="Nome"
                  value={formCadastro.nome}
                  onChange={(e) => setFormCadastro({ ...formCadastro, nome: e.target.value })}
                  placeholder="Como quer ser chamado?"
                />
                <InputField
                  type="email"
                  required
                  label="Email"
                  value={formCadastro.email}
                  onChange={(e) => setFormCadastro({ ...formCadastro, email: e.target.value })}
                  placeholder="seu@email.com"
                />
                <InputField
                  type="password"
                  required
                  label="Senha"
                  value={formCadastro.senha}
                  onChange={(e) => setFormCadastro({ ...formCadastro, senha: e.target.value })}
                  placeholder="Defina uma senha segura"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl font-semibold bg-[#1F2A3B] text-white border border-slate-600 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando...' : 'Criar conta e evoluir'}
                </button>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full text-white/70 hover:text-white font-semibold"
                >
                  Já tenho uma conta
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Jornada', icon: <Heart className="w-4 h-4" /> },
    { id: 'analytics', label: 'Insights', icon: <PieChart className="w-4 h-4" /> },
    { id: 'metas', label: 'Metas', icon: <Target className="w-4 h-4" /> },
    { id: 'novo-vicio', label: 'Novo Vício', icon: <Plus className="w-4 h-4" /> }
  ];

  if (vicioSelecionado && !['detalhes'].includes(view)) {
    navItems.push({
      id: 'detalhes',
      label: `Detalhes · ${vicioSelecionado.nome_vicio}`,
      icon: <BarChart3 className="w-4 h-4" />
    });
  }

  return (
    <div className="min-h-screen text-white relative">
      <ConfirmModal {...confirmModal} />
      <RecaidaModal 
        isOpen={recaidaVicio !== null}
        onClose={() => setRecaidaVicio(null)}
        vicio={recaidaVicio}
        onRefletir={handleRefletirRecaida}
        onResetar={handleResetarRecaida}
        loading={loading}
      />
      <NovoVicioWizard 
        isOpen={view === 'novo-vicio'} 
        onClose={() => setView('dashboard')}
        onSubmit={handleCriarVicio}
        loading={loading}
      />
      
      <motion.header
        className={`sticky top-0 z-40 transition-transform duration-300 ${hideHeader ? '-translate-y-full' : 'translate-y-0'}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className={`${glassSurface} rounded-2xl border border-slate-700/60 px-4 sm:px-6 py-3 flex items-center justify-between gap-4`}>
            <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white border border-slate-700/60">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">Painel de Progresso</p>
                <h1 className="text-2xl font-semibold text-white tracking-tight">Revive</h1>
              </div>
            </motion.div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white/70">
                <User className="w-4 h-4" />
                <span className="text-sm font-semibold">{user?.email}</span>
              </div>
              <motion.button
                {...navButtonMotion}
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-white/80 rounded-xl transition border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:block text-sm font-semibold">Sair</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {alert && <Alert type={alert.type} onClose={() => setAlert(null)}>{alert.message}</Alert>}

        <div className={`${glassSurface} border border-slate-700/60 rounded-2xl p-2 mb-6 flex flex-wrap gap-2`}>
          {navItems.map((item) => {
            const isActive = view === item.id;
            return (
              <motion.button
                key={item.id}
                {...navButtonMotion}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
                  isActive
                    ? 'bg-[#1F2A3B] text-white border border-slate-600'
                    : 'text-white/70 hover:text-white bg-slate-800/60 hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </div>

{view === 'dashboard' && (
          <div className="space-y-6">
             <div className={`${glassSurface} rounded-3xl p-6 border border-slate-700/60`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white border border-slate-700/60">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/60">Mensagem do dia</p>
                    <h3 className="text-xl font-semibold text-white mb-1">Respire, avance, celebre</h3>
                    <p className="text-lg font-medium text-white/75">{mensagemMotivacional}</p>
                  </div>
                </div>
                <motion.button
                  {...accentButtonMotion}
                  onClick={() => setView('novo-vicio')}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white/80 hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4" />
                  Novo hábito
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vicios.map((vicio) => {
                // Calcular recaídas do vício nos últimos 30 dias
                const dataLimite = new Date();
                dataLimite.setDate(dataLimite.getDate() - 30);
                const recaidasVicio30dias = recaidas.filter(r => r.vicio_id === vicio.id && new Date(r.data_recaida) >= dataLimite).length;

                return (
                <motion.div
                  key={vicio.id}
                  className={`${glassSurface} rounded-3xl p-6 border border-white/10 flex flex-col relative overflow-hidden`}
                  {...cardMotion}
                >
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Em progresso</p>
                        <h3 className="text-xl font-semibold text-white">{vicio.nome_vicio}</h3>
                        <p className="text-sm text-white/60 mt-1">{vicio.tempo_formatado}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => carregarDetalhesVicio(vicio.id)} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition border border-white/10" title="Ver detalhes"><BarChart3 className="w-5 h-5" /></button>
                        <button onClick={() => handleExcluirVicio(vicio)} className="p-2 text-rose-300/90 hover:bg-rose-500/15 rounded-lg transition border border-rose-300/30" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl border border-white/10 bg-white/5 min-w-0 overflow-hidden">
                        <div className="flex flex-col items-center text-center gap-2">
                          <Calendar className="w-4 h-4 text-[#7CF6C4]" />
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">Dias limpo</p>
                          <p className="text-[clamp(0.95rem,2vw,1.2rem)] font-semibold text-white leading-none tabular-nums whitespace-nowrap truncate">
                            {vicio.dias_abstinencia}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl border border-white/10 bg-white/5 min-w-0 overflow-hidden">
                        <div className="flex flex-col items-center text-center gap-2">
                          <DollarSign className="w-4 h-4 text-[#35D3FF]" />
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">Valor economizado</p>
                          <p className="text-[clamp(0.95rem,1.9vw,1.15rem)] font-semibold text-white leading-none tabular-nums whitespace-nowrap truncate">
                            {`R$ ${Number(vicio.valor_economizado).toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl border border-white/10 bg-white/5 min-w-0 overflow-hidden">
                        <div className="flex flex-col items-center text-center gap-2">
                          <Repeat className="w-4 h-4 text-amber-300" />
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">Recaídas (30d)</p>
                          <p className="text-[clamp(0.95rem,1.9vw,1.15rem)] font-semibold text-white leading-none tabular-nums whitespace-nowrap truncate">
                            {recaidasVicio30dias}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    {...accentButtonMotion}
                    onClick={() => handleRegistrarRecaida(vicio)}
                    className="w-full mt-4 px-4 py-2 bg-slate-800/70 text-white rounded-xl transition font-semibold border border-slate-700/60 hover:bg-slate-700/80"
                  >
                    Registrar Recaída
                  </motion.button>
                </motion.div>
              );
              })}

              <motion.button
                {...cardMotion}
                onClick={() => setView('novo-vicio')}
                className={`${glassSurface} border-dashed border-white/15 rounded-3xl hover:border-[#7CF6C4] hover:bg-[#7CF6C4]/5 transition p-6 flex flex-col items-center justify-center gap-3 min-h-[300px]`}
              >
                <Plus className="w-12 h-12 text-[#7D8BA8]" />
                <span className="text-lg font-semibold text-white/70 hover:text-white">Adicionar novo hábito</span>
              </motion.button>
            </div>
            {vicios.length === 0 && (
                <div className="text-center py-12 col-span-full">
                    <p className="text-white/70 text-lg">Nenhum vício cadastrado ainda.</p>
                    <button onClick={() => setView('novo-vicio')} className="mt-4 px-6 py-3 rounded-2xl font-semibold bg-slate-800/70 text-white border border-slate-700/60 hover:bg-slate-800 transition">Cadastrar primeiro hábito</button>
                </div>
            )}
          </div>
        )}

        {view === 'analytics' && <AnalyticsDashboard vicios={vicios} metas={metas} registros={allRegistros} recaidas={recaidas} />}

        {view === 'metas' && (
          <MetasCard
            metas={metas}
            vicios={vicios}
            onAddMeta={handleCriarMeta}
            onCompleteMeta={handleCompletarMeta}
            onDeleteMeta={handleExcluirMeta}
            loading={loading}
          />
        )}

        {view === 'detalhes' && vicioSelecionado && (
          <div className="space-y-6">
             <div className={`${glassSurface} rounded-3xl p-6 border border-slate-700/60`}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Foco e consistência</p>
                  <h2 className="text-3xl font-bold text-white">{vicioSelecionado.nome_vicio}</h2>
                  <p className="text-lg text-white/70 mt-1">{vicioSelecionado.tempo_formatado}</p>
                </div>
                <button onClick={() => handleExcluirVicio(vicioSelecionado)} className="p-3 text-rose-200 hover:bg-rose-500/15 rounded-lg transition border border-rose-300/30"><Trash2 className="w-6 h-6" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-6 h-6 text-[#7CF6C4]" />
                    <h3 className="font-semibold text-white/80">Dias limpo</h3>
                  </div>
                  <p className="text-4xl font-bold text-white">{vicioSelecionado.dias_abstinencia}</p>
                </div>
                <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-6 h-6 text-[#35D3FF]" />
                    <h3 className="font-semibold text-white/80">Economizado</h3>
                  </div>
                  <p className="text-4xl font-bold text-white">R$ {Number(vicioSelecionado.valor_economizado).toFixed(2)}</p>
                </div>
                <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-6 h-6 text-amber-300" />
                    <h3 className="font-semibold text-white/80">Economia diária</h3>
                  </div>
                  <p className="text-4xl font-bold text-white">R$ {Number(vicioSelecionado.valor_economizado_por_dia).toFixed(2)}</p>
                </div>
              </div>
              <button onClick={() => handleRegistrarRecaida(vicioSelecionado)} className="w-full mt-6 px-6 py-3 bg-rose-500/15 text-rose-100 rounded-xl hover:bg-rose-500/25 transition font-semibold border border-rose-300/30">Registrar Recaída</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className={`${glassSurface} rounded-3xl p-6 border border-white/10`}>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Target className="w-6 h-6 text-[#7CF6C4]" />Nova meta para "{vicioSelecionado.nome_vicio}"</h3>
                    <form onSubmit={handleCriarMeta} className="space-y-4">
                        <InputField type="text" value={formMeta.descricao_meta} onChange={(e) => setFormMeta({ ...formMeta, descricao_meta: e.target.value })} required label="Descrição da meta" placeholder="Algo que motive você" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InputField type="number" min="1" value={formMeta.dias_objetivo} onChange={(e) => setFormMeta({ ...formMeta, dias_objetivo: e.target.value })} label="Dias objetivo" placeholder="Ex: 30" />
                            <InputField type="number" step="0.01" min="0" value={formMeta.valor_objetivo} onChange={(e) => setFormMeta({ ...formMeta, valor_objetivo: e.target.value })} label="Valor objetivo (R$)" placeholder="Ex: 150.00" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3 rounded-2xl font-semibold bg-slate-800/70 text-white border border-slate-700/60 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed">Criar meta</button>
                    </form>
                    </div>

                    {metas.filter(m => m.vicio_id === vicioSelecionado.id).length > 0 && (
                    <div className={`${glassSurface} rounded-3xl p-6 border border-white/10`}>
                        <h3 className="text-xl font-bold text-white mb-4">Metas Ativas</h3>
                        <div className="space-y-3">
                        {metas.filter(m => m.vicio_id === vicioSelecionado.id).map((meta) => (
                            <div key={meta.id} className="p-4 bg-white/5 backdrop-blur rounded-lg border border-white/20">
                            <div className="flex items-start justify-between mb-2">
                                <p className="font-semibold text-white">{meta.descricao_meta}</p>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${ meta.concluida ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' }`}>{meta.concluida ? 'Concluída' : 'Em Progresso'}</span>
                            </div>
                            <div className="flex gap-4 text-sm text-white/70">
                                <span>🎯 {meta.dias_objetivo} dias</span>
                                {meta.valor_objetivo && <span>💰 R$ {Number(meta.valor_objetivo).toFixed(2)}</span>}
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}
                </div>

                <div id="form-registro" className={`${glassSurface} rounded-3xl p-6 border border-white/10`}>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><BookOpen className="w-6 h-6 text-[#7CF6C4]" />Novo Registro Diário</h3>
                    <form onSubmit={handleCriarRegistro} className="space-y-4">
                        <SelectHumor 
                          value={formRegistro.humor} 
                          onChange={(valor) => setFormRegistro({ ...formRegistro, humor: valor })}
                          label="Selecione seu humor..."
                        />
                        <input type="text" value={formRegistro.gatilhos} onChange={(e) => setFormRegistro({ ...formRegistro, gatilhos: e.target.value })} className={fieldBase} placeholder="Gatilhos (separados por vírgula)"/>
                        <textarea value={formRegistro.conquistas} onChange={(e) => setFormRegistro({ ...formRegistro, conquistas: e.target.value })} className={fieldBase} placeholder="Conquistas do dia..." rows="2" />
                        <textarea value={formRegistro.observacoes} onChange={(e) => setFormRegistro({ ...formRegistro, observacoes: e.target.value })} className={fieldBase} placeholder="Observações..." rows="2" />
                        <button type="submit" disabled={loading} className="w-full py-3 rounded-2xl font-semibold bg-slate-800/70 text-white border border-slate-700/60 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed">Salvar registro</button>
                    </form>
                </div>
            </div>

            {registros.length > 0 && (
              <div className={`${glassSurface} rounded-3xl p-6 border border-white/10`}>
                <h3 className="text-xl font-bold text-white mb-4">Histórico de Registros</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {registros.map((registro) => (
                    <div key={registro.id} className="p-4 bg-white/5 backdrop-blur rounded-lg border-l-4 border-[#7CF6C4]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white/70">{new Date(registro.data_registro).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        <span className="px-3 py-1 bg-[#7CF6C4]/20 text-[#7CF6C4] rounded-full text-sm font-medium capitalize border border-[#7CF6C4]/30">{registro.humor}</span>
                      </div>
                      {registro.gatilhos && <p className="text-sm text-white/70 mb-1"><strong className="text-white">Gatilhos:</strong> {registro.gatilhos}</p>}
                      {registro.conquistas && <p className="text-sm text-white/70 mb-1"><strong className="text-white">Conquistas:</strong> {registro.conquistas}</p>}
                      {registro.observacoes && <p className="text-sm text-white/70"><strong className="text-white">Observações:</strong> {registro.observacoes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
