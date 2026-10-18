// Termékfotók letöltése saját tárhelyre (CI-ban fut, ahol van internet).
// Eredmény: build-assets/termekek/*.webp (vagy eredeti formátum) + build-assets/image-map.json
// Ha egy kép nem tölthető le, a build az eredeti URL-t használja helyette.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "build-assets", "termekek");
mkdirSync(outDir, { recursive: true });

let sharp = null;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.log("A sharp nincs telepítve: a képek átméretezés nélkül kerülnek fel.");
}

const rawDir = join(root, "data", "products-raw");
const urls = [...new Set(
  readdirSync(rawDir).filter((f) => f.endsWith(".json"))
    .flatMap((f) => JSON.parse(readFileSync(join(rawDir, f), "utf8")))
    .flatMap((p) => p.images || [])
    .filter((u) => /^https?:\/\//.test(u))
)];

const map = {};
let ok = 0, fail = 0;
for (const url of urls) {
  const id = createHash("sha1").update(url).digest("hex").slice(0, 12);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (miklosi-klima build)" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) throw new Error(`nem kép: ${type}`);
    const buf = Buffer.from(await res.arrayBuffer());
    let file;
    if (sharp) {
      file = `${id}.webp`;
      await sharp(buf).resize(900, 900, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(outDir, file));
    } else {
      file = `${id}${extname(new URL(url).pathname) || ".jpg"}`;
      writeFileSync(join(outDir, file), buf);
    }
    map[url] = `assets/termekek/${file}`;
    ok++;
  } catch (e) {
    fail++;
    console.warn(`Nem sikerült: ${url} (${e.message})`);
  }
}
writeFileSync(join(root, "build-assets", "image-map.json"), JSON.stringify(map, null, 2));
console.log(`Képek: ${ok} letöltve, ${fail} sikertelen (${urls.length} összesen).`);
