import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SOURCE = fileURLToPath(new URL("../src/ui/assets/icons/twince_logo.svg", import.meta.url));
const OUT = fileURLToPath(new URL("../public/", import.meta.url));

const BRAND = "#EB7805";
const MARK_W = 25;
const MARK_H = 22;

const TAB_PX = 32;
const APPLE_PX = 180;
const APPLE_MARK_RATIO = 0.62;
const APPLE_RADIUS = 0;

const source = readFileSync(SOURCE, "utf8");
const paths = [...source.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map((m) => m[1]);
if (paths.length === 0) throw new Error(`no <path d> found in ${SOURCE}`);

const marks = (fill) => paths.map((d) => `<path d="${d}" fill="${fill}"/>`).join("\n");

const square = (px, markW, fill, bg) => {
  const markH = (markW * MARK_H) / MARK_W;
  const x = (px - markW) / 2;
  const y = (px - markH) / 2;
  const scale = markW / MARK_W;
  return `<svg width="${px}" height="${px}" viewBox="0 0 ${px} ${px}" xmlns="http://www.w3.org/2000/svg">
${bg ? `<rect width="${px}" height="${px}" rx="${APPLE_RADIUS}" fill="${bg}"/>` : ""}
<g transform="translate(${x} ${y}) scale(${scale})">
${marks(fill)}
</g>
</svg>`;
};

writeFileSync(
  new URL("favicon.svg", `file://${OUT}`),
  `<svg width="${MARK_W}" height="${MARK_H}" viewBox="0 0 ${MARK_W} ${MARK_H}" xmlns="http://www.w3.org/2000/svg">
<style>
path { fill: #000; }
@media (prefers-color-scheme: dark) { path { fill: #fff; } }
</style>
${marks("").replace(/ fill=""/g, "")}
</svg>
`
);

const png = (name, svg, px) =>
  sharp(Buffer.from(svg)).resize(px, px).png({ compressionLevel: 9 }).toFile(`${OUT}${name}`);

await png("favicon-32.png", square(TAB_PX, TAB_PX, BRAND, null), TAB_PX);
await png("apple-touch-icon.png", square(APPLE_PX, APPLE_PX * APPLE_MARK_RATIO, "#fff", BRAND), APPLE_PX);

console.log("generated: favicon.svg, favicon-32.png, apple-touch-icon.png");
