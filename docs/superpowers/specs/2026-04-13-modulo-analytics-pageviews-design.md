# Modulo de Analytics: Page Views + Taxa de Conversao

**Data:** 2026-04-13
**Status:** Aprovado para implementacao

## Objetivo

Criar um sistema proprio de rastreio de page views nas paginas de conteudo (rankings, produtos, categorias), independente do Google Analytics, para:

1. **Dados completos** — capturar 100% dos visitantes sem depender de cookie consent do GA4
2. **Taxa de conversao** — cruzar page views com cliques em afiliados para calcular conversao por pagina/produto

## Decisoes de Design

- **Paginas rastreadas:** ranking (`/ranking/[slug]`), produto (`/produto/[slug]`), categoria (`/categorias/[slug]`)
- **Dados coletados:** path, slug, tipo de pagina, referrer, UTM params, device type, visitor ID anonimo
- **Identificacao de visitante:** cookie first-party (`bs-vid`) com UUID anonimo — cookie funcional/analitico proprio, sem dependencia de consent
- **Dashboard:** resumo no dashboard existente (`/admin`) + pagina dedicada (`/admin/analytics`)

---

## 1. Modelo de Dados (Prisma)

### Nova tabela `PageView`

```prisma
enum PageType {
  RANKING
  PRODUCT
  CATEGORY
}

enum DeviceType {
  DESKTOP
  MOBILE
  TABLET
}

model PageView {
  id          String     @id @default(cuid())
  path        String     @db.VarChar(500)    // ex: "/ranking/top10-air-fryer"
  pageType    PageType                       // RANKING, PRODUCT, CATEGORY
  slug        String     @db.VarChar(200)    // slug da entidade visitada
  visitorId   String     @db.VarChar(36)     // UUID do cookie bs-vid
  referrer    String?    @db.VarChar(2000)   // document.referrer
  utmSource   String?    @db.VarChar(200)    // ?utm_source=
  utmMedium   String?    @db.VarChar(200)    // ?utm_medium=
  utmCampaign String?    @db.VarChar(200)    // ?utm_campaign=
  deviceType  DeviceType @default(DESKTOP)
  createdAt   DateTime   @default(now())

  @@index([createdAt])
  @@index([slug, pageType])
  @@index([visitorId])
}
```

**Por que esses indices:**
- `createdAt` — queries por periodo (hoje, 7d, 30d), igual ao ClickLog
- `slug + pageType` — buscar views de um ranking/produto especifico para calcular conversao
- `visitorId` — contar visitantes unicos

**Nao criamos relacao (FK) com Ranking/Product/Category** porque:
- O slug pode mudar ou a entidade ser deletada — o log deve sobreviver independente
- Mesmo padrao do ClickLog (que usa productId como campo solto, sem FK)
- Simplifica o schema e evita cascatas de delete

---

## 2. Cookie de Visitante (`bs-vid`)

### Geracao e leitura

Arquivo: `lib/visitor-cookie.ts` (client-side)

```typescript
// Gera ou le o visitorId do cookie "bs-vid"
// Cookie first-party, SameSite=Lax, max-age=365 dias
// Nao e httpOnly (precisa ser lido pelo JS client-side)
// Nao contem dados pessoais — apenas um UUID v4 aleatorio
```

**Comportamento:**
1. No mount do componente, tenta ler `bs-vid` dos cookies do documento
2. Se nao existir, gera um UUID v4 via `crypto.randomUUID()` e seta o cookie
3. Retorna o visitorId para uso no POST

**Atributos do cookie:**
- `path=/` — disponivel em todas as paginas
- `SameSite=Lax` — protege contra CSRF
- `max-age=31536000` (1 ano)
- Sem `Secure` flag (funciona em localhost tambem, mas em producao o site ja serve HTTPS)
- Sem `httpOnly` (precisa ser acessado pelo JavaScript)

---

## 3. Componente PageViewTracker

Arquivo: `components/public/PageViewTracker.tsx`

Componente "use client" que coleta e envia dados de page view.

### Props

```typescript
interface Props {
  pageType: "RANKING" | "PRODUCT" | "CATEGORY";
  slug: string;
}
```

### Comportamento

1. **Roda uma unica vez** no mount da pagina (`useEffect` com deps vazias)
2. Le ou gera o `visitorId` do cookie `bs-vid`
3. Detecta `deviceType` via regex no `navigator.userAgent`:
   - `/Mobi|Android/i` → MOBILE
   - `/Tablet|iPad/i` → TABLET
   - Demais → DESKTOP
4. Extrai UTM params: `utm_source`, `utm_medium`, `utm_campaign` do `window.location.search`
5. Le `document.referrer` (string vazia se acesso direto)
6. Monta o path: `window.location.pathname`
7. Faz `POST /api/pageviews` com todos os dados — **fire-and-forget** (`.catch(() => {})`)
8. **Nao renderiza nada** (retorna `null`)

### Onde e inserido

O componente e adicionado no JSX das 3 paginas-alvo, passando `pageType` e `slug`:

1. `app/(public)/ranking/[slug]/page.tsx` — `<PageViewTracker pageType="RANKING" slug={slug} />`
2. `app/(public)/produto/[slug]/page.tsx` — `<PageViewTracker pageType="PRODUCT" slug={slug} />`
3. `app/(public)/categorias/[slug]/page.tsx` — `<PageViewTracker pageType="CATEGORY" slug={slug} />`

**Sem risco ao site:** o componente nao interfere no layout, nao bloqueia renderizacao, e falhas no POST sao silenciadas.

---

## 4. API Endpoint

Arquivo: `app/api/pageviews/route.ts`

### POST /api/pageviews

Segue exatamente o mesmo padrao do `POST /api/clicks`:

```
Recebe JSON → valida/sanitiza → cria PageView no banco → retorna { ok: true }
```

**Validacao e sanitizacao:**
- `path`: string, trunca em 500 chars
- `pageType`: deve ser um dos valores do enum (`RANKING`, `PRODUCT`, `CATEGORY`), senao rejeita (400)
- `slug`: string, trunca em 200 chars
- `visitorId`: string, trunca em 36 chars (UUID)
- `referrer`: string ou null, trunca em 2000 chars
- `utmSource`: string ou null, trunca em 200 chars
- `utmMedium`: string ou null, trunca em 200 chars
- `utmCampaign`: string ou null, trunca em 200 chars
- `deviceType`: deve ser um dos valores do enum (`DESKTOP`, `MOBILE`, `TABLET`), default `DESKTOP`

**Respostas:**
- `201 { ok: true }` — registrado com sucesso
- `400 { ok: false }` — dados invalidos ou erro

**Sem autenticacao** — endpoint publico, assim como `/api/clicks`.

---

## 5. Modulo de Queries (lib/analytics.ts)

Arquivo separado para centralizar todas as queries de analytics. Evita poluir o dashboard page com SQL complexo.

### Funcoes exportadas

```typescript
// Contagem de page views por periodo
getPageViewCounts(today: Date, start7d: Date, start30d: Date)
  → { today: number, week: number, month: number }

// Visitantes unicos por periodo
getUniqueVisitorCounts(today: Date, start7d: Date, start30d: Date)
  → { today: number, week: number, month: number }

// Page views por dia (ultimos 30 dias) — para grafico
getPageViewsByDay(start30d: Date)
  → Array<{ day: string, views: number, clicks: number }>
  // Junta dados de PageView e ClickLog no mesmo array para comparacao

// Top paginas por views (ultimos 30 dias)
getTopPages(start30d: Date)
  → Array<{ slug: string, pageType: string, views: number, uniqueVisitors: number, clicks: number, conversionRate: number }>

// Top referrers (ultimos 30 dias)
getTopReferrers(start30d: Date)
  → Array<{ referrer: string, count: number }>

// Distribuicao por device (ultimos 30 dias)
getDeviceDistribution(start30d: Date)
  → Array<{ deviceType: string, count: number, percentage: number }>

// Top UTM campaigns (ultimos 30 dias)
getTopCampaigns(start30d: Date)
  → Array<{ source: string, medium: string, campaign: string, views: number }>

// Taxa de conversao geral (ultimos 30 dias)
getOverallConversion(start30d: Date)
  → { views: number, clicks: number, rate: number }
```

**Calculo da taxa de conversao:**
- Para um ranking/produto especifico: `cliques no slug / views do slug * 100`
- Geral: `total cliques / total views * 100`
- Para cruzar com cliques, usamos o campo `slug` do PageView e comparamos com `productId` (para produtos) ou buscamos os produtos que pertencem ao ranking (para rankings)

**Nota sobre o cruzamento ranking-cliques:**
- Cliques sao registrados por produto (ClickLog.productId)
- Views de ranking sao registradas pelo slug do ranking (PageView.slug onde pageType=RANKING)
- Para calcular conversao de um ranking, somamos os cliques de todos os produtos que pertencem aquele ranking (via RankingItem)
- Isso e feito com uma subquery ou join na funcao `getTopPages`

---

## 6. Dashboard Admin — Resumo (pagina existente /admin)

Arquivo: `app/admin/(dashboard)/page.tsx`

### Alteracoes

Adicionar ao `Promise.all` existente:
- `db.pageView.count({ where: { createdAt: { gte: startOfToday } } })` — views hoje
- `db.pageView.count({ where: { createdAt: { gte: start7d } } })` — views 7d
- `db.pageView.count({ where: { createdAt: { gte: start30d } } })` — views 30d

### Novos elementos na UI

**Secao "Page Views" (depois dos cards de conteudo, antes dos cliques):**
- 3 cards: "Views hoje", "Ultimos 7 dias", "Ultimos 30 dias" — estilo identico aos cards de cliques, mas com cor azul

**Card de conversao (depois dos cards de cliques):**
- 1 card "Taxa de conversao (30d)" — mostra `clicks30d / views30d * 100` como percentual
- Cor: amarela/amber para diferenciar

**Na tabela "Cliques por Produto":**
- Adicionar coluna "Views" e "Conversao" para os produtos que tem page views registradas
- Para calcular: busca views com `pageType=PRODUCT` e `slug` correspondente

### Layout final dos cards

```
[Rankings publicados] [Produtos publicados] [Categorias]

Page Views
[Views hoje]          [Ultimos 7 dias]       [Ultimos 30 dias]

Cliques em Links de Afiliado
[Cliques hoje]        [Ultimos 7 dias]       [Ultimos 30 dias]  [Conversao 30d]

[Grafico diario de cliques] ← mantem como esta

[Tabela de produtos]  ← adiciona colunas Views e Conversao %
```

---

## 7. Pagina Dedicada /admin/analytics

Arquivo: `app/admin/analytics/page.tsx`

### Secoes

**a) Visao Geral (4 cards)**
- "Views (30d)" — total de page views
- "Visitantes unicos (30d)" — COUNT DISTINCT de visitorId
- "Cliques (30d)" — total de cliques (do ClickLog)
- "Conversao (30d)" — cliques / views * 100

**b) Grafico Diario: Views vs Cliques (30 dias)**
- Barras horizontais empilhadas ou lado a lado, mostrando views (azul) e cliques (verde) por dia
- Usa dados de `getPageViewsByDay()`
- Formato de data: "DD/MM"

**c) Tabela: Top Paginas (30 dias)**
- Colunas: Posicao, Pagina (slug + tipo), Views, Visitantes Unicos, Cliques, Conversao %
- Ordenada por views decrescente
- Barra de progresso relativa (igual a tabela de produtos existente)
- Tipo da pagina como badge colorido: "Ranking" (azul), "Produto" (verde), "Categoria" (roxo)

**d) Top Referrers (30 dias)**
- Tabela: Referrer (dominio extraido), Quantidade
- "Acesso direto" para referrer vazio
- Agrupa por dominio (extrai hostname do referrer URL)

**e) Dispositivos (30 dias)**
- 3 barras horizontais: Desktop, Mobile, Tablet
- Mostra quantidade e percentual

**f) Campanhas UTM (30 dias)**
- Tabela: Source, Medium, Campaign, Views
- So aparece se houver dados com UTM
- Secao oculta se nao houver nenhum UTM registrado

### Navegacao

- Adicionar link "Analytics" no menu lateral do admin (sidebar)
- No dashboard (`/admin`), adicionar link "Ver analytics completo →" abaixo da secao de cliques

---

## 8. Sidebar do Admin

Arquivo que contem o menu lateral do admin — adicionar item "Analytics" com icone de grafico, apontando para `/admin/analytics`.

---

## 9. Estrutura de Arquivos (resumo)

```
Arquivos NOVOS:
  lib/visitor-cookie.ts                     — gera/le cookie bs-vid (client-side)
  lib/analytics.ts                          — queries centralizadas de analytics
  components/public/PageViewTracker.tsx      — componente client de coleta
  app/api/pageviews/route.ts                — endpoint POST
  app/admin/analytics/page.tsx              — pagina dedicada de analytics

Arquivos MODIFICADOS:
  prisma/schema.prisma                      — adicionar PageView, PageType, DeviceType
  app/(public)/ranking/[slug]/page.tsx      — adicionar <PageViewTracker>
  app/(public)/produto/[slug]/page.tsx      — adicionar <PageViewTracker>
  app/(public)/categorias/[slug]/page.tsx   — adicionar <PageViewTracker>
  app/admin/(dashboard)/page.tsx            — adicionar cards de views + conversao
  components/admin/Sidebar.tsx (ou similar) — adicionar link Analytics
```

---

## 10. Seguranca e Riscos

### Sem risco ao site existente

- O `PageViewTracker` e fire-and-forget — se o POST falhar, o visitante nao percebe nada
- O componente retorna `null` — nao afeta layout nem renderizacao
- O endpoint `/api/pageviews` segue o mesmo padrao seguro do `/api/clicks` ja existente
- Nenhuma alteracao em componentes existentes (AffiliateLink, ClickLog, auth, etc.)
- A migration Prisma e aditiva (so adiciona tabela e enums, nao altera nada existente)

### Protecao contra abuso

- Strings truncadas em todos os campos (previne payload gigante)
- Validacao de enums (pageType e deviceType devem ser valores validos)
- Sem dados pessoais coletados (visitorId e UUID anonimo, sem IP, sem nome)
- O cookie `bs-vid` nao contem informacao identificavel — e apenas um UUID para agrupar sessoes

### LGPD

- Cookie first-party analitico proprio — classificado como "estritamente necessario" ou "analitico proprio" pela LGPD
- Nao compartilha dados com terceiros
- Nao coleta dados pessoais identificaveis
- Nota: se o usuario quiser ser conservador, pode condicionar o PageViewTracker ao cookie consent tambem — mas isso anularia o beneficio de ter dados independentes do GA4

---

## 11. Migration

```bash
npx prisma migrate dev --name add-pageview-analytics
```

Cria a tabela `PageView` e os enums `PageType` e `DeviceType`. Operacao aditiva, sem risco para dados existentes.
