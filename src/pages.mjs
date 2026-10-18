// Oldalsablonok. Minden üzleti adat a data/site.json-ból jön (site paraméter).
import { esc, has, fill, telHref, formatAddress, icon, brandMark, unsplash, srcset } from "./lib.mjs";
import { groupSeries, formatFt, formatKw } from "../scripts/products.mjs";

// Képek (Unsplash licenc: szabadon felhasználható, forrásmegjelölés nem kötelező).
// Illusztrációk, NEM a vállalkozás saját munkái – az alt szövegek is ezt tükrözik.
const IMG = {
  // Klíma nélküli lakásbelső: nem mutat idegen márkájú készüléket.
  room: "photo-1628744876497-eb30460be9f6", // világos, modern nappali
};

const NAV = [
  ["szolgaltatasok", "Szolgáltatások"],
  ["markak", "Gree és Syen klímák"],
  ["csak-telepites", "Csak telepítés"],
  ["miert", "Miért mi"],
  ["kapcsolat", "Kapcsolat"],
];

/* ---------- közös váz ---------- */

export function layout(site, { title, description, path = "", body, robots, isHome = false }) {
  const v = site.assetVersion;
  const canonical = has(site.url) ? new URL(path, site.url).href : null;
  const ogImage = has(site.url) ? new URL(site.seo.ogImage, site.url).href : site.seo.ogImage;
  const noindex = robots === "noindex" || site.noindex;
  return `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ""}${canonical ? `<link rel="canonical" href="${esc(canonical)}">\n` : ""}<meta name="theme-color" content="#0F2238">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">\n` : ""}<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg?v=${v}" type="image/svg+xml">
<link rel="icon" href="favicon-32.png?v=${v}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png?v=${v}">
<link rel="manifest" href="site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://images.unsplash.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Figtree:wght@400;500;600&display=swap">
<link rel="stylesheet" href="assets/css/style.css?v=${v}">
${jsonLd(site)}</head>
<body>
<a class="skip" href="#tartalom">Ugrás a tartalomhoz</a>
${site.preview ? previewBanner() : ""}${header(site, isHome)}
<main id="tartalom">
${body}
</main>
${footer(site)}
${mobileBar(site, isHome)}<script src="assets/js/main.js?v=${v}" defer></script>
</body>
</html>
`;
}

function previewBanner() {
  return `<div class="preview-bar" role="note">
  <div class="wrap">Előnézet: a <span class="ph">[szögletes zárójeles]</span> adatok kitöltésre várnak, az oldal még nem végleges.</div>
</div>
`;
}

// Strukturált adat csak valós, megadott tényekből (néven felül legalább egy elérhetőség és URL kell).
function jsonLd(site) {
  if (!has(site.name) || !has(site.url) || !(has(site.phone) || has(site.email))) return "";
  const data = {
    "@context": "https://schema.org",
    "@type": site.schemaType,
    name: site.name,
    url: site.url,
  };
  if (has(site.phone)) data.telephone = site.phone.replace(/\s+/g, "");
  if (has(site.email)) data.email = site.email;
  if (has(site.serviceArea)) data.areaServed = site.serviceArea;
  const a = site.address || {};
  if (has(a.city)) {
    data.address = { "@type": "PostalAddress", addressCountry: a.country || "HU", addressLocality: a.city };
    if (has(a.zip)) data.address.postalCode = a.zip;
    if (has(a.street)) data.address.streetAddress = a.street;
  }
  const sameAs = Object.values(site.social || {}).filter(has);
  if (sameAs.length) data.sameAs = sameAs;
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>\n`;
}

function logo(site, href = "./") {
  const inner = has(site.logo)
    ? `<img src="${esc(site.logo)}" alt="${esc(site.name)}" width="160" height="40">`
    : `${brandMark()}<span class="brand-name">${fill(site.name, "Cégnév")}</span>`;
  return `<a class="brand" href="${href}" aria-label="${esc(site.name || "Kezdőlap")} – kezdőlap">${inner}</a>`;
}

function header(site, home) {
  const base = home ? "" : "./";
  const links = NAV.map(([id, label]) => `<li><a href="${base}#${id}">${label}</a></li>`).join("");
  return `<header class="site-header">
  <div class="wrap header-inner">
    ${logo(site)}
    <nav class="main-nav" aria-label="Fő navigáció">
      <ul id="menu" class="menu">${links}</ul>
    </nav>
    <div class="header-actions">
      ${has(site.phone) ? `<a class="header-phone" href="${telHref(site.phone)}">${icon("phone")}<span>${esc(site.phone)}</span></a>` : ""}
      <a class="btn btn-primary btn-sm header-cta" href="${base}#ajanlatkeres" data-tipus="klima-telepites">Ajánlatot kérek</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menü megnyitása">
        ${icon("menu", "icon icon-open")}${icon("close", "icon icon-close")}
      </button>
    </div>
  </div>
</header>
`;
}

function footer(site) {
  const a = site.address || {};
  const addr = has(a.city) ? formatAddress(a) : null;
  const year = new Date().getFullYear();
  const social = Object.entries(site.social || {}).filter(([, u]) => has(u));
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <div class="brand brand-inverse">${brandMark()}<span class="brand-name">${fill(site.name, "Cégnév")}</span></div>
      <p>Klímaszerelés és klímatelepítés. Gree és Syen klímák beszereléssel, vagy csak a telepítés a saját készülékedhez.</p>
    </div>
    <nav class="footer-col" aria-label="Lábléc navigáció">
      <h2>Oldal</h2>
      <ul>
        <li><a href="./#szolgaltatasok">Szolgáltatások</a></li>
        <li><a href="./#markak">Gree és Syen klímák</a></li>
        <li><a href="./#csak-telepites">Klímaszerelés saját készülékkel</a></li>
        <li><a href="./#gyik">Gyakori kérdések</a></li>
        <li><a href="./#ajanlatkeres">Ajánlatkérés</a></li>
      </ul>
    </nav>
    <div class="footer-col">
      <h2>Elérhetőség</h2>
      <ul class="footer-contact">
        <li>${icon("phone")}${has(site.phone) ? `<a href="${telHref(site.phone)}">${esc(site.phone)}</a>` : fill(null, "Telefonszám")}</li>
        <li>${icon("pin")}<span>Működési terület: ${fill(site.serviceArea, "működési terület")}</span></li>
        ${addr ? `<li>${icon("pin")}<span>${esc(addr)}</span></li>` : ""}
      </ul>
      ${social.length ? `<ul class="footer-social">${social.map(([k, u]) => `<li><a href="${esc(u)}" rel="noopener">${k === "facebook" ? "Facebook" : k === "instagram" ? "Instagram" : esc(k)}</a></li>`).join("")}</ul>` : ""}
    </div>
    <div class="footer-col">
      <h2>Jogi információk</h2>
      <ul>
        <li><a href="impresszum.html">Impresszum</a></li>
        <li><a href="adatvedelem.html">Adatkezelési tájékoztató</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <p>© ${year} ${fill(site.legalName || site.name, "Cégnév")}</p>
    <p>Fotók: <a href="https://unsplash.com" rel="noopener">Unsplash</a> (illusztráció)</p>
  </div>
</footer>
`;
}

function mobileBar(site, home) {
  const base = home ? "" : "./";
  return `<div class="mobile-bar" data-mobile-bar>
  ${has(site.phone) ? `<a class="btn btn-ghost-dark" href="${telHref(site.phone)}">${icon("phone")}Hívás</a>` : ""}
  <a class="btn btn-primary" href="${base}#ajanlatkeres" data-tipus="klima-telepites">Ajánlatot kérek</a>
</div>
`;
}

/* ---------- főoldal ---------- */

export function home(site, products = []) {
  const body = [
    hero(site),
    services(),
    brands(site, products),
    prices(site),
    whyPro(),
    process(site),
    faq(),
    contact(site),
  ].join("\n");
  return layout(site, { title: `${site.seo.title} | ${site.name}`, description: site.seo.description, path: "", body, isHome: true });
}

function hero(site) {
  return `<section class="hero" aria-labelledby="hero-cim">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <h1 id="hero-cim">Klíma, amitől tényleg jó otthon lenni.</h1>
      <p class="lead">Gree és Syen klímák szakszerű beszereléssel. Ha a készülék már megvan, a telepítést akkor is vállalom.</p>
      <div class="fork" role="group" aria-label="Válaszd ki, mire van szükséged">
        <a class="fork-door" href="#ajanlatkeres" data-tipus="klima-telepites">
          <span class="fork-kicker">Még nincs klímám</span>
          <span class="fork-title">Ajánlatot kérek</span>
          <span class="fork-text">Segítek kiválasztani a készüléket, és be is szerelem.</span>
        </a>
        <a class="fork-door" href="#ajanlatkeres" data-tipus="csak-telepites">
          <span class="fork-kicker">Már megvan a klímám</span>
          <span class="fork-title">Csak telepítést szeretnék</span>
          <span class="fork-text">A saját készülékedet szerelem be, vásárlási kötelezettség nélkül.</span>
        </a>
      </div>
      ${has(site.phone) ? `<p class="hero-call">${site.freeSurvey ? "<strong>Ingyenes felmérés.</strong> " : ""}Inkább beszélnél velem? Hívj: <a href="${telHref(site.phone)}">${esc(site.phone)}</a></p>` : ""}
    </div>
    <figure class="hero-media">
      <img src="${unsplash(IMG.room, 900, 1100)}" srcset="${srcset(IMG.room, [480, 720, 900, 1200], 1100 / 900)}" sizes="(min-width: 960px) 44vw, 100vw" width="900" height="1100" alt="Világos, modern nappali kanapékkal" fetchpriority="high" decoding="async">
    </figure>
  </div>
</section>`;
}

function services() {
  return `<section id="szolgaltatasok" class="section" aria-labelledby="szolg-cim">
  <div class="wrap">
    <header class="section-head">
      <h2 id="szolg-cim">Kétféleképpen segítek</h2>
      <p>Választhatod a készüléket és a beszerelést együtt, vagy csak a telepítést kéred tőlem. Mindkettőt ugyanolyan szívesen vállalom.</p>
    </header>
    <div class="service-grid">
      <article class="service" aria-labelledby="szolg-1">
        <p class="service-tag">Ha még nincs klímád</p>
        <h3 id="szolg-1">Klíma és telepítés</h3>
        <p>Átbeszélem veled, milyen helyiségbe és milyen igényekre keresel klímát, és segítek kiválasztani a megfelelő Gree vagy Syen készüléket. Utána szakszerűen be is szerelem.</p>
        <ul class="ticks">
          <li>${icon("check")}Segítség a készülék kiválasztásában</li>
          <li>${icon("check")}Gree és Syen klímák</li>
          <li>${icon("check")}Választás és beszerelés egy helyen</li>
        </ul>
        <a class="btn btn-primary" href="#ajanlatkeres" data-tipus="klima-telepites">Klímát szeretnék</a>
      </article>
      <article id="csak-telepites" class="service service-alt" aria-labelledby="szolg-2">
        <p class="service-tag">Ha már megvan a klímád</p>
        <h3 id="szolg-2">Klímaszerelés saját készülékkel</h3>
        <p>Már megvetted a klímát? Akkor csak a telepítést kérd tőlem. Írd meg, milyen készüléked van, és egyeztetek veled a beszerelés részleteiről.</p>
        <ul class="ticks">
          <li>${icon("check")}Nem kell nálam vásárolnod</li>
          <li>${icon("check")}A saját készüléked szakszerű beszerelése</li>
          <li>${icon("check")}Egyeztetés a készülék adatai alapján</li>
        </ul>
        <a class="btn btn-primary" href="#ajanlatkeres" data-tipus="csak-telepites">Telepítést kérek</a>
      </article>
    </div>
  </div>
</section>`;
}

function brands(site, products) {
  const series = groupSeries(products);
  const count = (b) => series.filter((g) => g.brand === b).length;
  const panel = (b, cls, text, link) => `<article class="brand-panel ${cls}" aria-labelledby="${b.toLowerCase()}-cim">
        <h3 id="${b.toLowerCase()}-cim" class="brand-word">${b}</h3>
        <p>${text}</p>
        ${link}
      </article>`;
  return `<section id="markak" class="section section-tint" aria-labelledby="markak-cim">
  <div class="wrap">
    <header class="section-head">
      <h2 id="markak-cim">Gree és Syen klímák</h2>
      <p>Ezzel a két márkával dolgozom. Elmondod, mire van szükséged, én pedig segítek megtalálni a hozzád illő készüléket, és be is szerelem.</p>
    </header>
    <div class="brand-grid">
      ${panel("Gree", "brand-gree", `Gree klímát szeretnél? ${count("Gree") ? `${count("Gree")} sorozatból választhatsz, ` : ""}az otthonod és az igényeid alapján segítek kiválasztani a megfelelőt.`, `<a class="text-link" href="klimak.html#gree">Gree klímák és árak</a>`)}
      ${panel("Syen", "brand-syen", `Syen klíma érdekel? ${count("Syen") ? `${count("Syen")} sorozat közül ` : ""}segítek a választásban, a beszereléssel együtt.`, `<a class="text-link" href="klimak.html#syen">Syen klímák és árak</a>`)}
    </div>
    ${series.length ? seriesGrid(series, site) : ""}
    <p class="fineprint">${products.length ? `Az árak a készülékek bruttó árai, amelyekhez az <a href="#arak">alapszerelési ár</a> adódik. ${priceSourceSentence(site)}` : "A konkrét típusokról, az aktuális elérhetőségről és az árakról ajánlatkéréskor adok tájékoztatást."} Más márkájú, saját készülék beszereléséről is érdemes egyeztetni.</p>
  </div>
</section>`;
}

function seriesGrid(series, site) {
  return `<h3 class="sub-head">Sorozatok</h3>
    <ul class="series-grid">
      ${series.map((g) => `<li class="series-card">
        <a href="klimak.html#${g.slug}">
          <span class="series-media">${g.image ? `<img src="${esc(g.image)}" alt="${esc(`${g.brand} ${g.series} klíma`)}" width="400" height="300" loading="lazy" decoding="async">` : ""}</span>
          <span class="series-body">
            <span class="series-brand">${esc(g.brand)}</span>
            <span class="series-name">${esc(g.series)}</span>
            <span class="series-meta">${g.minKw === g.maxKw ? formatKw(g.minKw) : `${formatKw(g.minKw).replace(" kW", "")}–${formatKw(g.maxKw)}`}${g.energyClass ? `, ${esc(g.energyClass)}` : ""}</span>
            <span class="series-price"><strong>${formatFt(g.minPrice)}-tól</strong><span>+ alapszerelési ár</span></span>
          </span>
        </a>
      </li>`).join("\n      ")}
    </ul>
    <p class="series-all"><a class="btn btn-primary" href="klimak.html">Az összes klíma és ár</a></p>`;
}

function priceSourceSentence(site) {
  const pp = site.productPrices || {};
  const d = has(pp.fetchedAt) ? huDate(pp.fetchedAt) : null;
  return `A készülékárak a gyártók magyarországi webáruházaiban közzétett árak${d ? ` (${d} állapot szerint)` : ""} (a nettó árak ${pp.vatRate ?? 27}% áfával bruttósítva). Tájékoztató jellegűek, a végleges ár az ajánlatban szerepel.`;
}

function huDate(iso) {
  const m = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
  const [y, mo, d] = iso.split("-").map(Number);
  return `${y}. ${m[mo - 1]} ${d === 1 ? "1-jei" : `${d}-i`}`;
}

function installLine(site, { long = false } = {}) {
  const inst = site.installation || {};
  if (has(inst.price)) return `+ alapszerelési ár: ${esc(inst.price)}`;
  return long ? `+ alapszerelési ár: ${fill(null, "alapszerelési ár összege")}` : "+ alapszerelési ár";
}

function whyPro() {
  const items = [
    ["tool", "Szakszerű kivitelezés", "A beszerelést a szükséges szakmai képesítéssel és engedélyekkel végzem."],
    ["sliders", "Az igényeidhez igazítva", "A megoldást a helyiséghez és ahhoz igazítom, ahogyan a klímát használni szeretnéd."],
    ["compass", "Segítség a választásban", "Ha még nincs készüléked, segítek eligazodni a Gree és Syen kínálatban."],
    ["box", "Saját készülék beszerelése", "Ha a klímát máshol vetted, a telepítést akkor is kérheted tőlem."],
    ["chat", "Átlátható egyeztetés", "Előre átbeszélem veled a részleteket, és az ajánlatban látod, mire számíthatsz."],
  ];
  return `<section id="miert" class="section" aria-labelledby="miert-cim">
  <div class="wrap why-grid">
    <div class="why-intro">
      <h2 id="miert-cim">Miért fontos a szakszerű beszerelés?</h2>
      <p>A jó készülék csak az egyik fele a történetnek. Azon, hogy a klíma megbízhatóan és hatékonyan működjön, sokat múlik a beszerelés minősége.</p>
      <p>Magyarországon a hűtőközeggel járó munkákat csak megfelelő képesítéssel rendelkező szakember végezheti.</p>
    </div>
    <ul class="why-list">
      ${items.map(([ic, t, d]) => `<li>${icon(ic, "icon why-icon")}<div><h3>${t}</h3><p>${d}</p></div></li>`).join("\n      ")}
    </ul>
  </div>
</section>`;
}

function process(site) {
  const steps = [
    ["Kapcsolatfelvétel", "Írd meg vagy mondd el telefonon, mire van szükséged: klímát is szeretnél, vagy csak a beszerelést."],
    site.freeSurvey
      ? ["Ingyenes felmérés és ajánlat", "Ingyenesen felmérem a helyszínt, átbeszélem veled a lehetőségeket, majd ajánlatot adok."]
      : ["Egyeztetés és ajánlat", "Átbeszélem veled a részleteket és a lehetőségeket, majd ajánlatot adok."],
    ["Telepítés", "Az egyeztetett időpontban szakszerűen elvégzem a beszerelést."],
  ];
  return `<section id="menete" class="section section-ink" aria-labelledby="menete-cim">
  <div class="wrap">
    <header class="section-head">
      <h2 id="menete-cim">Így zajlik</h2>
      <p>Három egyszerű lépés az első üzenettől a beszerelt klímáig.</p>
    </header>
    <ol class="steps">
      ${steps.map(([t, d], i) => `<li class="step"><span class="step-num" aria-hidden="true">${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join("\n      ")}
    </ol>
    <a class="btn btn-light" href="#ajanlatkeres" data-tipus="klima-telepites">Ajánlatot kérek</a>
  </div>
</section>`;
}

function prices(site) {
  const inst = site.installation || {};
  const includes = inst.includes || [];
  const extras = inst.extras || [];
  const other = (site.prices && site.prices.items) || [];
  if (!includes.length && !extras.length && !other.length) return "";
  const rows = (list) => list.map((p) => `<div class="price-row"><dt>${esc(p.service)}${has(p.note) ? `<span>${esc(p.note)}</span>` : ""}</dt><dd>${esc(p.price)}</dd></div>`).join("\n        ");
  return `<section id="arak" class="section section-tint" aria-labelledby="arak-cim">
  <div class="wrap price-grid">
    <div class="price-main">
      <header class="section-head">
        <h2 id="arak-cim">Alapszerelés és árak</h2>
        <p>A klíma ára mellé az alapszerelési ár jön. Így előre látod, mivel számolhatsz.</p>
      </header>
      <div class="install-card">
        <p class="install-head"><span>Alapszerelési ár</span><strong>${has(inst.price) ? esc(inst.price) : fill(null, "alapszerelési ár összege")}</strong></p>
        ${includes.length ? `<h3>Az alapszerelési ár tartalmazza:</h3>
        <ul class="ticks">
          ${includes.map((i) => `<li>${icon("check")}${esc(i)}</li>`).join("\n          ")}
        </ul>` : ""}
      </div>
    </div>
    <div class="price-side">
      ${extras.length ? `<h3>További költségek</h3>
      <dl class="price-list">
        ${rows(extras)}
      </dl>` : ""}
      ${other.length ? `<h3>Egyéb szolgáltatás</h3>
      <dl class="price-list">
        ${rows(other)}
      </dl>` : ""}
      ${site.freeSurvey ? `<p class="survey-note">${icon("check")}A felmérés ingyenes.</p>` : ""}
      ${has(site.prices?.footnote) ? `<p class="fineprint">${esc(site.prices.footnote)}</p>` : ""}
    </div>
  </div>
</section>`;
}

function faq() {
  const qa = [
    ["Vállalsz kizárólag klímaszerelést is?", "Igen. Ha már megvan a készüléked, csak a telepítést is kérheted tőlem, nem kell nálam vásárolnod."],
    ["Mi történik, ha már megvettem a klímát?", "Semmi gond. Az ajánlatkérésnél válaszd a „Csak telepítés saját készülékkel” lehetőséget, és írd meg a készülék márkáját és típusát. Ez alapján egyeztetek veled a beszerelés részleteiről."],
    ["Milyen márkákkal foglalkozol?", "Gree és Syen klímákkal dolgozom, és segítek kiválasztani a neked megfelelőt. Ha más márkájú készüléked van, a beszereléséről érdemes egyeztetni."],
    ["Hogyan kérhetek ajánlatot?", "Töltsd ki az ajánlatkérő űrlapot, vagy hívj fel telefonon. A telefonszámomat az oldal alján és a kapcsolat résznél is megtalálod."],
    ["Mit érdemes előkészítenem az egyeztetéshez?", "Segít, ha tudod, melyik helyiségbe szeretnél klímát, nagyjából mekkora a helyiség, és hová kerülhetne a beltéri és a kültéri egység. Ha már megvan a készülék, írd meg a márkáját és a típusát. Néhány fotó a helyszínről az egyeztetésnél szintén hasznos."],
  ];
  return `<section id="gyik" class="section" aria-labelledby="gyik-cim">
  <div class="wrap faq-grid">
    <header class="section-head">
      <h2 id="gyik-cim">Gyakori kérdések</h2>
      <p>Nem találod a választ? Kérdezz bátran az ajánlatkérő űrlapon vagy telefonon.</p>
    </header>
    <div class="faq">
      ${qa.map(([q, a]) => `<details class="faq-item"><summary><span>${q}</span>${icon("plus", "icon faq-icon")}</summary><div class="faq-body"><p>${a}</p></div></details>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function contact(site) {
  const endpoint = site.form && has(site.form.endpoint) ? site.form.endpoint : "";
  const hoursRows = (site.hours && site.hours.rows) || [];
  return `<section id="kapcsolat" class="section section-tint" aria-labelledby="kapcsolat-cim">
  <div class="wrap contact-grid">
    <div class="contact-info">
      <h2 id="kapcsolat-cim">Kapcsolat</h2>
      <p>Klímát szeretnél, vagy a meglévő készülékedet szerelnéd be? Hívj fel, vagy kérj ajánlatot az űrlapon.</p>
      ${has(site.phone) ? `<a class="call-card" href="${telHref(site.phone)}">
        ${icon("phone", "icon call-icon")}
        <span class="call-label">Klímát szeretnél? Hívj:</span>
        <span class="call-number">${esc(site.phone)}</span>
      </a>` : `<p class="call-card call-card-empty">${icon("phone", "icon call-icon")}${fill(null, "Telefonszám")}</p>`}
      <ul class="contact-list">
        <li>${icon("pin")}<span>Működési terület: ${fill(site.serviceArea, "működési terület")}</span></li>
        ${hoursRows.length ? `<li>${icon("clock")}<span>${hoursRows.map((r) => `${esc(r[0])}: ${esc(r[1])}`).join("<br>")}</span></li>` : ""}
      </ul>
    </div>

    <div id="ajanlatkeres" class="form-card" tabindex="-1">
      <h2 class="form-title">Ajánlatkérés</h2>
      <p class="form-intro">A csillaggal (*) jelölt mezők kitöltése kötelező.</p>
      <form id="ajanlat-form" class="quote-form" novalidate data-endpoint="${esc(endpoint)}">
        <fieldset class="field choice-field" aria-describedby="tipus-hiba">
          <legend>Mire van szükséged? <span class="req" aria-hidden="true">*</span></legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="tipus" value="klima-telepites" required><span>Klíma és telepítés</span></label>
            <label class="choice"><input type="radio" name="tipus" value="csak-telepites"><span>Csak telepítés saját készülékkel</span></label>
            <label class="choice"><input type="radio" name="tipus" value="altalanos"><span>Általános kérdés</span></label>
          </div>
          <p class="field-error" id="tipus-hiba" hidden></p>
        </fieldset>

        <div class="field-row">
          <div class="field">
            <label for="nev">Név <span class="req" aria-hidden="true">*</span></label>
            <input id="nev" name="nev" type="text" autocomplete="name" required maxlength="100" aria-describedby="nev-hiba">
            <p class="field-error" id="nev-hiba" hidden></p>
          </div>
          <div class="field">
            <label for="telefon">Telefonszám <span class="req" aria-hidden="true">*</span></label>
            <input id="telefon" name="telefon" type="tel" autocomplete="tel" inputmode="tel" required maxlength="30" placeholder="+36 30 123 4567" aria-describedby="telefon-hiba">
            <p class="field-error" id="telefon-hiba" hidden></p>
          </div>
        </div>

        <div class="field">
          <label for="telepules">Település <span class="opt">(nem kötelező)</span></label>
          <input id="telepules" name="telepules" type="text" autocomplete="address-level2" maxlength="80">
        </div>

        <div class="field">
          <label for="marka" data-marka-label>Melyik márka érdekel? <span class="opt">(nem kötelező)</span></label>
          <select id="marka" name="marka">
            <option value="">Válassz…</option>
            <option value="Gree">Gree</option>
            <option value="Syen">Syen</option>
            <option value="Még nem döntöttem" data-only="klima">Még nem döntöttem</option>
            <option value="Egyéb">Egyéb</option>
          </select>
        </div>

        <div class="field">
          <label for="uzenet">Üzenet <span class="opt">(nem kötelező)</span></label>
          <textarea id="uzenet" name="uzenet" rows="4" maxlength="2000" placeholder="Pl. melyik helyiségbe kerülne a klíma, mekkora a helyiség, vagy milyen típusú a saját készüléked."></textarea>
        </div>

        <div class="hp" aria-hidden="true">
          <label for="weboldal">Ezt a mezőt hagyd üresen</label>
          <input id="weboldal" name="weboldal" type="text" tabindex="-1" autocomplete="off">
        </div>

        <div class="field">
          <label class="consent"><input type="checkbox" name="hozzajarulas" id="hozzajarulas" required aria-describedby="hozzajarulas-hiba"><span>Elolvastam az <a href="adatvedelem.html" target="_blank" rel="noopener">adatkezelési tájékoztatót</a>, és hozzájárulok, hogy az ajánlatkéréshez megadott adataimat a kapcsolatfelvételhez kezeljék. <span class="req" aria-hidden="true">*</span></span></label>
          <p class="field-error" id="hozzajarulas-hiba" hidden></p>
        </div>

        <div class="form-status" role="status" aria-live="polite" hidden></div>

        <button class="btn btn-primary btn-block" type="submit">Ajánlatkérés elküldése</button>
      </form>
      <div class="form-success" hidden tabindex="-1">
        ${icon("check", "icon success-icon")}
        <h3>Köszönöm, megkaptam az ajánlatkérésed!</h3>
        <p>Hamarosan felhívlak a megadott telefonszámon.</p>
      </div>
    </div>
  </div>
  <script type="application/json" id="contact-data">${JSON.stringify({ phone: site.phone || null })}</script>
</section>`;
}

/* ---------- klímák: lista és adatlapok ---------- */

export function catalog(site, products) {
  const series = groupSeries(products);
  const brandsList = ["Gree", "Syen"];
  const body = `<section class="section catalog" aria-labelledby="klimak-cim">
  <div class="wrap">
    <p><a class="back-link" href="./">Vissza a főoldalra</a></p>
    <header class="section-head">
      <h1 id="klimak-cim">Klímák és árak</h1>
      <p>Gree és Syen oldalfali split klímák bruttó áron. Az árakhoz az <a href="./#arak">alapszerelési ár</a> adódik. Ha már megvan a saját készüléked, <a href="./#csak-telepites">csak a telepítést is kérheted</a>.</p>
    </header>
    <nav class="catalog-filter" aria-label="Márkák">
      ${brandsList.map((b) => `<a href="#${b.toLowerCase()}">${b}</a>`).join("")}
    </nav>
    ${brandsList.map((b) => `<div class="catalog-brand" id="${b.toLowerCase()}">
      <h2>${b} klímák</h2>
      ${series.filter((g) => g.brand === b).map((g) => `<section class="catalog-series" id="${g.slug}" aria-labelledby="${g.slug}-cim">
        <div class="catalog-series-head">
          ${g.image ? `<img src="${esc(g.image)}" alt="${esc(`${g.brand} ${g.series} klíma`)}" width="160" height="120" loading="lazy" decoding="async">` : ""}
          <div>
            <h3 id="${g.slug}-cim">${esc(g.brand)} ${esc(g.series)}</h3>
            <p>${g.items.length} teljesítményben${g.energyClass ? `, energiaosztály: ${esc(g.energyClass)}` : ""}</p>
          </div>
        </div>
        <ul class="model-list">
          ${g.items.map((p) => `<li>
            <a class="model-row" href="${esc(p.page)}">
              <span class="model-kw">${formatKw(p.capacityKw)}</span>
              <span class="model-name">${esc(p.name)}</span>
              <span class="model-price">${p.originalGross ? `<s aria-label="Korábbi ár">${formatFt(p.originalGross)}</s>` : ""}<strong>${formatFt(p.priceGross)}</strong><small>${installLine(site)}</small></span>
              <span class="model-more">Részletek</span>
            </a>
          </li>`).join("\n          ")}
        </ul>
      </section>`).join("\n      ")}
    </div>`).join("\n    ")}
    <p class="fineprint">${priceSourceSentence(site)} Készletinformációt az oldal nem tartalmaz, az elérhetőségről az egyeztetéskor tájékoztatlak.</p>
  </div>
</section>`;
  return layout(site, {
    title: `Gree és Syen klímák árai | ${site.name}`,
    description: "Gree és Syen oldalfali klímák bruttó árai és műszaki adatai. Az árakhoz az alapszerelési ár adódik. Kérj ajánlatot beszereléssel együtt.",
    path: "klimak.html",
    body,
  });
}

export function productPage(site, p, siblings) {
  const src = (site.productPrices?.sources || {})[p.brand] || {};
  const imgs = p.images.slice(0, 6);
  const alt = (i) => `${p.name}${i ? ` – ${i + 1}. kép` : ""}`;
  const crumbs = `<nav class="crumbs" aria-label="Morzsamenü"><a href="./">Főoldal</a><span aria-hidden="true">/</span><a href="klimak.html">Klímák és árak</a><span aria-hidden="true">/</span><a href="klimak.html#${p.seriesSlug}">${esc(p.brand)} ${esc(p.series)}</a></nav>`;
  const prefill = encodeURIComponent(p.name);
  const body = `<section class="section product" aria-labelledby="termek-cim">
  <div class="wrap">
    ${crumbs}
    <div class="product-grid">
      <div class="gallery" data-gallery>
        <figure class="gallery-main">${imgs.length ? `<img src="${esc(imgs[0])}" alt="${esc(alt(0))}" width="800" height="800" decoding="async" data-gallery-main>` : `<span class="gallery-empty">Nincs elérhető kép</span>`}</figure>
        ${imgs.length > 1 ? `<ul class="gallery-thumbs">${imgs.map((u, i) => `<li><button type="button" class="thumb"${i === 0 ? ' aria-current="true"' : ""} data-src="${esc(u)}" data-alt="${esc(alt(i))}" aria-label="${i + 1}. kép megjelenítése"><img src="${esc(u)}" alt="" width="96" height="96" loading="lazy" decoding="async"></button></li>`).join("")}</ul>` : ""}
        <p class="gallery-note">A képek a forgalmazó termékfotói, a sorozat más méreteit is mutathatják.</p>
      </div>
      <div class="product-info">
        <p class="product-brand">${esc(p.brand)} ${esc(p.series)}</p>
        <h1 id="termek-cim">${esc(p.name)}</h1>
        <ul class="product-facts">
          <li><span>Hűtőteljesítmény</span><strong>${formatKw(p.capacityKw)}</strong></li>
          ${p.energyClass ? `<li><span>Energiaosztály</span><strong>${esc(p.energyClass)}</strong></li>` : ""}
          ${p.refrigerant ? `<li><span>Hűtőközeg</span><strong>${esc(p.refrigerant)}</strong></li>` : ""}
          ${p.models ? `<li><span>Típus</span><strong>${esc(p.models)}</strong></li>` : ""}
        </ul>
        <div class="price-box">
          ${p.originalGross ? `<p class="price-old"><s aria-label="Korábbi ár">${formatFt(p.originalGross)}</s></p>` : ""}
          <p class="price-now">${formatFt(p.priceGross)} <span>bruttó</span></p>
          <p class="price-install">${installLine(site, { long: true })}</p>
          ${(site.installation?.includes || []).length ? `<details class="install-details"><summary>Mit tartalmaz az alapszerelés?</summary><ul>${site.installation.includes.map((i) => `<li>${esc(i)}</li>`).join("")}</ul><p><a href="./#arak">További költségek és árak</a></p></details>` : ""}
          ${p.priceWasNet ? `<p class="price-src">Nettó ${formatFt(p.priceNet)} + ${site.productPrices?.vatRate ?? 27}% áfa</p>` : ""}
          ${p.saleNote ? `<p class="price-src">${esc(p.saleNote)}</p>` : ""}
          <a class="btn btn-primary btn-block" href="./?klima=${prefill}#ajanlatkeres">Ajánlatot kérek erre a klímára</a>
          <p class="price-alt">Már megvan a készüléked? <a href="./#csak-telepites">Kérj csak telepítést</a>.</p>
        </div>
        ${siblings.length > 1 ? `<div class="sizes"><h2>Más teljesítmények ebben a sorozatban</h2><ul>${siblings.map((s) => `<li>${s.slug === p.slug ? `<span aria-current="page">${formatKw(s.capacityKw)}</span>` : `<a href="${esc(s.page)}">${formatKw(s.capacityKw)}</a>`}</li>`).join("")}</ul></div>` : ""}
      </div>
    </div>

    ${p.specs.length ? `<section class="specs" aria-labelledby="specs-cim">
      <h2 id="specs-cim">Műszaki adatok</h2>
      <table class="spec-table">
        <tbody>
          ${p.specs.map((r) => `<tr><th scope="row">${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`).join("\n          ")}
        </tbody>
      </table>
      <p class="fineprint">Forrás: <a href="${esc(p.url)}" rel="noopener">${esc(src.label || "a forgalmazó termékoldala")}</a>. ${priceSourceSentence(site)}</p>
    </section>` : ""}
    ${p.specsNote ? `<section class="specs" aria-labelledby="specs-cim">
      <h2 id="specs-cim">Műszaki adatok</h2>
      <p class="specs-note">${esc(p.specsNote)}</p>
    </section>` : ""}
  </div>
</section>`;
  return layout(site, {
    title: `${p.name} ára és műszaki adatai | ${site.name}`,
    description: `${p.name}: ${formatFt(p.priceGross)} bruttó + alapszerelési ár. ${p.energyClass ? `Energiaosztály: ${p.energyClass}. ` : ""}Műszaki adatok és ajánlatkérés beszereléssel.`,
    path: p.page,
    body,
  });
}

/* ---------- jogi oldalak (kitöltendő vázak, nem kitalált tartalom) ---------- */

function legalPage(site, { title, path, lead, body, description }) {
  return layout(site, {
    title: `${title} | ${site.name}`,
    description,
    path,
    body: `<section class="section legal">
  <div class="wrap narrow">
    <p><a class="back-link" href="./">Vissza a főoldalra</a></p>
    <h1>${title}</h1>
    <div class="todo-note" role="note">${icon("alert")}<p>${lead}</p></div>
    ${body}
  </div>
</section>`,
  });
}

export function impresszum(site) {
  const l = site.legal || {};
  const a = site.address || {};
  const row = (k, v, label) => `<div><dt>${k}</dt><dd>${fill(v, label)}</dd></div>`;
  return legalPage(site, {
    title: "Impresszum",
    path: "impresszum.html",
    description: `A ${site.name} impresszuma: a szolgáltató neve, elérhetőségei és a vállalkozás adatai.`,
    lead: "Ez a szakasz élesítés előtt kitöltendő. A jelölt adatokat a vállalkozás valós adataival kell pótolni.",
    body: `<dl class="legal-dl">
      ${row("Szolgáltató neve", site.legalName, "Cégnév / egyéni vállalkozó neve")}
      ${row("Székhely", l.seat, "Székhely címe")}
      ${row(esc(l.registrationLabel || "Nyilvántartási szám"), l.registration, "Cégjegyzékszám vagy nyilvántartási szám")}
      ${row("Adószám", l.taxNumber, "Adószám")}
      ${row("Telefon", site.phone, "Telefonszám")}
      ${row("E-mail", site.email, "E-mail-cím – az impresszumban a törvény szerint kötelező")}
      ${row("Működési terület", site.serviceArea, "Működési terület")}
      ${has(a.city) ? row("Cím", formatAddress(a), "Cím") : ""}
      ${row("Tárhelyszolgáltató", l.hosting, "Tárhelyszolgáltató neve, címe, elérhetősége")}
    </dl>`,
  });
}

export function adatvedelem(site) {
  const sections = [
    ["Az adatkezelő", "Az adatkezelő neve, székhelye és elérhetőségei."],
    ["A kezelt adatok köre", "Mely adatokat kezeli a vállalkozás (pl. az ajánlatkérő űrlapon megadott név, telefonszám, település, üzenet)."],
    ["Az adatkezelés célja és jogalapja", "Mire használják az adatokat (pl. kapcsolatfelvétel, ajánlatadás), és milyen jogalapon."],
    ["Az adatok megőrzési ideje", "Mennyi ideig őrzik meg az adatokat."],
    ["Adatfeldolgozók és címzettek", "Kik férhetnek hozzá az adatokhoz (pl. tárhelyszolgáltató, e-mail-szolgáltató)."],
    ["Az érintett jogai", "Hozzáférés, helyesbítés, törlés, korlátozás, tiltakozás, adathordozhatóság joga, valamint a panasz lehetősége a NAIH-nál."],
    ["Sütik", "Az oldal jelenleg nem használ nyomkövető vagy marketingsütiket. Ha később ilyen kerül az oldalra, ezt itt fel kell tüntetni."],
  ];
  return legalPage(site, {
    title: "Adatkezelési tájékoztató",
    path: "adatvedelem.html",
    description: `A ${site.name} adatkezelési tájékoztatója: milyen adatokat kezel az ajánlatkéréskor, és milyen jogaid vannak.`,
    lead: "Ez az oldal még csak a tájékoztató szerkezetét mutatja, nem érvényes adatkezelési tájékoztató. Élesítés előtt a vállalkozás valós adatai alapján, lehetőleg szakember segítségével kell elkészíteni.",
    body: sections.map(([h, d]) => `<h2>${h}</h2>\n    <p class="ph-block">[Kitöltendő: ${d}]</p>`).join("\n    "),
  });
}

export function notFound(site) {
  return layout(site, {
    title: `Az oldal nem található | ${site.name}`,
    description: "A keresett oldal nem található. Térj vissza a főoldalra, és nézd meg a klímákat és a szolgáltatásokat.",
    path: "404.html",
    robots: "noindex",
    body: `<section class="section legal">
  <div class="wrap narrow">
    <h1>Ez az oldal nem található</h1>
    <p>Lehet, hogy elírás történt a címben, vagy az oldal már nem érhető el.</p>
    <p><a class="btn btn-primary" href="./">Vissza a főoldalra</a></p>
  </div>
</section>`,
  });
}
