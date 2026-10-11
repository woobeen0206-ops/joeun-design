import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "../..");
const sourceDir = join(rootDir, "frontend/public/cases");
const deployRoot = join(rootDir, ".deploy");
const outputDir = join(deployRoot, "site");
const manifestPath = join(deployRoot, "deploy-manifest.json");
const entryFiles = [
  "index.html",
  "joeun-design-estimate.html",
  "estimate-wizard.css",
  "estimate-wizard.js",
];
const scanExtensions = new Set([".html", ".css", ".js"]);
const referencePattern = /["'(]([^"'()\s]+\.(?:html|css|js|jpg|jpeg|png|webp|svg|mp3|mp4|webm))(?:[?#][^"'()]*)?["')]/gi;

function isExternal(reference) {
  return reference.startsWith("...") || /^(?:https?:|data:|mailto:|tel:|javascript:|#|\/\/)/i.test(reference);
}

function resolveReference(fromFile, reference) {
  const clean = reference.split(/[?#]/, 1)[0];
  if (!clean || isExternal(clean)) return null;

  const direct = clean.startsWith("/")
    ? join(sourceDir, clean.slice(1))
    : resolve(dirname(fromFile), clean);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;

  const projectAsset = join(sourceDir, "projects-assets", clean.replace(/^\.\//, ""));
  if (existsSync(projectAsset) && statSync(projectAsset).isFile()) return projectAsset;

  throw new Error(`${relative(sourceDir, fromFile)}에서 참조한 파일을 찾을 수 없습니다: ${reference}`);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const queue = entryFiles.map((file) => join(sourceDir, file));
const included = new Set();

while (queue.length) {
  const source = queue.shift();
  if (!source || included.has(source)) continue;
  if (!existsSync(source) || !statSync(source).isFile()) {
    throw new Error(`배포 진입 파일이 없습니다: ${relative(sourceDir, source)}`);
  }
  if (!source.startsWith(`${sourceDir}/`)) {
    throw new Error(`배포 경계를 벗어난 파일 참조: ${source}`);
  }

  included.add(source);
  if (!scanExtensions.has(extname(source).toLowerCase())) continue;

  const contents = readFileSync(source, "utf8");
  for (const match of contents.matchAll(referencePattern)) {
    const target = resolveReference(source, match[1]);
    if (target && !included.has(target)) queue.push(target);
  }
}

const manifest = [...included]
  .sort((a, b) => a.localeCompare(b))
  .map((source) => {
    const path = relative(sourceDir, source);
    const destination = join(outputDir, path);
    const sourceStat = statSync(source);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
    utimesSync(destination, sourceStat.atime, sourceStat.mtime);
    return {
      path,
      bytes: sourceStat.size,
      sha256: sha256(source),
    };
  });

const totalBytes = manifest.reduce((sum, file) => sum + file.bytes, 0);
writeFileSync(
  manifestPath,
  `${JSON.stringify({
    schemaVersion: 1,
    source: "frontend/public/cases",
    output: ".deploy/site",
    fileCount: manifest.length,
    totalBytes,
    files: manifest,
  }, null, 2)}\n`,
  "utf8",
);

console.log(`배포 산출물 생성 완료: ${manifest.length}개 파일, ${(totalBytes / 1024 / 1024).toFixed(1)}MB`);
console.log(`배포 경계: ${outputDir}`);
console.log(`파일 목록: ${manifestPath}`);
