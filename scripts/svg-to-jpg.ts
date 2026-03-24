/**
 * Rasterize all SVGs under assets/ to JPEG (Android-friendly).
 *
 * Usage: pnpm exec tsx scripts/svg-to-jpg.ts
 *
 * JPEG has no alpha; backgrounds:
 * - spendwise-white.svg → black (white wordmark for dark UI)
 * - everything else → white
 */
import { readdirSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'assets/flags');

const SVG_TO_JPEG_REGEXP = /\.svg$/i;
const PATH_REGEXP = /\\/g;

/** Max width for raster output (height scales, fit inside). */
function targetWidth(absPath: string): number {
  const rel = relative(ROOT, absPath).replace(PATH_REGEXP, '/');
  console.log(rel);
  return 512;
}

function walkSvg(dir: string): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkSvg(p));
    }
    else if (ent.name.endsWith('.svg')) {
      out.push(p);
    }
  }
  return out;
}

function jpegBackground(_svgPath: string): { r: number; g: number; b: number } {
  return { r: 255, g: 255, b: 255 };
}

async function convert(svgPath: string): Promise<void> {
  const rel = relative(ROOT, svgPath);
  const outPath = svgPath.replace(SVG_TO_JPEG_REGEXP, '.jpg');
  const buf = await readFile(svgPath);
  const bg = jpegBackground(svgPath);
  const w = targetWidth(svgPath);

  await sharp(buf, { density: 144 })
    .resize(w, w, { fit: 'inside', withoutEnlargement: false })
    .flatten({ background: bg })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(outPath);

  console.log(`${rel} → ${relative(ROOT, outPath)}`);
}

async function main() {
  const svgs = walkSvg(ASSETS);
  if (svgs.length === 0) {
    console.log('No SVG files under assets/');
    return;
  }
  for (const p of svgs) {
    await convert(p);
    await unlink(p);
  }
  console.log(`Done: ${svgs.length} file(s) converted, SVG sources removed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
