import sharp from "sharp";

const logoPath = "img/logo.png";
const sizes = [16, 32, 48, 64, 96];

const logo = Bun.file(logoPath);
if (!(await logo.exists())) throw new Error(`Missing ${logoPath} - create the logo first`);

for (const size of sizes) {
  const out = `src/icons/icon-${size}.png`;
  await sharp(await logo.arrayBuffer()).resize(size, size).png().toFile(out);
  console.log(`Wrote ${out}`);
}
