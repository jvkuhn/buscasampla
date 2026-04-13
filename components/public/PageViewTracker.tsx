"use client";

import { useEffect } from "react";
import { getOrCreateVisitorId } from "@/lib/visitor-cookie";

interface Props {
  pageType: "RANKING" | "PRODUCT" | "CATEGORY";
  slug: string;
}

function detectDeviceType(): "DESKTOP" | "MOBILE" | "TABLET" {
  const ua = navigator.userAgent;
  if (/Tablet|iPad/i.test(ua)) return "TABLET";
  if (/Mobi|Android/i.test(ua)) return "MOBILE";
  return "DESKTOP";
}

function getUtmParam(params: URLSearchParams, key: string): string | null {
  const val = params.get(key);
  return val && val.trim() ? val.trim() : null;
}

export function PageViewTracker({ pageType, slug }: Props) {
  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    const params = new URLSearchParams(window.location.search);

    fetch("/api/pageviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        pageType,
        slug,
        visitorId,
        referrer: document.referrer || null,
        utmSource: getUtmParam(params, "utm_source"),
        utmMedium: getUtmParam(params, "utm_medium"),
        utmCampaign: getUtmParam(params, "utm_campaign"),
        deviceType: detectDeviceType(),
      }),
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
