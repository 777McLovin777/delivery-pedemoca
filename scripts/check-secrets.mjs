import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const allowedFiles = new Set([".env.example"]);

const secretPatterns = [
  {
    name: "Secret key (SK)",
    pattern: /\bsk_(?:live|test)_[A-Za-z0-9_-]{16,}\b/gi,
  },
  {
    name: "Private key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    name: "Sensitive assignment",
    pattern:
      /\b(?:SECRET|TOKEN|API_KEY|PRIVATE_KEY)\b\s*[:=]\s*["']?[A-Za-z0-9+/_=-]{16,}["']?/gi,
  },
];

function getTrackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], {
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
}

function isBinary(buffer) {
  const sampleLength = Math.min(buffer.length, 8000);

  for (let index = 0; index < sampleLength; index += 1) {
    if (buffer[index] === 0) {
      return true;
    }
  }

  return false;
}

const findings = [];

for (const file of getTrackedFiles()) {
  if (allowedFiles.has(file)) {
    continue;
  }

  let buffer;

  try {
    buffer = readFileSync(file);
  } catch {
    continue;
  }

  if (isBinary(buffer)) {
    continue;
  }

  const content = buffer.toString("utf8");

  for (const { name, pattern } of secretPatterns) {
    pattern.lastIndex = 0;

    if (pattern.test(content)) {
      findings.push({
        file,
        type: name,
      });
    }
  }
}

if (findings.length > 0) {
  console.error("\nPotential secrets detected:\n");

  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.type}`);
  }

  console.error(
    "\nRemove the secret from the repository and store it in a protected environment variable.",
  );

  process.exit(1);
}

console.log("No potential secrets detected.");
