import { NextResponse } from "next/server";
import type { PopularityKind } from "@/services/search/search-popularity";
import {
  getMergedPopularityScores,
  recordPopularityHits,
} from "@/services/search/search-popularity-store";

const KINDS = new Set<PopularityKind>([
  "pill",
  "query",
  "category",
  "city",
  "brand",
  "spec",
]);

export async function GET() {
  const scores = await getMergedPopularityScores();
  return NextResponse.json(
    { scores },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    },
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    hits?: Array<{ kind?: string; key?: string; weight?: number }>;
  };

  const hits = (body.hits ?? [])
    .map((hit) => ({
      kind: hit.kind as PopularityKind,
      key: String(hit.key ?? "").trim(),
      weight: typeof hit.weight === "number" ? hit.weight : 1,
    }))
    .filter((hit) => hit.key && KINDS.has(hit.kind))
    .slice(0, 20);

  if (hits.length === 0) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const scores = await recordPopularityHits(hits);
  return NextResponse.json({ ok: true, scores });
}
