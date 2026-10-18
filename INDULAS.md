# Élesítés előtti teendők

Az előnézet a GitHub Pages-en fut: https://jeszuszkoma.github.io/klima/
A keresők elől el van rejtve (`noindex`), és felül sárga sáv jelzi, hogy még nem végleges.

## 1. Hiányzó üzleti adatok (`data/site.json`)

| Mező | Mi kell | Állapot |
|---|---|---|
| `name` | Cégnév | ✅ Miklósi Klíma |
| `phone` | Telefonszám | ✅ +36 70 389 1409 |
| `social.facebook` | Facebook-oldal | ✅ megadva |
| `email` | E-mail-cím – **csak az Impresszumba** (az elektronikus kereskedelmi törvény kötelezővé teszi); az oldalon máshol nem jelenik meg, és az űrlapon sincs e-mail mező | ❌ hiányzik |
| `serviceArea` | Működési terület | ✅ Szabolcs-Szatmár-Bereg, Borsod-Abaúj-Zemplén és Hajdú-Bihar vármegye |
| `installation.price` | Alapszerelési ár (saját készülékre is) | ✅ 90 000 Ft |
| `legalName` | Hivatalos név (cég vagy egyéni vállalkozó) | ❌ hiányzik |
| `legal.seat` | Székhely | ❌ hiányzik |
| `legal.taxNumber` | Adószám | ❌ hiányzik |
| `legal.registration` | Cégjegyzék- vagy nyilvántartási szám | ❌ hiányzik |
| `legal.hosting` | Tárhelyszolgáltató neve, címe, elérhetősége (Impresszumhoz) | ❌ hiányzik |
| `hours.rows` | Nyitvatartás / elérhetőség (opcionális) | – |
| `logo` | Logó fájl (opcionális; addig szöveges logó) | – |

A `npm run build` mindig kiírja, mi hiányzik még.

## 2. Jogi oldalak

- **Impresszum** (`impresszum.html`): az 1. pont adataiból automatikusan kitöltődik.
- **Adatkezelési tájékoztató** (`adatvedelem.html`): jelenleg csak a szerkezet van kész. A tényleges szöveget a vállalkozás adatai alapján, lehetőleg szakember segítségével kell megírni (adatkezelő, kezelt adatok, cél és jogalap, megőrzési idő, adatfeldolgozók, érintetti jogok, NAIH).

## 3. Árak

- A klímaárak a gyártók magyarországi webáruházaiból származnak (2026. október 18-i állapot):
  - **Gree:** gree.hu → klimawebaruhaz.com. Itt **nettó** árak szerepelnek; az oldal **27% áfával bruttósítva** mutatja őket. Ha a vállalkozás alanyi adómentes vagy más áfakulccsal számláz, a `productPrices.vatRate` értéket módosítani kell.
  - **Syen:** syen.hu (Cool4U Kft.), **bruttó** árak, több termék akciós („készlet erejéig”).
- Az árak változhatnak: érdemes rendszeresen frissíteni őket (a `data/products-raw/*.json` fájlokban).
- **Alapszerelési ár:** 90 000 Ft, saját készülék felszerelésére is. A klímák oldalon látható ára = készülék bruttó ára + 90 000 Ft alapszerelés (`installation.amount`). A tartalma, a további költségek és a klímatisztítás ára (15 000 Ft) fent van.

## 4. Termékfotók – engedély

A termékfotók a forgalmazók képei (klimawebaruhaz.com, illetve a syen.hu / Cool4U Kft.). A build saját tárhelyre menti őket, de **élesítés előtt kérj írásos engedélyt** a forgalmazóktól a képek és a műszaki adatok használatára, vagy cseréld saját fotókra. Az oldalon nincs stock fotó.

## 5. Ajánlatkérés: csak telefonon

Laci kérésére nincs űrlap és nincs e-mail az oldalon. Minden ajánlatkérő gomb (hero, szolgáltatások, fejléc, mobil sáv, termék-adatlapok) a **+36 70 389 1409** számot hívja. Ha a szám változik, elég a `data/site.json` `phone` mezőjét átírni.

## 6. Domain és keresők

1. Worker egyedi domain beállítása (`miklosiklima.hu`, `www` → átirányítás).
2. `data/site.json`: `url` = a végleges cím, `preview: false`, `noindex: false`.
3. Build után létrejön a `sitemap.xml`, a `robots.txt` engedélyez, és a strukturált adat (schema.org `HVACBusiness`) is bekerül.
4. Google Search Console: oldal hozzáadása, sitemap beküldése.
5. Google Cégprofil: ugyanazokkal a nevekkel és elérhetőségekkel.

## 7. Utolsó ellenőrzés

```bash
npm run build && npm run check && npm run smoke
```
