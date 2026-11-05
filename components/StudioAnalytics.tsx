"use client";

import { Analytics } from "@vercel/analytics/next";

export function StudioAnalytics() {
  return <Analytics beforeSend={event => {
    const url = new URL(event.url);
    url.pathname = url.pathname.replace(/\/invite\/[^/]+/g, "/invite/[token]");
    url.search = "";
    return { ...event, url: url.toString() };
  }} />;
}
