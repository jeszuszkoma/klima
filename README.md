# Miklósi Klíma – weboldal

Klímaszerelés és klímatelepítés: Gree és Syen klímák beszereléssel, vagy csak a telepítés a saját készülékhez.

- **Előnézet (GitHub Pages):** https://jeszuszkoma.github.io/klima/
- **Élesítés előtti teendők:** [INDULAS.md](INDULAS.md)

## Felépítés

```
data/site.json               # MINDEN üzleti adat egy helyen (név, telefon, e-mail, terület, jogi adatok, űrlap, árak)
data/products-raw/*.json     # klímák adatai a gyártói webáruházakból (ár, képek, műszaki adatok – változtatás nélkül)
data/product-overrides.json  # forrásoldali hibák elrejtése (pl. rossz műszaki táblázat, más sorozat képe)
src/pages.mjs                # oldalsablonok (főoldal, klímák, adatlapok, impresszum, adatvédelem, 404)
src/assets/                  # CSS, JS, OG kép
public/                      # favicon, ikonok
scripts/build.mjs            # statikus build -> dist/
scripts/fetch-images.mjs     # termékfotók letöltése saját tárhelyre (CI-ban fut)
scripts/check.mjs            # statikus ellenőrzés (linkek, horgonyok, alt, h1, magyar szöveg)
tests/worker.test.mjs        # az ajánlatkérő végpont egységtesztjei
tests/smoke.mjs              # böngészős füstteszt (Playwright + Chrome)
worker/index.js              # Cloudflare Worker: oldal kiszolgálása + POST /api/ajanlatkeres
wrangler.toml                # Worker beállítások
.github/workflows/pages.yml  # build + ellenőrzés + közzététel GitHub Pages-re
```

Nincs külső futásidejű függőség és nincs keretrendszer: sima HTML, CSS és egy kis JavaScript.

## Parancsok

```bash
npm run build     # dist/ előállítása, a végén kiírja a még kitöltendő adatokat
npm run check     # statikus ellenőrzés
npm test          # Worker egységtesztek
npm run smoke     # böngészős füstteszt (mobil, tablet, asztali)
npm run preview   # helyi előnézet: http://localhost:4321
```

## Adatok frissítése

- **Üzleti adatok:** csak a `data/site.json`-t kell szerkeszteni. A `null` mezők az oldalon `[szögletes zárójelben]` jelennek meg.
- **Felszerelési költség:** `installation.price` (pl. `"89 000 Ft-tól"`). Amíg üres, az oldal csak a „+ felszerelési költség” szöveget mutatja.
- **Klímaárak:** a `data/products-raw/*.json` fájlok a gree.hu (klimawebaruhaz.com) és a syen.hu oldaláról származnak. A dátum a `productPrices.fetchedAt` mezőben. A Gree nettó árakat a build 27% áfával bruttósítja.
- **Árlista (szolgáltatások):** `prices.items` – ha nem üres, külön „Árak” szakasz jelenik meg a főoldalon.

Nincs csevegőrobot, foglalási rendszer, fiók vagy webshop – ezeket a megrendelő nem kérte.
