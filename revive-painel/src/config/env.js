const getDevApiBase = () => {
  if (typeof window === 'undefined') return 'http://localhost:3000/api';

  const { hostname } = window.location;
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

  if (!hostname || localHosts.has(hostname)) return 'http://localhost:3000/api';
  return `http://${hostname}:3000/api`;
};

export const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : getDevApiBase());
