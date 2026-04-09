# Design: Gerador Automático de Top 10 + Gerenciador de Afiliados

**Data:** 2026-04-09  
**Status:** Aprovado

## Visão Geral

Três componentes que cobrem o ciclo completo de criação de rankings:

1. **Script gerador** — lê fila de tópicos, chama Claude Code CLI com web search, importa DRAFTs no banco e salva TXT de links
2. **TXT de links** — arquivo por ranking com os links do Mercado Livre gerados, para referência ao criar links afiliados
3. **Página `/admin/afiliados`** — interface para substituir links de busca por links afiliados reais e adicionar URLs de imagem

Não requer API externa nem custo adicional — usa a assinatura Claude Code já existente via `claude -p`.

---

## Arquitetura

```
scripts/fila-top10.txt
        ↓
npm run gerar-top10   (scripts/gerar-top10.ts)
        ├── claude -p "prompt completo"   ← Claude Code CLI (web search incluso)
        ├── valida JSON com top10Schema   ← lib/validations.ts
        ├── importa DRAFT via Prisma      ← lib/actions/top10.ts (função core sem auth)
        └── salva prompts/top10-[slug]-links.txt

/admin/afiliados
        ├── lista rankings DRAFT com links de busca pendentes
        ├── campos: link afiliado + imageUrl por produto
        └── Server Action → upsert AffiliateLink + Product.imageUrl
```

---

## Componente 1 — Script Gerador

### Fila (`scripts/fila-top10.txt`)

- Um tópico por linha
- Linhas começando com `#` são comentários (ignoradas)
- Linhas processadas recebem prefixo `✓ ` para não serem re-processadas em execuções futuras
- Exemplo:
  ```
  # Eletrodomésticos
  Top 10 Aspiradores de Pó até R$500 em 2026
  ✓ Top 10 Fornos Elétricos 2026
  ```

### Script (`scripts/gerar-top10.ts`)

Fluxo por tópico:
1. Lê `fila-top10.txt`, filtra linhas pendentes (sem `✓`, sem `#`, não vazias)
2. Monta prompt completo baseado em `prompts/gerar-top10.md`, substituindo `[TÓPICO]`
3. Executa `claude -p "prompt"` via `child_process.execSync`
4. Extrai bloco JSON da resposta (entre o primeiro `{` e o último `}`)
5. Valida com `top10Schema` do Zod
6. Chama `createTop10RankingData(input)` — função core sem auth
7. Salva `prompts/top10-[slug]-links.txt` com os 10 links ML
8. Marca a linha com `✓` no TXT da fila

### Extração da função core (`lib/actions/top10.ts`)

Extrair a lógica de criação do banco para uma função separada sem `requireAdmin()`:

```ts
// lib/actions/top10.ts
export async function createTop10RankingData(input: Top10Input): Promise<Ranking>
  // lógica atual sem requireAdmin()

export async function createTop10Ranking(input: Top10Input) {
  await requireAdmin()
  return createTop10RankingData(input)
}
```

O script importa `createTop10RankingData` diretamente.

### Comando (`package.json`)

```json
"gerar-top10": "tsx scripts/gerar-top10.ts"
```

---

## Componente 2 — TXT de Links

Arquivo gerado em `prompts/top10-[slug]-links.txt`, formato idêntico ao padrão já existente:

```
TOP 10 [TÓPICO] — LINKS MERCADO LIVRE
=======================================
Substitua pelos links diretos/afiliado antes de importar no JSON.

1. [Nome do produto]
   [URL lista.mercadolivre.com.br/...]
...
```

---

## Componente 3 — Página `/admin/afiliados`

### Comportamento

- Lista apenas rankings em **DRAFT** que possuem pelo menos um produto com link ML do tipo busca (`lista.mercadolivre.com.br`)
- Rankings completamente configurados (todos os links afiliados preenchidos) não aparecem
- Agrupado por ranking — um bloco por ranking DRAFT pendente

### Layout por ranking

```
┌─ Top 10 Aspiradores de Pó até R$500 ─────────────────────────────────────────┐
│  Produto              │ Link ML (gerado) ↗  │ Link Afiliado    │ Imagem URL   │
│  Aspirador Electrolux │ lista.ml.../...  🔗  │ [_____________] │ [__________] │
│  Mondial W-200        │ lista.ml.../...  🔗  │ [_____________] │ [__________] │
│                                                              [Salvar ranking] │
└───────────────────────────────────────────────────────────────────────────────┘
```

- Link ML gerado é clicável (abre nova aba)
- "Salvar ranking" envia todos os campos de uma vez
- Campos vazios são ignorados (não sobrescreve o que já existe)

### Server Action (`lib/actions/afiliados.ts`)

```ts
updateRankingAfiliados(items: {
  productId: string
  mercadoLivreUrl?: string
  imageUrl?: string
}[])
```

Para cada item:
- Se `mercadoLivreUrl`: `upsert` em `AffiliateLink` onde `platform = "mercadolivre"`
- Se `imageUrl`: `update` em `Product.imageUrl`

Não requer migração de banco — usa modelos existentes (`AffiliateLink`, `Product`).

---

## Fluxo Completo de Uso

```
1. Edita scripts/fila-top10.txt com os tópicos desejados
2. Roda: npm run gerar-top10
   → Claude pesquisa cada tópico com web search
   → Cria DRAFTs no banco
   → Gera arquivos prompts/top10-*-links.txt
3. Abre /admin/afiliados
   → Clica nos links ML gerados, escolhe o produto certo no ML
   → Gera link afiliado, cola no campo + cola URL da imagem
   → Clica "Salvar ranking"
4. Abre /admin/rankings → revisa cada DRAFT
   → Ajusta o que precisar (preços, textos, badge)
   → Publica
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---|---|
| `scripts/fila-top10.txt` | Criar (fila de tópicos) |
| `scripts/gerar-top10.ts` | Criar (script gerador) |
| `lib/actions/top10.ts` | Modificar (extrair `createTop10RankingData`) |
| `lib/actions/afiliados.ts` | Criar (server action) |
| `app/admin/afiliados/page.tsx` | Criar (página admin) |
| `components/admin/AfiliadosManager.tsx` | Criar (componente de tabela) |
| `package.json` | Modificar (adicionar script `gerar-top10`) |

Sem migração de banco necessária.
