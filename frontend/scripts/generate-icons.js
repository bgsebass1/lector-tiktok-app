// Genera todos los iconos PWA + favicons + apple-touch desde public/logo-source.svg.
// Uso: npm run generate-icons
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = join(__dirname, "..", "public", "logo-source.svg");
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const sizes = [16, 32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

for (const size of sizes) {
  await sharp(source, { density: 512 })
    .resize(size, size)
    .png()
    .toFile(join(outDir, `icon-${size}.png`));
}

// Apple touch icons opacos (iOS aplica su propia máscara redondeada).
for (const size of [152, 167, 180]) {
  await sharp(source, { density: 512 })
    .resize(size, size)
    .flatten({ background: "#0a0a0a" })
    .png()
    .toFile(join(outDir, `apple-touch-icon-${size}.png`));
}
await sharp(source, { density: 512 })
  .resize(180, 180)
  .flatten({ background: "#0a0a0a" })
  .png()
  .toFile(join(outDir, "apple-touch-icon.png"));

// Favicons
await sharp(source, { density: 512 }).resize(16, 16).png().toFile(join(outDir, "favicon-16.png"));
await sharp(source, { density: 512 }).resize(32, 32).png().toFile(join(outDir, "favicon-32.png"));

// Maskable (10% de padding para el safe-area de Android).
for (const size of [192, 512]) {
  const padding = Math.round(size * 0.1);
  const inner = size - padding * 2;
  await sharp(source, { density: 512 })
    .resize(inner, inner)
    .extend({ top: padding, bottom: padding, left: padding, right: padding, background: "#0a0a0a" })
    .png()
    .toFile(join(outDir, `icon-maskable-${size}.png`));
}

console.log("✅ Iconos generados en public/icons/");
