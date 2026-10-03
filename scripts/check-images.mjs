import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { extname } from "node:path";

const ASSETS_DIRECTORY = "src/assets";
const MAX_IMAGE_SIZE_MB = 1;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const supportedExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
]);

function getTrackedFiles() {
  return execFileSync("git", ["ls-files", `${ASSETS_DIRECTORY}/`], {
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .filter(Boolean);
}

const oversizedImages = [];

for (const file of getTrackedFiles()) {
  const extension = extname(file).toLowerCase();

  if (!supportedExtensions.has(extension)) {
    continue;
  }

  const sizeBytes = statSync(file).size;

  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    oversizedImages.push({
      file,
      sizeMB: sizeBytes / 1024 / 1024,
    });
  }
}

if (oversizedImages.length > 0) {
  console.error(
    `\nImages larger than ${MAX_IMAGE_SIZE_MB} MB were detected:\n`,
  );

  for (const image of oversizedImages) {
    console.error(`- ${image.file}: ${image.sizeMB.toFixed(2)} MB`);
  }

  console.error(
    "\nOptimize these images before committing them to the repository.",
  );

  process.exit(1);
}

console.log(`All tracked images are within the ${MAX_IMAGE_SIZE_MB} MB limit.`);
