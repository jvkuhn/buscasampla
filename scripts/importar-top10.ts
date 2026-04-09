// scripts/importar-top10.ts
// Uso: tsx scripts/importar-top10.ts <arquivo.json>
import "dotenv/config";
import { readFileSync } from "fs";
import { createTop10RankingData } from "../lib/top10-core";

const file = process.argv[2];
if (!file) {
  console.error("Uso: tsx scripts/importar-top10.ts <arquivo.json>");
  process.exit(1);
}

const data = JSON.parse(readFileSync(file, "utf8"));
createTop10RankingData(data)
  .then((r) => {
    console.log(`✅ Ranking importado: "${r.title}" (id: ${r.id})`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Erro:", err);
    process.exit(1);
  });
