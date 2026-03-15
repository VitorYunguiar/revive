import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, Star, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import Alert from '../components/ui/Alert';
import { InputField } from '../components/ui/Field';
import { glassSurface } from '../utils/constants';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, cadastro } = useAuth();
  const { alert, setAlert, showToast } = useUI();
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [formLogin, setFormLogin] = useState({ email: '', senha: '' });
  const [formCadastro, setFormCadastro] = useState({ nome: '', email: '', senha: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formLogin.email, formLogin.senha);
      setFormLogin({ email: '', senha: '' });
      navigate('/');
    } catch (error) {
      showToast('error', error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await cadastro(formCadastro.nome, formCadastro.email, formCadastro.senha);
      setView('login');
      setFormCadastro({ nome: '', email: '', senha: '' });
    } catch (error) {
      showToast('error', error.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

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
              { icon: <Star className="w-4 h-4" />, text: 'Conquistas, calendario e insights personalizados' }
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
                Ja tenho uma conta
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
