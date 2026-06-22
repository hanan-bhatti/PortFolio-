import { NextResponse } from "next/server";
import { setCachedMermaidSvg } from "@/lib/mermaid-cache";

export async function POST(request: Request) {
  try {
    const { code, svg } = await request.json();
    if (!code || !svg) {
      return NextResponse.json({ error: "Missing code or svg" }, { status: 400 });
    }
    setCachedMermaidSvg(code, svg);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to cache mermaid SVG" }, { status: 500 });
  }
}
