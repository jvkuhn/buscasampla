import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/clicks — registra clique em link de afiliado.
 * Endpoint público (fire-and-forget do lado do cliente).
 * Dados mínimos, sem informações sensíveis.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const productId = typeof body.productId === "string" ? body.productId : null;
    const productName = typeof body.productName === "string" ? body.productName.slice(0, 200) : "unknown";
    const platform = typeof body.platform === "string" ? body.platform.slice(0, 50) : "unknown";
    const url = typeof body.url === "string" ? body.url.slice(0, 2000) : "";

    await db.clickLog.create({
      data: { productId, productName, platform, url },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
