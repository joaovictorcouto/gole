// Generates the GOLE app icon (water drop) as a 1024x1024 PNG.
// Run via: node scripts/gen-icon.mjs
// Then convert to platform formats with: npm run tauri icon scripts/app-icon.png

import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple water drop with light-blue gradient (matches the brand logo on the
// Welcome screen). Centered on a 1024x1024 transparent canvas.
const svg = `
<svg width="1024" height="1024" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dropGrad" x1="50" y1="15" x2="50" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#BFE8FF"/>
      <stop offset="1" stop-color="#5ABEFF"/>
    </linearGradient>
  </defs>
  <path d="M50 15C50 15 25 45 25 65C25 78.8071 36.1929 90 50 90C63.8071 90 75 78.8071 75 65C75 45 50 15 50 15Z"
        fill="url(#dropGrad)"/>
  <path d="M50 25C50 25 32 48 32 65C32 74.9411 40.0589 83 50 83C59.9411 83 68 74.9411 68 65C68 48 50 25 50 25Z"
        fill="white" fill-opacity="0.22"/>
</svg>
`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1024 },
  background: "transparent",
});
const pngBuffer = resvg.render().asPng();
const outPath = join(__dirname, "app-icon.png");
writeFileSync(outPath, pngBuffer);
console.log("✓ Generated", outPath, `(${pngBuffer.length} bytes)`);
