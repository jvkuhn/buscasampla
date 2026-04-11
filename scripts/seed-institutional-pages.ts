/**
 * Seed one-shot das 4 páginas institucionais exigidas pelo sub-projeto A
 * (compliance pré-Google Ads). Idempotente: rodar várias vezes não duplica.
 *
 * Executar com: npx tsx scripts/seed-institutional-pages.ts
 *
 * Depois de executar, abrir /admin/paginas, substituir os placeholders
 * ([NOME DO RESPONSÁVEL], [EMAIL DE CONTATO], [CIDADE/UF], [DATA])
 * e mudar o status para PUBLISHED antes de ativar Google Ads.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface PageSeed {
  slug: string;
  title: string;
  metaTitle: string;
  metaDesc: string;
  content: string;
}

const PRIVACIDADE = `# Política de Privacidade

**Última atualização:** [DATA]

Esta Política de Privacidade descreve como a **BuscasAmpla** ("nós", "nosso site") coleta, usa e protege informações dos visitantes ("você"), em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

## 1. Identificação do Controlador

O controlador dos dados é **[NOME DO RESPONSÁVEL]**, operando a marca BuscasAmpla a partir de **[CIDADE/UF]**. Para exercer qualquer direito previsto nesta política, entre em contato pelo e-mail **[EMAIL DE CONTATO]**.

## 2. Dados Coletados

A BuscasAmpla é um site informativo — não exigimos cadastro, login ou envio de dados pessoais para navegação. Os dados tratados são limitados a:

- **Dados de navegação** coletados automaticamente por ferramentas de análise de terceiros (Google Analytics / Google Tag Manager) **apenas após o seu consentimento**: endereço IP (anonimizado pelo Google), tipo de dispositivo, navegador, páginas visitadas, tempo de permanência, origem do tráfego.
- **Preferência de cookies** armazenada no seu próprio navegador (localStorage), nunca em nossos servidores.

## 3. Finalidade do Tratamento

Os dados coletados são utilizados exclusivamente para:

- Medir a audiência e entender quais conteúdos são mais úteis aos leitores;
- Melhorar a experiência de navegação;
- Cumprir obrigações legais.

Nós **não** vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing direto.

## 4. Base Legal (art. 7º da LGPD)

- **Legítimo interesse** para medir e aprimorar o funcionamento do site;
- **Consentimento** do titular para ativação de ferramentas analíticas e de marketing de terceiros, coletado via banner de cookies e revogável a qualquer momento pelo link "Gerenciar cookies" no rodapé.

## 5. Seus Direitos (art. 18 da LGPD)

Você tem o direito de:

- Confirmar a existência de tratamento de seus dados;
- Acessar seus dados;
- Corrigir dados incompletos, inexatos ou desatualizados;
- Solicitar anonimização, bloqueio ou eliminação de dados desnecessários;
- Revogar o consentimento a qualquer momento;
- Solicitar portabilidade ou informação sobre o uso compartilhado dos seus dados.

Para exercer qualquer desses direitos, escreva para **[EMAIL DE CONTATO]**. Responderemos em até 15 dias úteis.

## 6. Compartilhamento com Terceiros

Dados de analytics são tratados por **Google LLC** conforme a política de privacidade do Google (https://policies.google.com/privacy). Nenhum outro terceiro recebe seus dados.

## 7. Cookies

Utilizamos cookies essenciais (para funcionamento do site) e cookies analíticos (apenas após seu consentimento). Detalhes na nossa [Política de Cookies](/p/politica-de-cookies).

## 8. Segurança

Adotamos medidas razoáveis de segurança técnica e organizacional para proteger os dados tratados. Ainda assim, nenhum sistema é totalmente inviolável — recomendamos que você mantenha seu navegador atualizado.

## 9. Menores de Idade

O site não é direcionado a menores de 13 anos. Não coletamos conscientemente dados de crianças.

## 10. Alterações nesta Política

Podemos atualizar esta política a qualquer momento. A data da última atualização fica indicada no topo da página. Mudanças relevantes serão comunicadas com destaque na página inicial.

## Contato

Dúvidas ou solicitações relacionadas a esta política: **[EMAIL DE CONTATO]**.
`;

const TERMOS = `# Termos de Uso

**Última atualização:** [DATA]

Ao acessar o site **BuscasAmpla** ("site"), você concorda com estes Termos de Uso. Se não concordar com qualquer cláusula, por favor não continue navegando.

## 1. Sobre o Site

O BuscasAmpla é um portal **informativo** que publica rankings, análises e comparativos de produtos disponíveis no varejo brasileiro. Não vendemos produtos diretamente e não somos uma loja virtual.

## 2. Natureza dos Conteúdos

Os rankings, avaliações, notas e recomendações publicadas no site são produzidos a partir de pesquisa em fontes públicas (avaliações de clientes, fichas técnicas de fabricantes, comparativos da imprensa especializada). Representam a **opinião editorial** do site e não substituem seu próprio julgamento ao decidir por uma compra.

## 3. Links de Afiliado

O BuscasAmpla participa de programas de afiliados de lojas parceiras (Amazon, Mercado Livre, Shopee, entre outras). Quando você clica em um link "Comprar agora" e realiza uma compra na loja parceira, o site pode receber uma comissão da própria loja — **sem qualquer custo adicional para você**. Mais detalhes na [Política de Afiliados](/p/politica-de-afiliados).

## 4. Isenção de Responsabilidade

Como o site **não vende** os produtos, não nos responsabilizamos por:

- Preço, disponibilidade em estoque, prazo de entrega, forma de pagamento, garantia ou pós-venda — tudo isso é responsabilidade exclusiva da **loja parceira** para a qual você foi redirecionado;
- Variações de preço entre o momento da publicação do conteúdo e o momento da sua visita;
- Decisões de compra tomadas com base nas informações publicadas.

**Antes de finalizar qualquer compra, confira os termos, condições e informações atualizadas diretamente na loja parceira.**

## 5. Propriedade Intelectual

Todo conteúdo do site (textos, imagens, logotipos, layout) é protegido por direitos autorais. É proibida a reprodução, total ou parcial, sem autorização prévia por escrito. Marcas e logotipos de fabricantes exibidos no site pertencem aos respectivos proprietários e são utilizados apenas para finalidade informativa, sem configurar vínculo comercial.

## 6. Conduta Proibida

Você concorda em não:

- Tentar acessar áreas restritas do site (painel administrativo, APIs internas);
- Executar scraping massivo, ataques automatizados ou tentativas de sobrecarga do servidor;
- Republicar o conteúdo sem autorização prévia por escrito;
- Usar o site para fins ilícitos ou que violem direitos de terceiros.

## 7. Alterações no Conteúdo e nos Termos

Produtos, preços e rankings podem ser atualizados ou removidos a qualquer momento, sem aviso prévio. Estes Termos também podem ser modificados — a versão em vigor é sempre a publicada nesta página.

## 8. Legislação e Foro

Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro da comarca de **[CIDADE/UF]** para dirimir quaisquer controvérsias decorrentes do uso do site.

## Contato

Para dúvidas ou solicitações relacionadas a estes Termos: **[EMAIL DE CONTATO]**.
`;

const COOKIES = `# Política de Cookies

**Última atualização:** [DATA]

Esta Política de Cookies explica como o **BuscasAmpla** utiliza cookies e tecnologias similares.

## 1. O que são cookies

Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita um site. Eles servem para lembrar informações entre uma visita e outra (preferências, sessão, estatísticas de uso).

## 2. Cookies utilizados pelo BuscasAmpla

### Cookies essenciais

Necessários para o funcionamento do site. Incluem:

- **Preferência de consentimento de cookies**, armazenada no \`localStorage\` do seu navegador com a chave \`bs-consent\`.

Esses dados **não podem ser desativados**, porque sem eles o site não consegue respeitar a sua escolha sobre cookies. Nenhuma informação pessoal é enviada a terceiros através deles — tudo fica no seu próprio navegador.

### Cookies analíticos (opcionais)

Utilizados para medir a audiência e melhorar o conteúdo. São ativados **apenas após o seu consentimento** no banner de cookies:

- **Google Tag Manager / Google Analytics** — identificador de visitante, páginas visitadas, tempo de permanência. Os dados são tratados pela Google LLC conforme a política de privacidade do Google (https://policies.google.com/privacy).

## 3. Como dar ou retirar consentimento

Na sua primeira visita, um banner no canto inferior da tela pergunta se você aceita ou recusa os cookies não essenciais. Sua escolha é guardada no próprio navegador.

Para **mudar de ideia depois**, clique no link **"Gerenciar cookies"** disponível no rodapé de todas as páginas. O banner reaparece e você pode reescolher.

## 4. Como limpar cookies manualmente

Você também pode apagar a preferência de consentimento diretamente no seu navegador:

- **Chrome**: Configurações → Privacidade e segurança → Cookies e outros dados do site → Ver todos os cookies → localizar "buscasampla" → Excluir.
- **Firefox**: Configurações → Privacidade e Segurança → Cookies e dados do site → Gerenciar dados → localizar "buscasampla" → Remover.
- **Safari**: Preferências → Privacidade → Gerenciar dados do site → localizar "buscasampla" → Remover.

## 5. Cookies de terceiros

Se o Google Analytics estiver ativo (porque você consentiu), o Google pode definir seus próprios cookies. Nós não temos controle direto sobre esses cookies — eles seguem a política de privacidade do Google.

## 6. Mais informações

Para detalhes sobre quais dados são coletados e como são utilizados, veja nossa [Política de Privacidade](/p/politica-de-privacidade).

## Contato

Dúvidas sobre esta política: **[EMAIL DE CONTATO]**.
`;

const AFILIADOS = `# Política de Afiliados

**Última atualização:** [DATA]

O **BuscasAmpla** é um site de conteúdo sustentado por programas de afiliados. Esta página explica de forma transparente como isso funciona, para que você saiba exatamente o que esperar ao navegar.

## O que é marketing de afiliados

Marketing de afiliados é um modelo em que um site de conteúdo (como o BuscasAmpla) recomenda produtos e, quando um leitor clica em um link e compra na loja parceira, o site recebe uma **comissão paga pela própria loja** — nunca pelo consumidor.

## Como isso aparece no BuscasAmpla

Quando você vê um botão **"Comprar agora"** ou qualquer link para Amazon, Mercado Livre, Shopee e outras lojas parceiras em nossos rankings e páginas de produto, trata-se de um **link de afiliado**. Se você clicar nele e finalizar uma compra, o BuscasAmpla pode ganhar uma pequena porcentagem da venda.

**Importante:** o preço que você paga é **exatamente o mesmo** que pagaria abrindo a loja diretamente. A comissão sai da margem da loja parceira, não do seu bolso.

## Lojas parceiras ativas

Atualmente, o BuscasAmpla participa dos programas de afiliados de:

- Amazon Brasil (Programa Associados Amazon);
- Mercado Livre (Programa de Afiliados);
- Shopee (Programa Afiliados Shopee);
- KaBuM!;
- Pichau;
- Outros programas conforme disponibilidade.

Esta lista pode ser atualizada sem aviso conforme novas parcerias são firmadas ou encerradas.

## Independência editorial

Nossas recomendações são baseadas em **pesquisa em fontes públicas** (avaliações de clientes, fichas técnicas, comparativos da imprensa especializada) e refletem a opinião editorial do site. Nós **não aceitamos pagamento** de fabricantes para melhorar a posição de um produto em nossos rankings, nem alteramos notas em troca de compensação.

Se uma loja parceira oferecer comissão maior para um produto específico, isso **não** influencia sua colocação no ranking — continuamos usando apenas os critérios técnicos e de avaliação de mercado.

## Conflitos de interesse

Somos conscientes de que existe um conflito de interesse inerente a sites de afiliados: quanto mais você compra, mais ganhamos. Para mitigar esse conflito:

- Incluímos a seção "Contras" em todas as análises de produto;
- Deixamos claro quando um produto não é o ideal para determinado perfil;
- Destacamos alternativas mais baratas sempre que fazem sentido.

## Como nos apoiar

Se o conteúdo do BuscasAmpla te ajudou a decidir uma compra, a melhor forma de apoiar o site é realizar a compra usando um dos nossos links de afiliado. É gratuito para você e sustenta o trabalho de pesquisa e publicação.

## Contato

Dúvidas ou sugestões sobre esta política: **[EMAIL DE CONTATO]**.
`;

const pages: PageSeed[] = [
  {
    slug: "politica-de-privacidade",
    title: "Política de Privacidade",
    metaTitle: "Política de Privacidade — BuscasAmpla",
    metaDesc: "Como a BuscasAmpla coleta, usa e protege dados dos visitantes em conformidade com a LGPD.",
    content: PRIVACIDADE,
  },
  {
    slug: "termos-de-uso",
    title: "Termos de Uso",
    metaTitle: "Termos de Uso — BuscasAmpla",
    metaDesc: "Termos de uso do site BuscasAmpla, natureza do conteúdo e isenção de responsabilidade sobre produtos de lojas parceiras.",
    content: TERMOS,
  },
  {
    slug: "politica-de-cookies",
    title: "Política de Cookies",
    metaTitle: "Política de Cookies — BuscasAmpla",
    metaDesc: "Como o BuscasAmpla utiliza cookies, como dar ou revogar consentimento e quais ferramentas de terceiros são carregadas após aceitação.",
    content: COOKIES,
  },
  {
    slug: "politica-de-afiliados",
    title: "Política de Afiliados",
    metaTitle: "Política de Afiliados — BuscasAmpla",
    metaDesc: "Como o BuscasAmpla ganha comissão por indicações, quais lojas parceiras participam e como a independência editorial é preservada.",
    content: AFILIADOS,
  },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const p of pages) {
    const existing = await db.sitePage.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`↻ Já existe, pulando: ${p.slug}`);
      skipped++;
      continue;
    }
    await db.sitePage.create({
      data: {
        slug: p.slug,
        title: p.title,
        metaTitle: p.metaTitle,
        metaDesc: p.metaDesc,
        content: p.content,
        status: "DRAFT",
      },
    });
    console.log(`✓ Criada (DRAFT): ${p.slug}`);
    created++;
  }

  console.log(`\nResumo: ${created} criada(s), ${skipped} já existente(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
