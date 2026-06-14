// Genera las splash screens de iOS desde public/logo-source.svg.
// Uso: npm run generate-splash
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = join(__dirname, "..", "public", "logo-source.svg");
const outDir = join(__dirname, "..", "public", "splash");
mkdirSync(outDir, { recursive: true });

const splashes = [
  { name: "iphone5_splash.png", width: 640, height: 1136 },
  { name: "iphone6_splash.png", width: 750, height: 1334 },
  { name: "iphoneplus_splash.png", width: 1242, height: 2208 },
  { name: "iphonex_splash.png", width: 1125, height: 2436 },
  { name: "iphonexr_splash.png", width: 828, height: 1792 },
  { name: "iphonexsmax_splash.png", width: 1242, height: 2688 },
];

for (const s of splashes) {
  const logoSize = Math.round(s.width * 0.4);
  const logo = await sharp(source, { density: 512 }).resize(logoSize, logoSize).png().toBuffer();
  await sharp({
    create: { width: s.width, height: s.height, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(outDir, s.name));
}

console.log("✅ Splash screens generadas en public/splash/");
