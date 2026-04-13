import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_PAGE_TYPES = ["RANKING", "PRODUCT", "CATEGORY"] as const;
const VALID_DEVICE_TYPES = ["DESKTOP", "MOBILE", "TABLET"] as const;

type PageType = (typeof VALID_PAGE_TYPES)[number];
type DeviceType = (typeof VALID_DEVICE_TYPES)[number];

/**
 * POST /api/pageviews — registra page view.
 * Endpoint publico (fire-and-forget do lado do cliente).
 * Mesmo padrao do POST /api/clicks.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const pageType = VALID_PAGE_TYPES.includes(body.pageType) ? (body.pageType as PageType) : null;
    if (!pageType) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const deviceType = VALID_DEVICE_TYPES.includes(body.deviceType)
      ? (body.deviceType as DeviceType)
      : "DESKTOP";

    const path = typeof body.path === "string" ? body.path.slice(0, 500) : "";
    const slug = typeof body.slug === "string" ? body.slug.slice(0, 200) : "";
    const visitorId = typeof body.visitorId === "string" ? body.visitorId.slice(0, 36) : "";

    if (!path || !slug || !visitorId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 2000) : null;
    const utmSource = typeof body.utmSource === "string" ? body.utmSource.slice(0, 200) : null;
    const utmMedium = typeof body.utmMedium === "string" ? body.utmMedium.slice(0, 200) : null;
    const utmCampaign = typeof body.utmCampaign === "string" ? body.utmCampaign.slice(0, 200) : null;

    await db.pageView.create({
      data: {
        path,
        pageType,
        slug,
        visitorId,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        deviceType,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
