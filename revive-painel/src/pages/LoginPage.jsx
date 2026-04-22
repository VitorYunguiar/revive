/**
 * @file LoginPage.jsx - Pagina de login e cadastro da aplicacao Revive.
 *
 * @description
 * Pagina publica de autenticacao que combina login e cadastro em uma unica tela.
 * O layout e dividido em dois paineis lado a lado (grid 2 colunas em desktop):
 *
 * **Painel esquerdo:** Apresentacao da marca Revive com beneficios listados.
 * **Painel direito:** Formulario alternavel entre login e cadastro, controlado
 * pelo estado local `view` ('login' | 'cadastro').
 *
 * **Estados locais gerenciados:**
 * - `view` - Controla qual formulario esta visivel ('login' ou 'cadastro')
 * - `loading` - Flag de carregamento durante chamadas de API
 * - `formLogin` - Dados do formulario de login { email, senha }
 * - `formCadastro` - Dados do formulario de cadastro { nome, email, senha }
 *
 * **Handlers:**
 * - `handleLogin` - Submete o formulario de login, navega para `/` em caso de sucesso
 * - `handleCadastro` - Submete o formulario de cadastro, retorna a view de login em sucesso
 *
 * @component
 * @see {@link useAuth} Hook de autenticacao (login, cadastro)
 * @see {@link useUI} Hook de UI (alertas, toasts)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, Star, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import Alert from '../components/ui/Alert';
import { InputField } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { glassSurface } from '../utils/constants';

/**
 * Componente da pagina de login e cadastro.
 *
 * Alterna entre dois formularios (login/cadastro) usando estado local `view`.
 * Limpa campos apos sucesso em ambos os fluxos. Exibe toasts de erro
 * em caso de falha na autenticacao.
 *
 * @returns {JSX.Element} Pagina com painel de marca e formulario de autenticacao
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, cadastro } = useAuth();
  const { alert, setAlert, showToast } = useUI();
  /** @type {[string, Function]} Controla qual formulario esta visivel: 'login' ou 'cadastro' */
  const [view, setView] = useState('login');
  /** @type {[boolean, Function]} Flag de carregamento durante submissao do formulario */
  const [loading, setLoading] = useState(false);
  /** @type {[Object, Function]} Dados controlados do formulario de login */
  const [formLogin, setFormLogin] = useState({ email: '', senha: '' });
  /** @type {[Object, Function]} Dados controlados do formulario de cadastro */
  const [formCadastro, setFormCadastro] = useState({ nome: '', email: '', senha: '' });

  /**
   * Submete o formulario de login.
   * Em caso de sucesso, limpa os campos e navega para a dashboard.
   * Em caso de erro, exibe toast com a mensagem de erro.
   *
   * @param {Event} e - Evento de submit do formulario
   * @returns {Promise<void>}
   */
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

  /**
   * Submete o formulario de cadastro.
   * Em caso de sucesso, limpa os campos e volta para a view de login.
   * Nao faz login automatico — o usuario deve entrar manualmente apos o cadastro.
   *
   * @param {Event} e - Evento de submit do formulario
   * @returns {Promise<void>}
   */
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
            <div className="w-12 h-12 rounded-2xl bg-teal-400 flex items-center justify-center text-slate-950 border border-teal-200">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="eyebrow">Jornada de autocuidado</p>
              <h1 className="text-3xl font-bold text-app">Revive</h1>
            </div>
          </div>
          <p className="text-lg text-muted leading-relaxed mb-6">
            Um painel desenhado para acompanhar cada passo rumo a uma vida mais leve. Métricas, registros e metas ajudam você a manter foco em superação, progresso e autocuidado.
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
                <p className="text-muted text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`${glassSurface} rounded-3xl p-8 lg:p-10 border border-slate-700/50`}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="eyebrow">Acesso</p>
              <h2 className="text-2xl font-semibold text-app">{view === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
            </div>
            <div className="p-2 bg-slate-800/60 rounded-full border border-slate-700/60 flex gap-2">
              <button
                type="button"
                onClick={() => setView('login')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${view === 'login' ? 'bg-teal-400 text-slate-950 border border-teal-200' : 'text-muted hover:text-app'}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setView('cadastro')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${view === 'cadastro' ? 'bg-teal-400 text-slate-950 border border-teal-200' : 'text-muted hover:text-app'}`}
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
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                size="lg"
                className="w-full"
              >
                {loading ? 'Entrando...' : 'Entrar e continuar a jornada'}
              </Button>
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
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                size="lg"
                className="w-full"
              >
                {loading ? 'Criando...' : 'Criar conta e evoluir'}
              </Button>
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
