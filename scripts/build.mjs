// Statikus build: data/site.json + sablonok -> dist/
// Futtatás: node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { home, catalog, productPage, impresszum, adatvedelem, notFound } from "../src/pages.mjs";
import { loadProducts } from "./products.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const site = JSON.parse(readFileSync(join(root, "data", "site.json"), "utf8"));

// Környezeti felülírások (pl. GitHub Pages előnézet vs. éles Worker), hogy ne kelljen két site.json.
if (process.env.SITE_URL) site.url = process.env.SITE_URL;
if (process.env.FORM_ENDPOINT !== undefined) site.form.endpoint = process.env.FORM_ENDPOINT || null;

const products = loadProducts(root, site);

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, "src", "assets"), join(dist, "assets"), { recursive: true });
cpSync(join(root, "public"), dist, { recursive: true });
if (existsSync(join(root, "build-assets", "termekek"))) {
  cpSync(join(root, "build-assets", "termekek"), join(dist, "assets", "termekek"), { recursive: true });
}

const pages = {
  "index.html": home(site, products),
  "klimak.html": catalog(site, products),
  "impresszum.html": impresszum(site),
  "adatvedelem.html": adatvedelem(site),
  "404.html": notFound(site),
};
for (const p of products) {
  pages[p.page] = productPage(site, p, products.filter((x) => x.seriesSlug === p.seriesSlug));
}
for (const [file, html] of Object.entries(pages)) writeFileSync(join(dist, file), html);

// Web manifest a site.json-ból.
writeFileSync(join(dist, "site.webmanifest"), JSON.stringify({
  name: site.name, short_name: site.name, lang: "hu", start_url: "./", display: "browser",
  background_color: "#F5F8FA", theme_color: "#0F2238",
  icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png" }, { src: "icon-512.png", sizes: "512x512", type: "image/png" }],
}, null, 2));

// robots.txt és sitemap.xml: indexelés csak éles, saját domainen.
const indexable = !site.noindex && site.url;
writeFileSync(
  join(dist, "robots.txt"),
  indexable ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL("sitemap.xml", site.url).href}\n` : "User-agent: *\nDisallow: /\n"
);
if (indexable) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = Object.keys(pages)
    .filter((f) => f !== "404.html")
    .map((f) => `  <url><loc>${new URL(f === "index.html" ? "" : f, site.url).href}</loc><lastmod>${today}</lastmod></url>`);
  writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
}

// Élesítés előtti hiányzó adatok listája.
const missing = [];
const need = (cond, label) => { if (!cond) missing.push(label); };
const filled = (v) => v !== null && v !== undefined && String(v).trim() !== "";
need(filled(site.phone), "Telefonszám (phone)");
need(filled(site.email), "E-mail-cím (email)");
need(filled(site.serviceArea), "Működési terület (serviceArea)");
need(filled(site.legalName), "Hivatalos cégnév (legalName)");
need(filled(site.legal?.seat), "Székhely (legal.seat)");
need(filled(site.legal?.taxNumber), "Adószám (legal.taxNumber)");
need(filled(site.legal?.registration), "Cégjegyzék-/nyilvántartási szám (legal.registration)");
need(filled(site.legal?.hosting), "Tárhelyszolgáltató adatai (legal.hosting)");
need(filled(site.installation?.price), "Felszerelési költség (installation.price)");
need(filled(site.form?.endpoint), "Ajánlatkérő űrlap végpontja (form.endpoint)");
need(filled(site.url), "Végleges domain (url)");
need(!site.preview, "Előnézeti sáv kikapcsolása (preview: false)");
need(!site.noindex, "Keresők engedélyezése (noindex: false)");
missing.push("Adatkezelési tájékoztató tényleges szövege (adatvedelem.html)");

console.log(`Build kész: ${Object.keys(pages).length} oldal, ${products.length} termék -> dist/`);
if (missing.length) console.log("Élesítés előtt kitöltendő:\n - " + missing.join("\n - "));
