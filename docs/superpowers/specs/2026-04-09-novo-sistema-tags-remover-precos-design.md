# Design: Remover preços da UI + Novo sistema de tags

**Data:** 2026-04-09
**Status:** Aprovado

## Contexto

O site exibe preços nos produtos, mas mantê-los atualizados é trabalho manual excessivo. Sites de ranking brasileiros de referência não mostram preços — usam tags/badges como destaque principal. A mudança reduz trabalho operacional e alinha com o padrão do mercado.

## Decisões

1. **Preços permanecem no banco** — campos `currentPrice` e `oldPrice` ficam no schema Prisma (opcionais), apenas escondidos da UI pública.
2. **Enum Badge substituído** — novo conjunto de 6 tags adaptadas para contexto sem preço.
3. **UI pública sem preços** — remover exibição em ranking e produto.

## Novo Enum Badge

| Valor Prisma       | Label exibido            | Cor de fundo  |
|---------------------|--------------------------|---------------|
| `MELHOR_ESCOLHA`    | Melhor Escolha           | Verde         |
| `CUSTO_BENEFICIO`   | Melhor Custo-Benefício   | Azul          |
| `MAIS_VENDIDO`      | Mais Vendido             | Laranja       |
| `PREMIUM`           | Premium                  | Roxo          |
| `RECOMENDADO`       | Recomendado              | Teal          |
| `BOM_E_BARATO`      | Bom e Barato             | Amarelo       |

## Alterações por área

### Prisma Schema
- Migration para alterar enum `Badge`: remover `BEST_SELLER`, `BEST_VALUE`, `CHEAPEST`; adicionar `MELHOR_ESCOLHA`, `CUSTO_BENEFICIO`, `MAIS_VENDIDO`, `RECOMENDADO`, `BOM_E_BARATO`; manter `PREMIUM`.

### UI Pública — RankingItem (`components/public/RankingItem.tsx`)
- Remover seção de preço (currentPrice, oldPrice, badge de desconto).
- Atualizar cores/labels do badge pill com novo enum.

### UI Pública — Página de Produto (`app/(public)/produto/[slug]/page.tsx`)
- Remover exibição de preço.

### Constants (`lib/constants.ts`)
- Atualizar `BADGE_LABELS` e `BADGE_COLORS` com novo enum.

### Validações (`lib/validations.ts`)
- Atualizar enum Zod de Badge com novos valores.

### Admin — Formulários
- Atualizar select de badge nos forms de produto com as 6 novas opções.
- Campos de preço permanecem nos forms (opcionais como já são).

### SEO / JSON-LD
- Remover `price`/`offers` do structured data de produto se existir.

## Sem alteração
- Estrutura de dados (Product, Ranking, RankingItem)
- Fluxo de server actions
- Campos de preço no banco e nos forms admin
- Importação Top 10 (apenas atualizar enum nos JSONs)
