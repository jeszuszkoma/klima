// Statikus ellenőrzés a kész dist/ mappán: linkek, horgonyok, képek, címek, ismétlődő id-k, angol szöveg, csevegőrobot.
// Futtatás: node scripts/check.mjs   (hiba esetén 1-es kilépési kóddal áll le)
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const errors = [];
const warns = [];
const site = JSON.parse(readFileSync(join(root, "data", "site.json"), "utf8"));

const pages = readdirSync(dist).filter((f) => f.endsWith(".html"));
const docs = Object.fromEntries(pages.map((f) => [f, readFileSync(join(dist, f), "utf8")]));
const ids = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const strip = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");

for (const [file, html] of Object.entries(docs)) {
  if (!/<html lang="hu">/.test(html)) errors.push(`${file}: hiányzik a lang="hu"`);
  if (!/<title>[^<]{10,}<\/title>/.test(html)) errors.push(`${file}: hiányzó vagy túl rövid <title>`);
  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) errors.push(`${file}: hiányzó vagy rövid meta description`);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) errors.push(`${file}: ${h1} db h1 (pontosan 1 kell)`);

  const all = ids(html);
  const dup = all.filter((id, i) => all.indexOf(id) !== i);
  if (dup.length) errors.push(`${file}: ismétlődő id: ${[...new Set(dup)].join(", ")}`);

  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) errors.push(`${file}: alt nélküli kép: ${m[0].slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(m[0]) || !/\sheight="\d+"/.test(m[0])) warns.push(`${file}: méret nélküli kép (CLS): ${m[0].slice(0, 60)}`);
  }

  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const ref = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(ref)) continue;
    const [pathPart, hash] = ref.split("#");
    const cleanPath = pathPart.split("?")[0];
    const target = cleanPath === "" ? file : cleanPath === "./" ? "index.html" : cleanPath.replace(/^\.\//, "");
    if (!existsSync(join(dist, target))) { errors.push(`${file}: hibás hivatkozás: ${ref}`); continue; }
    if (hash && target.endsWith(".html") && !ids(docs[target] || "").includes(hash)) errors.push(`${file}: nem létező horgony: ${ref}`);
  }

  const text = strip(html);
  const english = text.match(/\b(Submit|Read more|Learn more|Contact us|Home page|Click here|Send message|Lorem ipsum|Get a quote|Thank you)\b/i);
  if (english) errors.push(`${file}: angol felhasználói szöveg: "${english[0]}"`);
  if (/\/chat\b|chatbot|csevegő/i.test(html)) errors.push(`${file}: csevegőrobot nyoma`);
  if (/(értékelés|vélemény)ek?\s*\(\d|★/i.test(text)) errors.push(`${file}: értékelésre/csillagra utaló szöveg`);
}

// Telefonszám: kattintható és helyes formátumú.
if (site.phone) {
  const tel = "tel:" + site.phone.replace(/[^\d+]/g, "");
  if (!docs["index.html"].includes(`href="${tel}"`)) errors.push(`index.html: nincs kattintható telefonszám (${tel})`);
  if (!/^\+36 \d{1,2} \d{3} \d{3,4}$/.test(site.phone)) warns.push(`site.json: szokatlan telefonszám-formátum: ${site.phone}`);
}

// Űrlap: soha ne legyen előre látható sikerüzenet.
if (!/class="form-success" hidden/.test(docs["index.html"])) errors.push("index.html: a sikerüzenet nincs alapból elrejtve");

const placeholders = Object.values(docs).reduce((n, h) => n + (h.match(/class="ph"/g) || []).length, 0);
console.log(`${pages.length} oldal ellenőrizve. Kitöltendő jelölések: ${placeholders} db.`);
warns.forEach((w) => console.log("Figyelmeztetés: " + w));
if (errors.length) {
  console.error(`\n${errors.length} hiba:\n - ` + errors.join("\n - "));
  process.exit(1);
}
console.log("Nincs hiba.");
