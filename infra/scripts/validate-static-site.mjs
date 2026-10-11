import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "../..");
const siteDir = process.argv[2]
  ? resolve(process.argv[2])
  : join(rootDir, "frontend/public/cases");
const required = [
  "index.html",
  "joeun-design-estimate.html",
  "estimate-wizard.css",
  "estimate-wizard.js",
];
const forbiddenParts = [".DS_Store", "_contact", "_to_delete", "source-images"];
const scanExtensions = new Set([".html", ".css", ".js"]);
const assetPattern = /["'(]([^"'()\s]+\.(?:html|css|js|jpg|jpeg|png|webp|svg|mp3|mp4|webm))(?:[?#][^"'()]*)?["')]/gi;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function localCandidate(fromFile, reference) {
  const clean = reference.split(/[?#]/, 1)[0];
  if (!clean || clean.startsWith("...") || /^(?:https?:|data:|mailto:|tel:|javascript:|#|\/\/)/i.test(clean)) return null;
  if (clean.startsWith("/")) return join(siteDir, clean.slice(1));
  return resolve(dirname(fromFile), clean);
}

const errors = [];
for (const file of required) {
  if (!existsSync(join(siteDir, file))) errors.push(`필수 파일 없음: ${file}`);
}

const files = walk(siteDir);
for (const file of files) {
  const rel = relative(siteDir, file);
  if (forbiddenParts.some((part) => rel.split("/").includes(part))) {
    errors.push(`배포 폴더에 제외 대상이 있음: ${rel}`);
  }
  if (extname(file).toLowerCase() === ".heic") errors.push(`웹 비호환 HEIC 파일: ${rel}`);
}

for (const file of files.filter((path) => scanExtensions.has(extname(path).toLowerCase()))) {
  const contents = readFileSync(file, "utf8");
  for (const match of contents.matchAll(assetPattern)) {
    const reference = match[1];
    let candidate = localCandidate(file, reference);
    if (!candidate) continue;
    if (!existsSync(candidate) && /\.(?:jpg|jpeg|png|webp|svg|mp3|mp4|webm)$/i.test(reference)) {
      candidate = join(siteDir, "projects-assets", reference);
    }
    if (!existsSync(candidate)) {
      errors.push(`${relative(siteDir, file)} → 찾을 수 없음: ${reference}`);
    }
  }
}

if (errors.length) {
  console.error("\n배포 전 검사에서 문제가 발견됐습니다.\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

const totalBytes = files.reduce((sum, file) => sum + statSync(file).size, 0);
console.log(`배포 원본 검사 완료: ${files.length}개 파일, ${(totalBytes / 1024 / 1024).toFixed(1)}MB`);
console.log(`원본 폴더: ${siteDir}`);
