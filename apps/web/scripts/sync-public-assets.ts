import path from "node:path";
import { mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";

interface CopySpec {
  from: string;
  to: string;
}

async function safeCopy({ from, to }: CopySpec) {
  if (!existsSync(from)) return;
  await mkdir(path.dirname(to), { recursive: true });
  await copyFile(from, to);
}

export async function syncPublicAssets() {
  const appRoot = path.resolve(import.meta.dir, "..");
  const repoRoot = path.resolve(appRoot, "../..");

  const publicRoot = path.resolve(appRoot, "public");

  await safeCopy({
    from: path.resolve(repoRoot, "apps/mobile/assets/logo.svg"),
    to: path.resolve(publicRoot, "brand/logo.svg"),
  });

  await safeCopy({
    from: path.resolve(repoRoot, "apps/mobile/assets/icon.png"),
    to: path.resolve(publicRoot, "brand/icon.png"),
  });
}

await syncPublicAssets();
