// scripts/gerar-top10.ts
import "dotenv/config";
import { spawnSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { createTop10RankingData } from "../lib/top10-core";
import { top10Schema } from "../lib/validations";
import { slugify } from "../lib/utils";
import { db } from "../lib/db";

const ROOT = join(__dirname, "..");
const FILA_PATH = join(__dirname, "fila-top10.txt");
const PROMPTS_DIR = join(ROOT, "prompts");
const TEMPLATE_PATH = join(PROMPTS_DIR, "gerar-top10.md");

/** Parseia linha da fila: "Top 10 xyz / Categoria" → { topico, categoria } */
function parseLine(line: string): { topico: string; categoria?: string } {
  const parts = line.split("/").map((s) => s.trim());
  if (parts.length >= 2) {
    return { topico: parts[0], categoria: parts.slice(1).join("/").trim() };
  }
  return { topico: parts[0] };
}

function readFila(): string[] {
  return readFileSync(FILA_PATH, "utf8").split("\n");
}

function writeFila(lines: string[]) {
  writeFileSync(FILA_PATH, lines.join("\n"), "utf8");
}

function buildPrompt(topico: string): string {
  return readFileSync(TEMPLATE_PATH, "utf8")
    .replace(/\[DESCREVA AQUI.*?\]/g, topico)
    .replace(/\[TÓPICO\]/g, topico);
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("Nenhum JSON encontrado na resposta");
  let depth = 0;
  let end = start;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  return text.slice(start, end + 1);
}

/** Busca ou cria categoria por nome */
async function resolveCategory(name: string): Promise<string> {
  const slug = slugify(name);
  let category = await db.category.findUnique({ where: { slug } });
  if (!category) {
    category = await db.category.create({
      data: { name: name.trim(), slug, status: "PUBLISHED" },
    });
    console.log(`  📁 Categoria criada: "${name}"`);
  }
  return category.id;
}

/** Salva o JSON na pasta organizada: prompts/{categoria-slug}/top10-{slug}.json */
function saveJson(data: unknown, rankingTitle: string, categoriaSlug?: string): string {
  const dir = categoriaSlug
    ? join(PROMPTS_DIR, categoriaSlug)
    : PROMPTS_DIR;

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const filename = `top10-${slugify(rankingTitle)}.json`;
  const filepath = join(dir, filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2), "utf8");
  return filepath.replace(ROOT + "\\", "").replace(ROOT + "/", "");
}

async function processTopic(topico: string, categoria?: string): Promise<void> {
  console.log(`\n🔄 Gerando: ${topico}${categoria ? ` [${categoria}]` : ""}`);

  const prompt = buildPrompt(topico);

  console.log("  📡 Chamando Claude Code com web search...");
  const result = spawnSync("claude", ["--print", "--model", "claude-sonnet-4-6"], {
    input: prompt,
    encoding: "utf8",
    timeout: 300_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Erro ao chamar Claude: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Claude saiu com código ${result.status}:\nstderr: ${result.stderr}\nstdout: ${result.stdout?.slice(0, 500)}`);
  }

  const output = result.stdout;
  let jsonStr: string;
  try {
    jsonStr = extractJson(output);
  } catch {
    throw new Error("Não foi possível extrair JSON da resposta:\n" + output.slice(0, 800));
  }

  const rawData = JSON.parse(jsonStr);

  // Resolve categoria e injeta no JSON
  let categoryId: string | null = null;
  const categoriaSlug = categoria ? slugify(categoria) : undefined;
  if (categoria) {
    categoryId = await resolveCategory(categoria);
    rawData.ranking.categoryId = categoryId;
    rawData.ranking.categoryName = categoria; // campo custom para o importador
  }

  const parsed = top10Schema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error("JSON inválido: " + JSON.stringify(parsed.error.flatten(), null, 2));
  }

  // Salva JSON organizado em pasta
  const savedPath = saveJson(rawData, rawData.ranking.title, categoriaSlug);
  console.log(`  📄 JSON salvo em ${savedPath}`);

  // Importa no banco como DRAFT
  console.log("  💾 Importando DRAFT no banco...");
  const ranking = await createTop10RankingData(parsed.data);
  console.log(`  ✅ Criado: "${ranking.title}" (id: ${ranking.id})`);
}

async function main() {
  const lines = readFila();
  const pendentes = lines.filter(
    (l) => l.trim() && !l.startsWith("#") && !l.startsWith("✓")
  );

  if (pendentes.length === 0) {
    console.log("Nenhum tópico pendente em scripts/fila-top10.txt");
    return;
  }

  console.log(`🚀 ${pendentes.length} tópico(s) a processar`);

  for (const linha of pendentes) {
    const linhaPura = linha.trim();
    const { topico, categoria } = parseLine(linhaPura);
    try {
      await processTopic(topico, categoria);
      const idx = lines.findIndex((l) => l.trim() === linhaPura);
      if (idx !== -1) lines[idx] = `✓ ${linhaPura}`;
      writeFila(lines);
    } catch (err) {
      console.error(`  ❌ Erro: "${topico}":`, err);
      console.error("  ⏭️  Pulando para o próximo...\n");
    }
  }

  console.log("\n✅ Concluído. Revise os DRAFTs em /admin/rankings.");
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
