# Copilot Instructions for REVIVE

REVIVE is a full-stack addiction recovery support platform with a Node.js/Express backend and React/Vite frontend.

## Architecture Overview

**Backend** (`index.js`): Node.js + Express + Supabase
- REST API for user auth (JWT), addiction tracking, daily logs, goals, and motivational messages
- Authentication middleware validates Bearer tokens for all protected routes
- Supabase tables: `usuarios`, `vicios`, `historico_recaidas`, `registros_diarios`, `metas`, `mensagens_motivacionais`

**Frontend** (`revive-painel/`): React 19 + Vite + Tailwind CSS + Lucide Icons
- Single-page app with view-based routing (login, dashboard, novo-vicio, detalhes, analytics)
- Centralized API calls via `apiCall()` wrapper (sets auth headers, handles errors uniformly)
- Dark theme with emerald accent color (#00FFA3)

## Critical Workflows

### API Interaction Pattern
All API calls go through the `apiCall(endpoint, options)` wrapper in `App.jsx`:
- Automatically attaches Bearer token from state
- Centralizes error handling → shows Alert components
- Sets `loading` state during requests
- Wrap new API calls in try-catch with `apiCall()` rather than direct fetch

### Data Flow for Addiction Tracking
1. User logs in → token stored in localStorage
2. `carregarVicios()` fetches user's active addictions (computed: dias_abstinencia, valor_economizado)
3. Frontend calculates time-since-abstinence on display (not stored on backend)
4. Recording relapse: `/vicios/:id/recaida` updates `data_ultima_recaida` in DB, triggers recalculation
5. Daily logs → `/registros` endpoint (humor, gatilhos, conquistas, observacoes)
6. Dashboard analytics pulls all user registros via `Promise.all(vicios.map(...))` for performance

### Analytics Dashboard (AnalyticsDashboard Component)
Uses `useMemo` to optimize re-renders:
- KPIs: viciosAtivos, totalEconomizado, metasConcluidas, recaidas30dias, frequenciaRegistrosSemanal
- Complex metrics: tempoMedioRecaidas (calculates gaps between relapse dates), topGatilhosRecaidas (correlates log gatilhos within 2 days of relapses)
- Donut chart (DonutChart component) visualizes mood distribution last 30 days
- Always filter by 30-day window for historical metrics

## Project-Specific Patterns

### Form Handling
Each view maintains its own form state object (formLogin, formVicio, formRegistro, etc.). On submit:
1. Prevent default & call apiCall()
2. Reset form to empty values on success
3. Use showAlert() for feedback
4. Refresh parent data (carregarVicios, carregarDetalhesVicio, etc.)

### Confirmation Modals
Destructive actions (delete addiction, record relapse) open ConfirmModal before executing. Set state:
```javascript
setConfirmModal({ 
  isOpen: true, 
  title: '...', 
  message: '...', 
  onConfirm: async () => {...}, 
  onClose: () => {...} 
});
```

### Date Handling
- Backend stores ISO strings (`new Date().toISOString()`)
- Frontend parses with `new Date(dateString)`
- `calcularTempoDecorrido()` converts days to human-readable format (e.g., "6 months")
- Analytics filters by `dataLimite = new Date(); dataLimite.setDate(dataLimite.getDate() - 30)`

### Tailwind + Lucide Integration
- Dark palette: #1A1D2E (bg-dark), #2D3250 (cards), #00FFA3 (accent)
- Border colors: border-${color}-500/30 for subtle tints
- All icons from lucide-react; use `.w-5 .h-5` for consistency
- Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### Backend Password Requirements
Signup enforces:
- Minimum 6 characters
- At least one uppercase letter
- At least one special character (!@#$%^&*(),.?":{}|<>)
- Validate in frontend before submit to prevent server round-trips

## Integration Points

**Backend Routes** (all auth-protected except /auth/* and /health):
- POST /auth/login, /auth/cadastro
- GET /vicios, POST /vicios, GET /vicios/:id, POST /vicios/:id/recaida, DELETE /vicios/:id
- GET /recaidas
- POST /registros, GET /vicios/:id/registros
- POST /metas, GET /metas
- GET /mensagens/diaria?tipo_vicio=geral
- GET /api/health (no auth needed)

**Frontend Navigation**
- `setView()` controls visible component (login, dashboard, novo-vicio, detalhes, analytics)
- Persistent views: vicioSelecionado stores current addiction detail state
- Navigation buttons dynamically render based on current view

## Common Mistakes to Avoid

1. **Missing auth headers**: Always use `apiCall()`, never direct fetch for protected endpoints
2. **Not resetting form after submit**: Clear form state objects on success
3. **Forgetting useMemo for dashboard**: Computed KPIs must use useMemo to avoid expensive re-renders
4. **Date parsing inconsistency**: Always parse Supabase ISO strings explicitly, don't assume type
5. **Hard-coded API URL**: Use `API_BASE` constant, not inline URLs
6. **Unhandled edge cases in analytics**: Check array length before accessing first/last elements
7. **Missing confirmation for relapse**: Always ask user to confirm before calling recaida endpoint

## Testing Entry Points

- **Login flow**: Start with /api/health to test backend connectivity
- **Addiction workflow**: Create vício → add registro → view detalhes
- **Analytics**: Ensure at least 2 registros exist to populate AnalyticsDashboard
- **Relapse logic**: Test that dias_abstinencia resets correctly after recaida
