import sharp from "sharp";

const images = ["agua", "aguagas", "coca", "cocazero"];

for (const image of images) {
  const input = `src/assets/${image}.png`;
  const output = `src/assets/${image}-optimized.webp`;

  await sharp(input)
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 92,
    })
    .toFile(output);

  console.log(`Imagem criada: ${output}`);
}
