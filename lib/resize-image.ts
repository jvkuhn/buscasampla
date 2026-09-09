"use client";

/**
 * Reduz a imagem no navegador antes de enviar.
 *
 * Motivo: um logo de 927 KB foi parar no Blob e virou 78% do peso da landing —
 * pra ser exibido com 300px de largura. Redimensionar aqui resolve na origem,
 * vale pra toda imagem futura e ainda deixa o upload mais rapido.
 *
 * WebP com qualidade 0.82: acima disso o ganho visual nesse tamanho e
 * imperceptivel e o arquivo cresce rapido.
 */
const LARGURA_MAXIMA = 900;
const QUALIDADE = 0.82;

export async function resizeForUpload(file: File): Promise<File> {
  // Formatos que o canvas nao decodifica (ou que nao vale reprocessar) passam
  // direto — melhor enviar o original do que falhar o upload.
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);

    if (bitmap.width <= LARGURA_MAXIMA) {
      bitmap.close();
      return file;
    }

    const escala = LARGURA_MAXIMA / bitmap.width;
    const canvas = document.createElement("canvas");
    canvas.width = LARGURA_MAXIMA;
    canvas.height = Math.round(bitmap.height * escala);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALIDADE),
    );
    if (!blob || blob.size >= file.size) return file;

    const nome = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], nome, { type: "image/webp" });
  } catch {
    // Qualquer falha de decodificacao cai no original: o upload precisa
    // funcionar mesmo que a otimizacao nao.
    return file;
  }
}
