import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { glassSurface } from '../../utils/constants';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`${glassSurface} rounded-2xl p-8 text-center`}>
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Algo deu errado</h3>
          <p className="text-white/60 mb-6">Ocorreu um erro inesperado. Tente recarregar a pagina.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/70 text-white border border-slate-700/60 hover:bg-slate-800 transition font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
