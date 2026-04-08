Você vai gerar um Top 10 de produtos no formato JSON exato abaixo, pra eu importar no meu site de rankings.

TÓPICO: [DESCREVA AQUI - ex: "Top 10 fones bluetooth até R$300 em 2026"]
CATEGORIA DO SITE: [ex: Eletrônicos]

REGRAS:
1. Pesquise produtos REAIS disponíveis no varejo brasileiro (Amazon BR, Mercado Livre, Magalu, Shopee) em 2026. Use web search se necessário.
2. Não invente modelos. Se não tiver certeza do código exato, use só o nome comercial.
3. Escreva intro, conclusão, prós, contras e FAQs em português natural, persuasivo, sem soar genérico.
4. Atribua badges com critério: 1 BEST_SELLER (mais vendido), 1 BEST_VALUE (custo-benefício), 1 PREMIUM (top de linha), 1 CHEAPEST (mais barato). Os outros 6 deixe null.
5. Para os campos amazonUrl, mercadoLivreUrl e shopeeUrl, gere URLs de BUSCA com o nome do produto (ex: https://www.amazon.com.br/s?k=NOME+DO+PRODUTO). Não invente links de afiliado.
6. Preços devem ser realistas e atuais (consulte se necessário).
7. Pelo menos 4 FAQs relevantes ao tópico.
8. Retorne APENAS o JSON, sem comentários antes ou depois.

FORMATO EXATO (siga a estrutura, não adicione nem remova campos):

{
  "ranking": {
    "title": "string",
    "subtitle": "string",
    "intro": "string (2-4 frases)",
    "conclusion": "string (2-3 frases)",
    "metaTitle": "string (até 70 chars)",
    "metaDesc": "string (até 160 chars)",
    "categoryId": null
  },
  "products": [
    {
      "name": "string",
      "brand": "string",
      "shortDesc": "string (1 frase)",
      "longDesc": "string (2-3 frases)",
      "imageUrl": "",
      "currentPrice": number ou null,
      "oldPrice": number ou null,
      "rating": number entre 0 e 5,
      "pros": ["string", "string", "string", "string"],
      "cons": ["string", "string"],
      "badge": "BEST_SELLER" | "BEST_VALUE" | "PREMIUM" | "CHEAPEST" | null,
      "amazonUrl": "https://www.amazon.com.br/s?k=...",
      "mercadoLivreUrl": "https://lista.mercadolivre.com.br/...",
      "shopeeUrl": "https://shopee.com.br/search?keyword=..."
    }
  ],
  "faqs": [
    { "question": "string", "answer": "string" }
  ]
}
