// Böngészős füstteszt (Playwright + Chrome) a kész dist/ mappán.
// Futtatás: node tests/smoke.mjs  [--shots <mappa>]
// Ellenőrzi: oldalak betöltése, helyi fájlok (404), konzolhibák, vízszintes túlcsordulás,
// mobil menü, hívás gombok (csak telefonos ajánlatkérés), alapszerelési ár, adatlap.
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright-core")); }
catch { ({ chromium } = require("/opt/node-tools/node_modules/playwright-core")); }

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const shotsArg = process.argv.indexOf("--shots");
const shots = shotsArg > -1 ? process.argv[shotsArg + 1] : null;
if (shots) mkdirSync(shots, { recursive: true });
const CHROME = process.env.CHROME_PATH || ["/opt/google/chrome/chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(existsSync);

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".json": "application/json", ".webmanifest": "application/manifest+json", ".txt": "text/plain" };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = join(dist, p);
  if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(existsSync(join(dist, "404.html")) ? readFileSync(join(dist, "404.html")) : "404");
  }
  res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const results = [];
const ok = (name, cond, detail = "") => { results.push({ name, pass: !!cond, detail }); };

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const viewports = { mobil: { width: 375, height: 812 }, tablet: { width: 768, height: 1024 }, asztali: { width: 1440, height: 900 } };
const productPage = JSON.parse(JSON.stringify(readFileSync(join(dist, "klimak.html"), "utf8").match(/href="([a-z0-9-]+-klima-szett\.html)"/)?.[1] || ""));
const pagesToCheck = ["", "klimak.html", productPage, "impresszum.html", "adatvedelem.html"].filter((p) => p !== null);

async function newPage(vp) {
  const ctx = await browser.newContext({ viewport: vp, locale: "hu-HU", reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const problems = [];
  page.on("console", (m) => { if (m.type() === "error" && !/net::ERR|Failed to load resource/.test(m.text())) problems.push("konzol: " + m.text()); });
  page.on("pageerror", (e) => problems.push("JS hiba: " + e.message));
  page.on("response", (r) => { if (r.url().startsWith(base) && r.status() >= 400) problems.push(`${r.status()} ${r.url().replace(base, "/")}`); });
  // Külső hosztok (képek, betűk) ebben a környezetben nem érhetők el: gyorsan megszakítjuk őket.
  await page.route((url) => !url.href.startsWith(base), (route) => route.abort());
  return { ctx, page, problems };
}

try {
  // 1) Minden fő oldal minden méretben
  for (const [vpName, vp] of Object.entries(viewports)) {
    for (const path of pagesToCheck) {
      const { ctx, page, problems } = await newPage(vp);
      const res = await page.goto(base + path, { waitUntil: "load" });
      const label = `${vpName} ${path || "főoldal"}`;
      ok(`${label}: betölt (200)`, res && res.status() === 200, res && res.status());
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(`${label}: nincs vízszintes túlcsordulás`, overflow <= 1, `${overflow}px`);
      const h1 = await page.locator("h1").count();
      ok(`${label}: egy h1`, h1 === 1, h1);
      ok(`${label}: nincs helyi 404 / JS hiba`, problems.length === 0, problems.join("; "));
      if (shots) await page.screenshot({ path: join(shots, `${vpName}-${(path || "index").replace(".html", "")}.png`), fullPage: true });
      await ctx.close();
    }
  }

  // 2) Mobil menü
  {
    const { ctx, page } = await newPage(viewports.mobil);
    await page.goto(base, { waitUntil: "load" });
    const toggle = page.locator(".menu-toggle");
    ok("mobil menü: gomb látszik", await toggle.isVisible());
    await toggle.click();
    ok("mobil menü: kinyílik (aria-expanded=true)", (await toggle.getAttribute("aria-expanded")) === "true");
    await page.locator("#menu a").first().waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
    ok("mobil menü: linkek láthatók", await page.locator("#menu a").first().isVisible());
    await page.keyboard.press("Escape");
    ok("mobil menü: Escape bezárja", (await toggle.getAttribute("aria-expanded")) === "false");
    await toggle.click();
    await page.locator('#menu a[href="#kapcsolat"]').click();
    ok("mobil menü: linkre kattintva bezárul", (await toggle.getAttribute("aria-expanded")) === "false");
    ok("mobil alsó sáv: hívás gomb tel: linkkel", (await page.locator(".mobile-bar a[href^='tel:']").count()) === 1);
    ok("mobil alsó sáv: nincs űrlapra mutató gomb", (await page.locator(".mobile-bar a[href*='#']").count()) === 0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    ok("mobil alsó sáv: a hero gombjainál rejtve (nem takar)", await page.locator(".mobile-bar").evaluate((el) => el.classList.contains("is-hidden")));
    await page.locator("#markak").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    ok("mobil alsó sáv: görgetés után megjelenik", await page.locator(".mobile-bar").evaluate((el) => !el.classList.contains("is-hidden")));
    await ctx.close();
  }

  // 3) Ajánlatkérés csak telefonon: minden CTA hívást indít, nincs űrlap és e-mail
  const site = JSON.parse(readFileSync(join(root, "data", "site.json"), "utf8"));
  const tel = "tel:" + String(site.phone || "").replace(/[^\d+]/g, "");
  {
    const { ctx, page } = await newPage(viewports.asztali);
    await page.goto(base, { waitUntil: "load" });
    ok("nincs űrlap az oldalon", (await page.locator("form").count()) === 0);
    ok("nincs e-mail-cím az oldalon (mailto)", (await page.locator("a[href^='mailto:']").count()) === 0);
    ok("telefonszám a hirdetés szerint", (await page.locator(`a[href='${tel}']`).count()) > 0);
    const forks = await page.locator(".fork-door").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    ok("hero: mindkét gomb hívást indít", forks.length === 2 && forks.every((h) => h === tel), forks.join(", "));
    const svc = await page.locator(".service .btn").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    ok("szolgáltatás gombok hívást indítanak", svc.length === 2 && svc.every((h) => h === tel), svc.join(", "));
    ok("fejléc gomb hívást indít", (await page.locator(".header-cta").getAttribute("href")) === tel);
    ok("kapcsolat: nagy hívógomb", (await page.locator(`#kapcsolat a.call-card[href='${tel}']`).count()) === 1);
    ok("alapszerelés szakasz: ár, tartalom és további költségek", /90\s000\sFt/.test(await page.locator(".install-head strong").innerText()) && (await page.locator("#arak .ticks li").count()) >= 5 && (await page.locator("#arak .price-row").count()) >= 4);
    ok("csak telepítés: alapszerelési ár feltüntetve", /90\s000\sFt/.test(await page.locator("#csak-telepites").innerText()));
    ok("sorozatkártyák: ár alapszereléssel együtt", /alapszereléssel együtt/.test(await page.locator(".series-card").first().innerText()));
    await ctx.close();
  }

  // 4) Termékadatlap: ár + alapszerelési ár, hívás gomb
  if (productPage) {
    const { ctx, page } = await newPage(viewports.mobil);
    await page.goto(base + productPage, { waitUntil: "load" });
    {
      const parse = (t) => Number(t.replace(/[^\d]/g, ""));
      const totalTxt = await page.locator(".price-now").innerText();
      const [dev, inst] = (await page.locator(".price-install").innerText()).split("+").map(parse);
      ok("adatlap: teljes ár = készülék + 90 000 Ft alapszerelés", /alapszereléssel együtt/.test(totalTxt) && inst === 90000 && parse(totalTxt.split("Ft")[0]) === dev + inst, `${totalTxt} | ${dev} + ${inst}`);
    }
    ok("adatlap: alapszerelés tartalma lenyitható", (await page.locator(".install-details li").count()) > 3);
    ok("adatlap: műszaki táblázat vagy magyarázat", (await page.locator(".spec-table tr, .specs-note").count()) > 0);
    ok("adatlap: ajánlat gomb hívást indít", (await page.locator(".price-box .btn").getAttribute("href")) === tel);
    await ctx.close();
  }

  // 6) Billentyűzet: az első Tab a „Ugrás a tartalomhoz” linkre visz, látható fókusszal
  {
    const { ctx, page } = await newPage(viewports.asztali);
    await page.goto(base, { waitUntil: "load" });
    await page.keyboard.press("Tab");
    ok("billentyűzet: ugrólink az első fókusz", await page.evaluate(() => document.activeElement?.classList.contains("skip")));
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "OK  " : "HIBA"} ${r.name}${!r.pass && r.detail !== "" ? ` (${r.detail})` : ""}`);
console.log(`\n${results.length - failed.length}/${results.length} ellenőrzés sikeres.`);
process.exit(failed.length ? 1 : 0);
