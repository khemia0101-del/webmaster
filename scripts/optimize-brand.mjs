// Explicit, deterministic asset conversion. Never runs as part of install/build.
import sharp from "sharp";
import { stat } from "node:fs/promises";
const names = ["heating-oil-delivery-lancaster", "hvac-service-technician", "local-service-building"];
for (const name of names) {
  const input = `archive/brand-originals/${name}.png`;
  const output = `public/brand/${name}.webp`;
  await sharp(input).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toFile(output);
  console.log(`${name}: ${(await stat(input)).size} -> ${(await stat(output)).size} bytes`);
}
await sharp("archive/brand-originals/conquistador-oil-logo.png")
  .resize({ width: 512, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 95 })
  .toFile("public/brand/conquistador-oil-logo.png");
console.log(`Logo: ${(await stat("public/brand/conquistador-oil-logo.png")).size} bytes`);
