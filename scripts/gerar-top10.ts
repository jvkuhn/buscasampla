// scripts/gerar-top10.ts
import "dotenv/config";
import { spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createTop10RankingData } from "../lib/top10-core";
import { top10Schema } from "../lib/validations";
import { slugify } from "../lib/utils";

const ROOT = join(__dirname, "..");
const FILA_PATH = join(__dirname, "fila-top10.txt");
const PROMPTS_DIR = join(ROOT, "prompts");
const TEMPLATE_PATH = join(PROMPTS_DIR, "gerar-top10.md");

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

/** Extrai o bloco JSON de nível raiz da resposta do Claude */
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

/** Extrai a seção de links TXT que vem após o JSON */
function extractLinksSection(text: string, jsonEndIdx: number): string {
  const after = text.slice(jsonEndIdx + 1);
  const idx = after.indexOf("LINKS MERCADO LIVRE");
  if (idx === -1) return "";
  const lineStart = after.lastIndexOf("\n", idx);
  return after.slice(lineStart >= 0 ? lineStart + 1 : 0).trim();
}

async function processTopic(topico: string): Promise<void> {
  console.log(`\n🔄 Gerando: ${topico}`);

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
  const parsed = top10Schema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error("JSON inválido: " + JSON.stringify(parsed.error.flatten(), null, 2));
  }

  console.log("  💾 Importando DRAFT no banco...");
  const ranking = await createTop10RankingData(parsed.data);
  console.log(`  ✅ Criado: "${ranking.title}" (id: ${ranking.id})`);

  // Salva TXT de links do Mercado Livre
  const jsonEndIdx = (() => {
    const start = output.indexOf("{");
    let depth = 0;
    for (let i = start; i < output.length; i++) {
      if (output[i] === "{") depth++;
      else if (output[i] === "}") { depth--; if (depth === 0) return i; }
    }
    return output.length - 1;
  })();

  const linksSection = extractLinksSection(output, jsonEndIdx);
  if (linksSection) {
    const slug = slugify(ranking.title);
    const linksPath = join(PROMPTS_DIR, `top10-${slug}-links.txt`);
    writeFileSync(linksPath, linksSection, "utf8");
    console.log(`  📄 Links salvos em prompts/top10-${slug}-links.txt`);
  }
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

  for (const topico of pendentes) {
    const topicoPuro = topico.trim();
    try {
      await processTopic(topicoPuro);
      const idx = lines.findIndex((l) => l.trim() === topicoPuro);
      if (idx !== -1) lines[idx] = `✓ ${topicoPuro}`;
      writeFila(lines);
    } catch (err) {
      console.error(`  ❌ Erro: "${topicoPuro}":`, err);
      console.error("  ⏭️  Pulando para o próximo...\n");
    }
  }

  console.log("\n✅ Concluído. Revise os DRAFTs em /admin/rankings.");
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
