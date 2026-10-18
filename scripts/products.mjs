// Termékadatok betöltése és egységesítése.
// Forrás: data/products-raw/*.json (a gyártói/forgalmazói webáruházakból gyűjtve, változtatás nélkül).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatFt = (n) =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Ft";

export const formatKw = (kw) => String(kw).replace(".", ",") + " kW";

const findSpec = (specs, patterns) => {
  for (const p of patterns) {
    const row = specs.find((s) => p.test(s.label));
    if (row && String(row.value).trim()) return String(row.value).trim();
  }
  return null;
};

// A sorozatok rövid, saját szavas jellemzése nem kell: csak tényadatokat mutatunk a forrásból.
export function loadProducts(root, site) {
  const dir = join(root, "data", "products-raw");
  if (!existsSync(dir)) return [];
  const mapFile = join(root, "build-assets", "image-map.json");
  const imageMap = existsSync(mapFile) ? JSON.parse(readFileSync(mapFile, "utf8")) : {};
  const vat = 1 + (site.productPrices?.vatRate ?? 27) / 100;
  const ovFile = join(root, "data", "product-overrides.json");
  const ov = existsSync(ovFile) ? JSON.parse(readFileSync(ovFile, "utf8")) : {};
  const excluded = new Set(ov.excludeImages || []);

  const raw = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));

  const out = [];
  const seen = new Set();
  for (const p of raw) {
    if (p.error || !p.name || !Number.isFinite(p.price)) continue;
    const slug = slugify(p.name);
    if (seen.has(slug)) continue;
    seen.add(slug);
    const isNet = String(p.priceLabel).toLowerCase().startsWith("net");
    const gross = isNet ? Math.round(p.price * vat) : p.price;
    const origGross = Number.isFinite(p.originalPrice) ? (isNet ? Math.round(p.originalPrice * vat) : p.originalPrice) : null;
    // A jótállás/garancia a forgalmazó vállalása, nem a vállalkozásé: nem tesszük ki, nehogy félrevezető legyen.
    const specs = (p.specs || []).filter(
      (s) => s && String(s.label || "").trim() && String(s.value ?? "").trim() && !/j[óo]t[áa]ll|garanci/i.test(s.label)
    );
    const fix = (ov.products || {})[slug] || {};
    const seriesExcluded = new Set((ov.excludeImagesBySeries || {})[p.series] || []);
    const images = (p.images || []).filter((u) => /^https?:\/\//.test(u) && !excluded.has(u) && !seriesExcluded.has(u));
    const local = images.map((u) => imageMap[u]).filter(Boolean);
    out.push({
      slug,
      page: `${slug}.html`,
      brand: p.brand,
      series: p.series,
      seriesSlug: slugify(`${p.brand}-${p.series}`),
      name: p.name,
      models: p.models || null,
      capacityKw: p.capacityKw,
      priceGross: gross,
      originalGross: origGross && origGross > gross ? origGross : null,
      priceWasNet: isNet,
      priceNet: isNet ? p.price : null,
      saleNote: p.saleNote || null,
      url: p.url,
      images: local.length ? local : images,
      imagesAreLocal: local.length > 0,
      specs: fix.hideSpecs ? [] : specs,
      specsNote: fix.specsNote || null,
      energyClass: fix.hideSpecs ? null : findSpec(specs, [/energia.?oszt/i, /energiahat/i]),
      seer: fix.hideSpecs ? null : findSpec(specs, [/^seer\b/i, /seer\s*\//i, /seer/i]),
      refrigerant: fix.hideSpecs ? null : findSpec(specs, [/h[űu]t[őo]k[öo]zeg/i]),
    });
  }
  out.sort((a, b) => (a.brand === b.brand ? 0 : a.brand === "Gree" ? -1 : 1) || a.series.localeCompare(b.series, "hu") || a.capacityKw - b.capacityKw);
  return out;
}

export function groupSeries(products) {
  const map = new Map();
  for (const p of products) {
    if (!map.has(p.seriesSlug)) map.set(p.seriesSlug, { slug: p.seriesSlug, brand: p.brand, series: p.series, items: [] });
    map.get(p.seriesSlug).items.push(p);
  }
  return [...map.values()].map((g) => ({
    ...g,
    minPrice: Math.min(...g.items.map((i) => i.priceGross)),
    minKw: Math.min(...g.items.map((i) => i.capacityKw)),
    maxKw: Math.max(...g.items.map((i) => i.capacityKw)),
    image: g.items.find((i) => i.images.length)?.images[0] || null,
    // Energiaosztály csak akkor, ha a sorozat minden méreténél ugyanaz (különben félrevezető lenne).
    energyClass: (() => { const c = [...new Set(g.items.map((i) => i.energyClass))]; return c.length === 1 ? c[0] : null; })(),
  }));
}
