import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "data", "cache");
const CACHE_FILE = path.join(CACHE_DIR, "mermaid.json");

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function getCachedMermaidSvg(code: string): string | null {
  try {
    ensureCacheDir();
    if (!fs.existsSync(CACHE_FILE)) return null;
    const data = fs.readFileSync(CACHE_FILE, "utf-8");
    const cache = JSON.parse(data);
    return cache[code] || null;
  } catch {
    return null;
  }
}

export function setCachedMermaidSvg(code: string, svg: string): void {
  try {
    ensureCacheDir();
    let cache: Record<string, string> = {};
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf-8");
      cache = JSON.parse(data);
    }
    cache[code] = svg;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write mermaid cache:", err);
  }
}
