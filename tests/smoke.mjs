// Böngészős füstteszt (Playwright + Chrome) a kész dist/ mappán.
// Futtatás: node tests/smoke.mjs  [--shots <mappa>]
// Ellenőrzi: oldalak betöltése, helyi fájlok (404), konzolhibák, vízszintes túlcsordulás,
// mobil menü, CTA előválasztás, űrlap validáció, becsületes hiba/siker állapot, adatlap -> űrlap előtöltés.
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
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    ok("mobil alsó sáv: a hero gombjainál rejtve (nem takar)", await page.locator(".mobile-bar").evaluate((el) => el.classList.contains("is-hidden")));
    await page.locator("#markak").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    ok("mobil alsó sáv: görgetés után megjelenik", await page.locator(".mobile-bar").evaluate((el) => !el.classList.contains("is-hidden")));
    await ctx.close();
  }

  // 3) CTA előválasztás + űrlap validáció + becsületes hibaállapot (nincs végpont)
  {
    const { ctx, page } = await newPage(viewports.asztali);
    await page.goto(base, { waitUntil: "load" });
    await page.locator('.fork-door[data-tipus="csak-telepites"]').click();
    ok("CTA: „Csak telepítést szeretnék” előválasztja a típust", await page.locator('input[value="csak-telepites"]').isChecked());
    ok("márka mező felirata a saját készülékhez igazodik", /készüléked/.test(await page.locator("[data-marka-label]").innerText()));

    await page.locator('#ajanlat-form input[value="klima-telepites"]').uncheck().catch(() => {});
    await page.evaluate(() => document.querySelectorAll('input[name="tipus"]').forEach((r) => (r.checked = false)));
    await page.locator("#ajanlat-form button[type=submit]").click();
    const errs = await page.locator(".field-error:not([hidden])").count();
    ok("üres űrlap: hibaüzenetek megjelennek", errs >= 4, `${errs} hiba`);
    ok("nincs e-mail-cím az oldalon (mailto)", (await page.locator("a[href^='mailto:']").count()) === 0);
    ok("alapszerelés szakasz: tartalom és további költségek", (await page.locator("#arak .ticks li").count()) >= 5 && (await page.locator("#arak .price-row").count()) >= 4);
    ok("telefonszám a hirdetés szerint", (await page.locator("a[href='tel:+36703891409']").count()) > 0);
    ok("üres űrlap: nincs sikerüzenet", await page.locator(".form-success").isHidden());
    ok("üres űrlap: első hibás mezőre kerül a fókusz", await page.evaluate(() => document.activeElement?.name === "tipus"));

    await page.locator('input[value="klima-telepites"]').check();
    await page.fill("#nev", "Teszt Elek");
    await page.fill("#telefon", "12");
    await page.locator("#ajanlat-form button[type=submit]").click();
    ok("hibás telefonszám: konkrét hibaüzenet", /telefonszámot/.test(await page.locator("#telefon-hiba").innerText()));
    await page.fill("#telefon", "+36 30 123 4567");
    ok("nincs e-mail mező az űrlapon", (await page.locator("#ajanlat-form input[type=email]").count()) === 0);
    await page.check("#hozzajarulas");
    await page.locator("#ajanlat-form button[type=submit]").click();
    const status = page.locator(".form-status");
    ok("végpont nélkül: egyértelmű hibaüzenet", !(await status.isHidden()) && /nincs bekapcsolva/.test(await status.innerText()));
    ok("végpont nélkül: telefonszám felajánlva", (await status.locator("a[href^='tel:']").count()) === 1);
    ok("végpont nélkül: NINCS hamis sikerüzenet", await page.locator(".form-success").isHidden());
    await ctx.close();
  }

  // 4) Valós végpont szimulálása: siker csak ok:true válasznál, szerverhibánál hibaüzenet
  for (const scenario of ["siker", "szerverhiba"]) {
    const { ctx, page } = await newPage(viewports.mobil);
    await page.route(base + "api/ajanlatkeres", (route) =>
      scenario === "siker"
        ? route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
        : route.fulfill({ status: 503, contentType: "application/json", body: '{"ok":false,"error":"Az online ajánlatkérés jelenleg nem elérhető."}' })
    );
    await page.goto(base, { waitUntil: "load" });
    await page.evaluate(() => document.getElementById("ajanlat-form").setAttribute("data-endpoint", "api/ajanlatkeres"));
    await page.locator('input[value="altalanos"]').check();
    await page.fill("#nev", "Teszt Elek");
    await page.fill("#telefon", "06 30 123 4567");
    await page.check("#hozzajarulas");
    await page.locator("#ajanlat-form button[type=submit]").click();
    if (scenario === "siker") {
      await page.locator(".form-success").waitFor({ state: "visible", timeout: 5000 });
      ok("végpont ok:true: sikerüzenet megjelenik", await page.locator(".form-success").isVisible());
    } else {
      await page.locator(".form-status").waitFor({ state: "visible", timeout: 5000 });
      ok("végpont hiba: hibaüzenet, nincs siker", (await page.locator(".form-success").isHidden()) && /nem elérhető/.test(await page.locator(".form-status").innerText()));
    }
    await ctx.close();
  }

  // 5) Termékadatlap -> ajánlatkérés előtöltés
  if (productPage) {
    const { ctx, page } = await newPage(viewports.mobil);
    await page.goto(base + productPage, { waitUntil: "load" });
    const name = await page.locator("h1").innerText();
    ok("adatlap: ár + alapszerelési ár jelölés", /Ft/.test(await page.locator(".price-now").innerText()) && /alapszerelési ár/.test(await page.locator(".price-install").innerText()));
    ok("adatlap: alapszerelés tartalma lenyitható", (await page.locator(".install-details li").count()) > 3);
    ok("adatlap: műszaki táblázat vagy magyarázat", (await page.locator(".spec-table tr, .specs-note").count()) > 0);
    await page.locator(".price-box .btn").click();
    await page.waitForURL(/klima=/);
    ok("adatlap -> űrlap: típus előválasztva", await page.locator('input[value="klima-telepites"]').isChecked());
    ok("adatlap -> űrlap: üzenet előtöltve a klíma nevével", (await page.locator("#uzenet").inputValue()).includes(name));
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
