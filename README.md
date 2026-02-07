# REVIVE - API + Painel de Recuperação

Aplicação completa composta por uma API Node.js/Express que conversa com o Supabase e um painel administrativo em React/Tailwind (Vite). Este guia explica como executar o projeto a partir de um ZIP.

## 1. Pré-requisitos

- **Node.js 20+** (recomendado 22.20.0 já incluído no repositório)
- **npm** (instalado com o Node)

## 2. Estrutura do projeto

```
revive-api/
├─ index.js              # API Express
├─ package.json
├─ .env                  # Configurações sensíveis (não versionado)
└─ revive-painel/        # Frontend React/Tailwind (Vite)
   ├─ package.json
   └─ src/
```

## 3. Configuração da API (pasta `revive-api`)

1. **Instale dependências**
bash
   npm install


2. **Configure variáveis de ambiente** em `.env` (crie se não existir): ## PRA GALERA DO REVIVE NAO PRECISA FAZER, JA ESTA FEITO ##
ini
   PORT=3000
   SUPABASE_URL=...        # URL do seu projeto
   SUPABASE_KEY=...        # Service role key
   JWT_SECRET=supersegredo


3. **Execute a API**
   -- ABRIR TERMINAL NA PASTA DO PROJETO (REVIVE-API) --
   npm run start   # produção
   # ou
   npm run dev     # com nodemon


A API ficará disponível em `http://localhost:3000/api`.

## 4. Configuração do Painel (pasta `revive-painel`)

1. **Instale dependências**
   -- ABRIR TERMINAL NA PASTA DO PROJETO (REVIVE-API) --
   cd revive-painel
   npm install


2. **Atualize endpoints se necessário**
   - No painel (`src/App.jsx`) a constante `API_BASE` aponta por padrão para `http://localhost:3000/api`.
   - Ajuste se a API rodar em outro host/porta.

3. **Execute o painel**
   -- ABRIR TERMINAL NA PASTA DO PROJETO (REVIVE-API) --
   npm run dev

   O Vite exibirá a URL (geralmente `http://localhost:5173`).

## 5. Fluxo de execução

1. Abra dois terminais:
   - Terminal A: `npm run dev` na raiz (API)
   - Terminal B: `cd revive-painel && npm run dev`
2. Acesse o painel no navegador e use as rotas do backend expostas em `index.js`.

## 6. Supabase: tabelas esperadas  ## PRA GALERA DO REVIVE NAO PRECISA FAZER, JA ESTA FEITO ##

Crie no Supabase as tabelas referenciadas na API:
- `usuarios` (contém `nome`, `email`, `senha_hash` etc.)
- `vicios` (campos como `usuario_id`, `nome_vicio`, `data_inicio`, `valor_economizado_por_dia`, `ativo`)
- `registros_diarios`
- `historico_recaidas`
- `metas`
- `mensagens_motivacionais`

A API utiliza relacionamentos simples por `usuario_id`/`vicio_id`. Ajuste nomes/colunas conforme seu schema.

## 7. Scripts úteis

| Comando | Local | Descrição |
| --- | --- | --- |
| `npm run dev` | raiz | API com nodemon |
| `npm start` | raiz | API em modo padrão |
| `npm run dev` | `revive-painel/` | Frontend Vite |
| `npm run build` | `revive-painel/` | Build para produção |

## 8. Dicas adicionais

- Para usar autenticação JWT, o painel salva `revive_token` no `localStorage` após login.
- Ao zipar o projeto, inclua o `.env.example` com placeholders (nunca exponha chaves reais).
- Certifique-se de liberar CORS no Supabase se consumir diretamente de outros domínios.

Pronto! Com esses passos, qualquer pessoa conseguirá subir a API e o painel localmente.
