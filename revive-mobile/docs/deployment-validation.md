# Publicação de desenvolvimento

## API e painel

- URL: https://revive-beryl.vercel.app
- Base mobile: https://revive-beryl.vercel.app/api
- Hospedagem: projeto Vercel `revive`, ID `prj_AkmQVDVtFARtg04uHbIoxmdMn6IT`.
- Deployment: `dpl_6w1hxmCDUYUJoAA3ntrq8EMfeZYS`, READY, publicado via CLI a partir do diretório local em 07/09/2026 UTC.
- Destino Vercel: production (domínio estável); banco Supabase continua sendo DESENVOLVIMENTO `upqlaeqdaobzrepamnvs`.
- Pacote de publicação revisado com `vercel deploy --dry`: código de API e painel, sem `.env`, documentos privados, mobile, runtime ou scripts de teste.
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` cadastradas como segredos no servidor. `JWT_SECRET` remoto existente preservado. Segredos não foram copiados ao mobile.
- Publicação não dependeu de push ao GitHub; o código local ainda precisa ser versionado para reproduzir a versão por integração Git.

## Validação executada

- `npm run validate` na raiz: 16 testes da API, 15 testes do painel e build Vite passaram.
- HTTP público: `/` = 200 HTML; `/api/health` = 200 JSON; `/api/v2/bootstrap` sem credencial = 401 JSON.
- `scripts/verify-mobile-development.cjs`, com `REVIVE_VERIFY_DEVELOPMENT=1` e `REVIVE_VERIFY_API_URL=https://revive-beryl.vercel.app`: seis grupos passaram pela internet, sem mocks.
- Cobertura real: cadastro/login de duas contas, bootstrap, isolamento, replay sequencial/conflito de idempotência, metas, recaídas, dispositivo push, refresh/reuso/logout e exclusão completa.
- Contas temporárias e dependências removidas e ausência verificada.
- Consulta de logs após publicação trouxe duas ocorrências de DeprecationWarning `url.parse()`; não foram encontrados erros funcionais nos testes públicos. Não equivale a monitoramento contínuo.
- Build remoto reportou advisories npm em dependências existentes. Revisão/atualização dessas dependências continua necessária; não foi usado `npm audit fix --force`.

## Mobile

- EAS: https://expo.dev/accounts/reviveapp/projects/revive-mobile
- Android package e iOS bundleIdentifier: `com.reviveapp.revive`.
- Perfil preview gera APK para instalação interna com a URL HTTPS acima.
- A pasta aninhada `revive/` contém outro projeto de exemplo e foi excluída da checagem de tipos, lint e do pacote EAS deste app.
- Ao usar EAS sem Git, definir `EAS_NO_VCS=1` e `EAS_PROJECT_ROOT=C:\revive-claude\revive-mobile` para empacotar apenas o aplicativo. `.easignore` exclui arquivos locais e chaves.
- Ainda não há validação em aparelho físico, publicação em lojas, nem garantia de atomicidade offline sob falhas/concorrência.
