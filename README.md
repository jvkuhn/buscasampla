# Top Rankings — portal de comparativos e rankings

Portal de listas Top 10 e comparativos de produtos para marketing de afiliados, com site público otimizado para SEO e painel administrativo completo.

**Stack:** Next.js 16 (App Router) · React 19 · Prisma 7 + PostgreSQL · Auth.js v5 · Tailwind 4 · TypeScript

## Rodando localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
AUTH_SECRET="<gere com: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# Opcionais — customizam o usuário criado pelo seed
SEED_ADMIN_EMAIL="admin@admin.com"
SEED_ADMIN_PASSWORD="admin123"
```

Use um banco Postgres local ou um gratuito no [Neon](https://neon.tech).

### 3. Rodar migrations e criar o schema

```bash
npx prisma migrate dev --name init
```

### 4. Popular com dados de exemplo (inclui usuário admin)

```bash
npm run seed
```

Isso cria:
- Usuário admin (`admin@admin.com` / `admin123` por padrão)
- Categorias, produtos e um ranking Top 10 de exemplo
- Configurações iniciais do site e banner da home

### 5. Subir o servidor

```bash
npm run dev
```

- Site público: http://localhost:3000
- Painel admin: http://localhost:3000/admin/login

## Estrutura

```
app/
  (public)/         — site público (home, categorias, ranking, produto, busca, páginas)
  admin/            — painel administrativo protegido
  api/auth/         — rotas do Auth.js
components/
  admin/            — formulários e UI do painel
  public/           — header, footer, cards do site público
lib/
  actions/          — server actions (CRUD por domínio)
  auth.ts           — configuração do Auth.js
  db.ts             — cliente Prisma
  validations.ts    — schemas Zod
prisma/
  schema.prisma     — modelos do banco
  seed.ts           — seed inicial
```

## Deploy no Vercel

1. Push do projeto para GitHub.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. Configure as mesmas variáveis de ambiente do `.env` (use um Postgres gerenciado — Neon, Supabase ou Vercel Postgres).
4. Em **Build Command** deixe o padrão (`next build`) — o Prisma Client é gerado automaticamente pelo `postinstall`/build hooks.
5. Após o primeiro deploy, rode `npx prisma migrate deploy` (localmente apontando para o DB de produção) e `npm run seed` se quiser os dados de exemplo.

## O que já está pronto

- ✅ Autenticação segura (Auth.js + bcrypt) com proteção de rotas via middleware
- ✅ CRUD admin: categorias, produtos (+ links de afiliado), rankings (+ itens ordenáveis + FAQs), banners, páginas institucionais, configurações
- ✅ Site público: home, categorias, ranking Top 10, produto individual, busca, páginas institucionais
- ✅ Metadata dinâmica, Open Graph, canonical, JSON-LD (ItemList, Product, FAQPage)
- ✅ Seed com dados realistas de exemplo

## Próximos passos (pós-MVP)

- `sitemap.xml` e `robots.txt` dinâmicos
- Otimização de imagens externas via `next/image` com remotePatterns
- Paginação nos rankings e busca
- Analytics (GTM já está em Configurações)
