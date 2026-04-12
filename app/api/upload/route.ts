import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Verifica os magic bytes dos primeiros bytes do arquivo pra confirmar que
 * o tipo declarado no Content-Type bate com o conteúdo real. Defesa contra
 * um atacante autenticado subindo, por exemplo, um .exe com Content-Type
 * image/jpeg forjado no multipart.
 *
 * JPEG:  FF D8 FF
 * PNG:   89 50 4E 47 0D 0A 1A 0A
 * WebP:  52 49 46 46 xx xx xx xx 57 45 42 50  ("RIFF....WEBP")
 */
function detectImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Use JPG, PNG ou WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Máximo 4.5MB." },
      { status: 400 }
    );
  }

  // Verifica magic bytes — defesa contra MIME forjado no Content-Type.
  const headerBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const realType = detectImageType(headerBytes);
  if (!realType) {
    return NextResponse.json(
      { error: "Arquivo não é uma imagem JPEG, PNG ou WebP válida." },
      { status: 400 }
    );
  }
  if (realType !== file.type) {
    return NextResponse.json(
      { error: "Tipo do arquivo não bate com a extensão declarada." },
      { status: 400 }
    );
  }

  try {
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Vercel Blob upload error:", err);
    return NextResponse.json(
      { error: "Erro ao salvar imagem. Verifique o BLOB_READ_WRITE_TOKEN." },
      { status: 500 }
    );
  }
}
