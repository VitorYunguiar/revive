# REVIVE - Fluxograma de arquitetura

Documento gerado a partir da estrutura atual do repositorio em 2026-06-16.

## Visao geral

```mermaid
flowchart LR
    U["Usuario no navegador"]
    PWA["Painel React/Vite<br/>revive-painel"]
    Router["React Router<br/>rotas publicas e protegidas"]
    UI["UIProvider<br/>toasts, loading, confirmacao"]
    Auth["AuthProvider<br/>login, cadastro, token JWT"]
    Data["DataProvider<br/>vicios, registros, metas, recaidas"]
    Services["Services do frontend<br/>auth, vicios, registros, metas, recaidas, mensagens"]
    ApiAdapter["apiCall<br/>fetch + JSON + Bearer token"]
    ApiBase["API_BASE<br/>VITE_API_URL, /api ou localhost:3000/api"]
    Express["API Express<br/>index.js"]
    Middlewares["Middlewares<br/>CORS, JSON, no-store, Morgan, rate limit, JWT"]
    Routes["Rotas REST<br/>/api/auth, /api/vicios, /api/metas, /api/registros"]
    SupabaseClient["Supabase JS client<br/>service role ou key"]
    DB["Supabase/PostgreSQL"]

    U --> PWA
    PWA --> Router
    PWA --> UI
    PWA --> Auth
    PWA --> Data
    Auth --> Services
    Data --> Services
    Services --> ApiAdapter
    ApiAdapter --> ApiBase
    ApiBase --> Express
    Express --> Middlewares
    Middlewares --> Routes
    Routes --> SupabaseClient
    SupabaseClient --> DB
    DB --> SupabaseClient
    SupabaseClient --> Routes
    Routes --> Express
    Express --> ApiAdapter
    ApiAdapter --> Data
    ApiAdapter --> Auth
```

## Fluxo de uma requisicao autenticada

```mermaid
flowchart TD
    A["Componente da tela<br/>Dashboard, Metas, Detalhes etc."]
    B["Hook de contexto<br/>useAuth ou useData"]
    C["Servico especifico<br/>ex: vicios.service.js"]
    D["apiCall(endpoint, options, token)"]
    E["Header Authorization<br/>Bearer revive_token"]
    F["Express /api/*"]
    G["CORS"]
    H["express.json"]
    I["Cache-Control: no-store"]
    J["morgan"]
    K["Rate limiter"]
    L["authMiddleware<br/>jwt.verify(JWT_SECRET)"]
    M["Handler da rota"]
    N["Supabase client"]
    O["Tabela no banco"]
    P["Resposta JSON"]

    A --> B --> C --> D --> E --> F
    F --> G --> H --> I --> J --> K --> L --> M
    M --> N --> O --> N --> M --> P --> D --> B --> A
```

Rotas publicas de autenticacao (`/api/auth/login` e `/api/auth/cadastro`) passam por CORS, JSON, no-store, Morgan e limites especificos, mas nao passam pelo `authMiddleware`.

## Fluxo de autenticacao

```mermaid
sequenceDiagram
    participant Tela as LoginPage
    participant Auth as AuthProvider
    participant Service as auth.service.js
    participant API as Express API
    participant DB as Supabase
    participant Storage as localStorage

    Tela->>Auth: login(email, senha) ou cadastro(nome, email, senha)
    Auth->>Service: chama login/cadastro
    Service->>API: POST /api/auth/login ou /api/auth/cadastro
    API->>DB: usuarios.select/insert
    API->>API: bcrypt.compare ou bcrypt.hash
    API->>API: jwt.sign({ id, email }, JWT_SECRET, 7d)
    API-->>Service: { token, usuario }
    Service-->>Auth: resposta parseada
    Auth->>Storage: salva revive_token
    Auth-->>Tela: user + token no contexto
```

Quando o app abre com um token salvo, o `AuthProvider` chama `verificarToken`, que faz `GET /api/vicios` com Bearer token. Se a API responder erro, o token e removido e o usuario volta para o fluxo publico.

## Fluxo de carregamento de dados no painel

```mermaid
flowchart TD
    LoginOK["Usuario autenticado<br/>user + token"]
    Reset["DataProvider limpa estado anterior"]
    Parallel["Carregamento inicial em paralelo"]
    Vicios["GET /api/vicios"]
    Msg["GET /api/mensagens/diaria"]
    Metas["GET /api/metas"]
    Recaidas["GET /api/recaidas"]
    RecordsTrigger["Depois que addictions e preenchido"]
    Records["GET /api/vicios/:id/registros<br/>uma chamada por vicio"]
    UI["Componentes renderizam<br/>dashboard, analytics, calendario, relatorios"]

    LoginOK --> Reset --> Parallel
    Parallel --> Vicios
    Parallel --> Msg
    Parallel --> Metas
    Parallel --> Recaidas
    Vicios --> RecordsTrigger --> Records
    Vicios --> UI
    Msg --> UI
    Metas --> UI
    Recaidas --> UI
    Records --> UI
```

Escritas de dados seguem o mesmo padrao: componente chama `useData`, `DataProvider` chama um service, o service chama `apiCall`, a API valida o token, confirma propriedade do recurso no Supabase e devolve JSON. Apos sucesso, o contexto recarrega ou atualiza o estado afetado.

## Banco de dados referenciado pela API

```mermaid
erDiagram
    usuarios ||--o{ vicios : possui
    usuarios ||--o{ metas : cria
    vicios ||--o{ registros_diarios : registra
    vicios ||--o{ historico_recaidas : possui
    vicios ||--o{ metas : pode_associar

    usuarios {
        uuid id
        text nome
        text email
        text senha_hash
    }

    vicios {
        uuid id
        uuid usuario_id
        text nome_vicio
        date data_inicio
        timestamp data_ultima_recaida
        numeric valor_economizado_por_dia
        boolean ativo
    }

    registros_diarios {
        uuid id
        uuid vicio_id
        date data_registro
        text humor
        text gatilhos
        text conquistas
        text observacoes
    }

    historico_recaidas {
        uuid id
        uuid vicio_id
        timestamp data_recaida
        text motivo
        integer dias_abstinencia_perdidos
    }

    metas {
        uuid id
        uuid usuario_id
        uuid vicio_id
        text descricao_meta
        integer dias_objetivo
        numeric valor_objetivo
        boolean concluida
        boolean iniciar_hoje
        date data_inicio_meta
        integer dias_abstinencia_inicio
        numeric valor_economizado_inicio
    }

    mensagens_motivacionais {
        uuid id
        text mensagem
        text tipo_vicio
        boolean ativa
    }
```

Observacao: o schema acima representa as tabelas e campos usados pelo codigo. O arquivo de migration atual adiciona campos de baseline em `metas`: `iniciar_hoje`, `data_inicio_meta`, `dias_abstinencia_inicio` e `valor_economizado_inicio`.

## Rotas, services e tabelas

| Area | Frontend service | Endpoint | Tabelas principais |
| --- | --- | --- | --- |
| Cadastro | `auth.service.js` | `POST /api/auth/cadastro` | `usuarios` |
| Login | `auth.service.js` | `POST /api/auth/login` | `usuarios` |
| Perfil | `auth.service.js` | `GET/PATCH /api/me` | `usuarios` |
| Vicios | `vicios.service.js` | `GET/POST /api/vicios` | `vicios` |
| Detalhe do vicio | `vicios.service.js` | `GET /api/vicios/:id` | `vicios` |
| Excluir vicio | `vicios.service.js` | `DELETE /api/vicios/:id` | `registros_diarios`, `historico_recaidas`, `metas`, `vicios` |
| Recaida | `vicios.service.js`, `recaidas.service.js` | `POST /api/vicios/:id/recaida`, `GET /api/recaidas` | `historico_recaidas`, `vicios` |
| Registro diario | `registros.service.js` | `POST /api/registros`, `GET /api/vicios/:id/registros` | `registros_diarios`, `vicios` |
| Mensagem diaria | `mensagens.service.js` | `GET /api/mensagens/diaria` | `mensagens_motivacionais` |
| Metas | `metas.service.js` | `GET/POST /api/metas`, `PATCH/DELETE /api/metas/:id` | `metas`, `vicios` |
| Health check | nao usado pelo painel | `GET /api/health` | nenhuma |
| Docs da API | navegador | `GET /api/docs` | nenhuma |

## Deploy e execucao

```mermaid
flowchart LR
    Dev["Desenvolvimento local"]
    DevApi["API<br/>npm run dev<br/>localhost:3000"]
    DevWeb["Painel<br/>npm run dev --prefix revive-painel<br/>localhost:5173"]
    Render["Render"]
    RenderBuild["Build<br/>npm install + build do painel"]
    RenderRun["npm start<br/>Express serve API e dist React"]
    Vercel["Vercel"]
    VercelBuild["Build<br/>npm run build:web"]
    VercelStatic["Static output<br/>revive-painel/dist"]
    VercelFn["Function<br/>api/[...path].js"]
    SharedApp["Mesmo app Express<br/>module.exports.app"]

    Dev --> DevApi
    Dev --> DevWeb
    DevWeb -->|"API_BASE localhost:3000/api"| DevApi

    Render --> RenderBuild --> RenderRun --> SharedApp

    Vercel --> VercelBuild --> VercelStatic
    Vercel --> VercelFn --> SharedApp
    VercelStatic -->|"/api/* rewrite"| VercelFn
```

## Arquivos principais

| Arquivo | Papel |
| --- | --- |
| `index.js` | Servidor Express, conexao Supabase, middlewares, rotas REST, Swagger, health check e static hosting em producao |
| `api/[...path].js` | Adaptador serverless da Vercel que reescreve `/api/*` para o mesmo `app` Express |
| `revive-painel/src/main.jsx` | Entrada React, ordem dos providers e registro de service worker em producao |
| `revive-painel/src/App.jsx` | Arvore de rotas publicas/protegidas |
| `revive-painel/src/config/env.js` | Resolucao de `API_BASE` por ambiente |
| `revive-painel/src/services/api.js` | Adapter HTTP central com Bearer token, parse de JSON e tratamento de erro |
| `revive-painel/src/contexts/AuthContext.jsx` | Estado de autenticacao, JWT em `localStorage`, login/cadastro/logout |
| `revive-painel/src/contexts/DataContext.jsx` | Estado central de dados e orquestracao de carregamentos/escritas |
| `vercel.json` | Build do painel, output estatico e rewrites para SPA/API |
| `render.yaml` | Configuracao do web service Render e variaveis sensiveis |
| `supabase/migrations/20260616000000_add_goal_progress_baseline.sql` | Migration atual de campos de baseline de metas |

## Variaveis de ambiente usadas

| Variavel | Uso |
| --- | --- |
| `SUPABASE_URL` | URL do projeto Supabase usada pelo backend |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave preferencial do backend para operar no Supabase |
| `SUPABASE_KEY` | Fallback caso a service role nao esteja definida |
| `JWT_SECRET` | Assinatura e validacao dos tokens JWT |
| `ALLOWED_ORIGINS` | Lista opcional de origens CORS permitidas |
| `PORT` | Porta local da API, padrao `3000` |
| `NODE_ENV` | Define comportamento de producao/teste/desenvolvimento |
| `VITE_API_URL` | Base da API no frontend; quando ausente usa `/api` em producao ou localhost em dev |
