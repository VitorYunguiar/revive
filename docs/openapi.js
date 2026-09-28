/**
 * @openapi
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         erro:
 *           type: string
 *         detalhes:
 *           type: string
 *     MobileErrorResponse:
 *       type: object
 *       required: [codigo, mensagem, request_id]
 *       properties:
 *         codigo: { type: string, example: DADOS_INVALIDOS }
 *         mensagem: { type: string, example: Revise os campos informados. }
 *         request_id: { type: string, example: 9f66f49b-2320-4a52-8b0e-378799e6a813 }
 *         campos:
 *           type: object
 *           additionalProperties: { type: string }
 *     LoginRequest:
 *       type: object
 *       required: [email, senha]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         senha:
 *           type: string
 *     CadastroRequest:
 *       type: object
 *       required: [nome, email, senha]
 *       properties:
 *         nome:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         senha:
 *           type: string
 *     Vicio:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         nome_vicio:
 *           type: string
 *         data_inicio:
 *           type: string
 *           format: date-time
 *         data_ultima_recaida:
 *           type: string
 *           format: date-time
 *         dias_abstinencia:
 *           type: integer
 *         valor_economizado:
 *           type: string
 *         tempo_formatado:
 *           type: string
 *     Meta:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         descricao_meta:
 *           type: string
 *         concluida:
 *           type: boolean
 *     RegistroDiario:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         vicio_id:
 *           type: string
 *         data_registro:
 *           type: string
 *           format: date
 *         humor:
 *           type: string
 *         gatilhos:
 *           type: string
 *         conquistas:
 *           type: string
 *         observacoes:
 *           type: string
 *     Recaida:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         vicio_id:
 *           type: string
 *         data_recaida:
 *           type: string
 *           format: date-time
 *         motivo:
 *           type: string
 *         dias_abstinencia_perdidos:
 *           type: integer
 *     UrgeEvent:
 *       type: object
 *       required: [id, usuario_id, vicio_id, occurred_at, timezone, intensidade, gatilhos]
 *       properties:
 *         id: { type: string, format: uuid }
 *         usuario_id: { type: string, format: uuid }
 *         vicio_id: { type: string, format: uuid }
 *         occurred_at: { type: string, format: date-time, description: Instante normalizado em UTC }
 *         timezone: { type: string, example: America/Sao_Paulo }
 *         intensidade: { type: integer, minimum: 0, maximum: 10 }
 *         gatilhos:
 *           type: array
 *           maxItems: 10
 *           uniqueItems: true
 *           items: { type: string, pattern: '^[a-z][a-z0-9_]{0,39}$' }
 *           description: Catálogo inicial estresse, tedio, situacao_social, rotina, outro; códigos desconhecidos válidos são preservados.
 *         nota: { type: string, nullable: true, maxLength: 1000 }
 *         acao_realizada: { type: string, nullable: true, maxLength: 1000 }
 *         resultado: { type: string, nullable: true, maxLength: 1000 }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     CreateUrgeEventRequest:
 *       type: object
 *       required: [vicio_id, occurred_at, timezone, intensidade]
 *       additionalProperties: false
 *       example:
 *         vicio_id: 5c8d8da4-0453-43c8-8ee1-f196ca743052
 *         occurred_at: '2026-09-27T22:00:00-03:00'
 *         timezone: America/Sao_Paulo
 *         intensidade: 4
 *         gatilhos: [estresse, situacao_social]
 *         nota: Senti vontade após o trabalho.
 *       properties:
 *         vicio_id: { type: string, format: uuid }
 *         occurred_at: { type: string, format: date-time, description: Não mais de cinco minutos no futuro }
 *         timezone: { type: string, example: America/Sao_Paulo }
 *         intensidade: { type: integer, minimum: 0, maximum: 10 }
 *         gatilhos:
 *           type: array
 *           maxItems: 10
 *           uniqueItems: true
 *           items: { type: string, pattern: '^[a-z][a-z0-9_]{0,39}$' }
 *         nota: { type: string, nullable: true, maxLength: 1000 }
 *         acao_realizada: { type: string, nullable: true, maxLength: 1000 }
 *         resultado: { type: string, nullable: true, maxLength: 1000 }
 *     UrgeEventPage:
 *       type: object
 *       required: [vontades, next_cursor, cobertura, atualizado_em]
 *       properties:
 *         vontades: { type: array, items: { $ref: '#/components/schemas/UrgeEvent' } }
 *         next_cursor: { type: string, nullable: true }
 *         cobertura:
 *           type: object
 *           required: [total, retornados, tem_mais]
 *           properties:
 *             total: { type: integer, minimum: 0 }
 *             retornados: { type: integer, minimum: 0 }
 *             tem_mais: { type: boolean }
 *         atualizado_em: { type: string, format: date-time }
 */

/**
 * @openapi
 * /api/v2/auth/login:
 *   post:
 *     tags: [Mobile Auth v2]
 *     summary: Autentica uma conta existente e cria uma sessao mobile revogavel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Access token de 15 minutos e refresh token rotativo
 *       401:
 *         description: Credenciais invalidas
 * /api/v2/auth/refresh:
 *   post:
 *     tags: [Mobile Auth v2]
 *     summary: Rotaciona o refresh token e emite novo access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sessao renovada
 *       401:
 *         description: Token expirado, invalido ou reutilizado; reutilizacao revoga a familia
 *       503:
 *         description: Servico temporariamente indisponivel
 * /api/v2/auth/logout:
 *   post:
 *     tags: [Mobile Auth v2]
 *     summary: Revoga a sessao mobile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Sessao encerrada
 *       401:
 *         description: Access token ausente, expirado ou revogado
 *       503:
 *         description: Servico temporariamente indisponivel
 */

/**
 * @openapi
 * /api/v2/bootstrap:
 *   get:
 *     tags: [Mobile v2]
 *     summary: Carrega o snapshot inicial e métricas históricas do usuário
 *     description: Mantém dias_abstinencia e valor_economizado para clientes antigos; em cada vício, progresso informa sequência atual, recorde, dias distintos com check-in, economia estimada e marcos permanentes com cobertura confirmada, inferida ou desconhecida.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario, vicios com progresso aditivo, registros, recaidas, metas e mensagem
 * /api/v2/account:
 *   delete:
 *     tags: [Mobile v2]
 *     summary: Exclui de forma transacional a conta autenticada e seus dados
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Conta excluida
 */

/**
 * @openapi
 * /api/v2/registros:
 *   post:
 *     tags: [Mobile Offline v2]
 *     summary: Cria um registro diario idempotente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Registro criado ou resposta original repetida
 *       409:
 *         description: Chave usada com outro payload ou ainda em processamento
 * /api/v2/vontades:
 *   post:
 *     tags: [Mobile Offline v2]
 *     summary: Registra um episódio descritivo de vontade, sem criar recaída
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateUrgeEventRequest' }
 *           examples:
 *             episode:
 *               summary: Evento retrospectivo com horário local e fuso explícito
 *               value:
 *                 vicio_id: 5c8d8da4-0453-43c8-8ee1-f196ca743052
 *                 occurred_at: '2026-09-27T22:00:00-03:00'
 *                 timezone: America/Sao_Paulo
 *                 intensidade: 4
 *                 gatilhos: [estresse, situacao_social]
 *                 nota: Senti vontade após o trabalho.
 *     responses:
 *       201:
 *         description: Vontade gravada ou resposta original repetida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [mensagem, vontade]
 *               properties:
 *                 mensagem: { type: string }
 *                 vontade: { $ref: '#/components/schemas/UrgeEvent' }
 *             example:
 *               mensagem: Vontade registrada com sucesso.
 *               vontade:
 *                 id: 7d6d299a-306c-4779-aedf-1327812b6593
 *                 usuario_id: 0a744dd5-9f4f-45a1-bf8e-97a4ecfd90eb
 *                 vicio_id: 5c8d8da4-0453-43c8-8ee1-f196ca743052
 *                 occurred_at: '2026-09-28T01:00:00.000Z'
 *                 timezone: America/Sao_Paulo
 *                 intensidade: 4
 *                 gatilhos: [estresse, situacao_social]
 *                 nota: Senti vontade após o trabalho.
 *                 acao_realizada: null
 *                 resultado: null
 *                 created_at: '2026-09-28T01:05:00.000Z'
 *                 updated_at: '2026-09-28T01:05:00.000Z'
 *       404:
 *         description: Hábito ativo não pertence à conta
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MobileErrorResponse' }
 *             example: { codigo: VICIO_NAO_ENCONTRADO, mensagem: Vício ativo não encontrado., request_id: 9f66f49b-2320-4a52-8b0e-378799e6a813 }
 *       409:
 *         description: Conteúdo diferente para a chave idempotente
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MobileErrorResponse' }
 *             example: { codigo: IDEMPOTENCY_CONFLITO, mensagem: A chave já foi usada com outro conteúdo., request_id: 9f66f49b-2320-4a52-8b0e-378799e6a813 }
 *       422:
 *         description: Momento, fuso, intensidade, gatilhos ou campos inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MobileErrorResponse' }
 *             example:
 *               codigo: DADOS_INVALIDOS
 *               mensagem: Revise os campos informados.
 *               request_id: 9f66f49b-2320-4a52-8b0e-378799e6a813
 *               campos: { intensidade: Use um número inteiro de 0 a 10. }
 *   get:
 *     tags: [Mobile v2]
 *     summary: Consulta eventos por hábito e intervalo de datas locais
 *     description: Datas inclusivas são interpretadas no timezone IANA informado; ordenação estável por instante e UUID. Retorna total, cursor e cobertura sem carregar todo o histórico.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vicio_id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: inicio
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fim
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: timezone
 *         required: true
 *         schema: { type: string, example: America/Sao_Paulo }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Página e cobertura exata do intervalo selecionado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UrgeEventPage' }
 *             example:
 *               vontades: []
 *               next_cursor: null
 *               cobertura: { total: 0, retornados: 0, tem_mais: false }
 *               atualizado_em: '2026-09-28T01:05:00.000Z'
 *       404:
 *         description: Hábito não pertence à conta
 *       422:
 *         description: Filtros ou cursor inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MobileErrorResponse' }
 *             example: { codigo: DADOS_INVALIDOS, mensagem: Revise os filtros informados., request_id: 9f66f49b-2320-4a52-8b0e-378799e6a813 }
 * /api/v2/vicios/{id}/recaida:
 *   post:
 *     tags: [Mobile Offline v2]
 *     summary: Registra uma recaída com chave idempotente e gravação transacional
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Recaída criada ou resposta original repetida
 *       409:
 *         description: Conteúdo diferente para a chave, ou recibo legado ainda em processamento
 * /api/v2/metas:
 *   post:
 *     tags: [Mobile Offline v2]
 *     summary: Cria uma meta com gravação e recibo idempotente na mesma transação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Meta criada ou resposta original repetida
 *       409:
 *         description: Conteúdo diferente para a chave, ou recibo legado ainda em processamento
 * /api/v2/metas/{id}:
 *   patch:
 *     tags: [Mobile Offline v2]
 *     summary: Atualiza conclusão da meta com gravação e recibo idempotente na mesma transação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Meta atualizada ou resposta original repetida
 *       409:
 *         description: Conteúdo diferente para a chave, ou recibo legado ainda em processamento
 */

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Verifica disponibilidade da API
 *     responses:
 *       200:
 *         description: API operacional
 */

/**
 * @openapi
 * /api/auth/cadastro:
 *   post:
 *     tags: [Auth]
 *     summary: Cadastra um usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CadastroRequest'
 *     responses:
 *       201:
 *         description: Usuario cadastrado
 *       400:
 *         description: Dados invalidos
 *       500:
 *         description: Erro interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Realiza login do usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login concluido
 *       401:
 *         description: Credenciais invalidas
 *       500:
 *         description: Erro interno
 */

/**
 * @openapi
 * /api/me:
 *   get:
 *     tags: [Usuario]
 *     summary: Retorna perfil do usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil retornado
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Usuario nao encontrado
 *   patch:
 *     tags: [Usuario]
 *     summary: Atualiza nome do usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome]
 *             properties:
 *               nome:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado
 *       400:
 *         description: Nome obrigatorio
 */

/**
 * @openapi
 * /api/vicios:
 *   get:
 *     tags: [Vicios]
 *     summary: Lista vicios ativos do usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vicios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vicios:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vicio'
 *   post:
 *     tags: [Vicios]
 *     summary: Cria um novo vicio para o usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome_vicio, data_inicio]
 *             properties:
 *               nome_vicio:
 *                 type: string
 *               data_inicio:
 *                 type: string
 *                 format: date-time
 *               valor_economizado_por_dia:
 *                 type: number
 *     responses:
 *       201:
 *         description: Vicio criado
 */

/**
 * @openapi
 * /api/vicios/{id}:
 *   get:
 *     tags: [Vicios]
 *     summary: Busca um vicio especifico com estatisticas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vicio encontrado
 *       404:
 *         description: Vicio nao encontrado
 *   delete:
 *     tags: [Vicios]
 *     summary: Exclui um vicio e dependencias relacionadas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vicio removido
 *       404:
 *         description: Vicio nao encontrado
 */

/**
 * @openapi
 * /api/vicios/{id}/recaida:
 *   post:
 *     tags: [Vicios]
 *     summary: Registra recaida de um vicio
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *               resetarContador:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Recaida registrada
 */

/**
 * @openapi
 * /api/recaidas:
 *   get:
 *     tags: [Recaidas]
 *     summary: Lista recaidas do usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de recaidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recaidas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recaida'
 */

/**
 * @openapi
 * /api/registros:
 *   post:
 *     tags: [Registros]
 *     summary: Cria registro diario de acompanhamento
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vicio_id]
 *             properties:
 *               vicio_id:
 *                 type: string
 *               humor:
 *                 type: string
 *               gatilhos:
 *                 type: string
 *               conquistas:
 *                 type: string
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registro criado
 *       400:
 *         description: Dados invalidos
 */

/**
 * @openapi
 * /api/vicios/{id}/registros:
 *   get:
 *     tags: [Registros]
 *     summary: Lista registros de um vicio
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registros retornados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 registros:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RegistroDiario'
 */

/**
 * @openapi
 * /api/mensagens/diaria:
 *   get:
 *     tags: [Mensagens]
 *     summary: Busca uma mensagem motivacional aleatoria
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo_vicio
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mensagem retornada
 */

/**
 * @openapi
 * /api/metas:
 *   get:
 *     tags: [Metas]
 *     summary: Lista metas do usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de metas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Meta'
 *   post:
 *     tags: [Metas]
 *     summary: Cria uma meta
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [descricao_meta]
 *             properties:
 *               descricao_meta:
 *                 type: string
 *               vicio_id:
 *                 type: string
 *               dias_objetivo:
 *                 type: integer
 *               valor_objetivo:
 *                 type: number
 *     responses:
 *       201:
 *         description: Meta criada
 */

/**
 * @openapi
 * /api/metas/{id}:
 *   patch:
 *     tags: [Metas]
 *     summary: Marca meta como concluida ou nao
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [concluida]
 *             properties:
 *               concluida:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Meta atualizada
 *   delete:
 *     tags: [Metas]
 *     summary: Exclui uma meta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meta removida
 */
