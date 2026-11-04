import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONFIG, validateConfig } from "@/lib/studio-domain";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const row = await prisma.studioSettings.findUnique({ where: { key: "config" } });
    const config = row ? validateConfig(row.value) : DEFAULT_CONFIG;
    return NextResponse.json({ services: config.services.filter(service => service.id && service.name) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Impossible de charger les prestations." }, { status: 503 });
  }
}
