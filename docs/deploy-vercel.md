# Deploy publico do REVIVE na Vercel

Este guia migra o deploy do Render para a Vercel mantendo a mesma ideia de um unico dominio publico:

- o painel React/Vite e buildado em `revive-painel/dist` e servido como site estatico;
- a API Express roda como Vercel Function em `/api/*`;
- o frontend usa `API_BASE=/api` em producao, sem precisar configurar CORS para o mesmo dominio.

## Arquivos usados pela Vercel

- `vercel.json`: define install, build, output estatico, funcao `/api/*` e fallback do SPA.
- `api/[...path].js`: encaminha qualquer chamada `/api/*` para o app Express de `index.js`.
- `index.js`: continua funcionando localmente com `npm start`, mas nao abre porta quando importado pela Vercel.

## Variaveis de ambiente

Cadastre estas variaveis no projeto da Vercel, nos ambientes Production e Preview:

```ini
NODE_ENV=production
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
```

`SUPABASE_KEY` e opcional se `SUPABASE_SERVICE_ROLE_KEY` estiver configurada. Use a service role key no backend para evitar falhas de cadastro quando a tabela `usuarios` estiver protegida por RLS.

`ALLOWED_ORIGINS` normalmente nao e necessario no deploy Vercel porque painel e API ficam no mesmo dominio. Use apenas se outro frontend externo for consumir a API:

```ini
ALLOWED_ORIGINS=https://seu-dominio.vercel.app,https://seu-dominio.com
```

## Deploy via Vercel

1. Importe o repositorio na Vercel.
2. Mantenha o Root Directory como a raiz do repositorio.
3. A Vercel usara o `vercel.json`:

```bash
npm ci && npm ci --prefix revive-painel
npm run build:web
```

4. Configure as variaveis de ambiente antes do primeiro deploy de producao.
5. Rode o deploy.

## Validacao

Depois do deploy:

- abra `https://SEU-PROJETO.vercel.app`;
- acesse `https://SEU-PROJETO.vercel.app/api/health`;
- acesse `https://SEU-PROJETO.vercel.app/api/docs`;
- teste cadastro/login no painel.

## Deploy via CLI

Se preferir usar a CLI:

```bash
vercel
vercel --prod
```

Para CI/CD manual, use `vercel pull`, `vercel build` e `vercel deploy --prebuilt`, sempre com `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` configurados como secrets do provedor de CI.
