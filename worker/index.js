// Miklósi Klíma – Cloudflare Worker
// - Kiszolgálja a statikus oldalt (ASSETS = dist/)
// - POST /api/ajanlatkeres: ajánlatkérés ellenőrzése és továbbítása e-mailben
//   (Cloudflare Email Routing "send_email" kötés: MAIL). Siker csak valódi küldés után.
import site from "../data/site.json" with { type: "json" };

const ROUTE = "/api/ajanlatkeres";
const TIPUS = {
  "klima-telepites": "Klíma és telepítés",
  "csak-telepites": "Csak telepítés saját készülékkel",
  altalanos: "Általános kérdés",
};
const MARKA = new Set(["", "Gree", "Syen", "Még nem döntöttem", "Egyéb"]);

const phoneFallback = site.phone ? ` Hívj minket: ${site.phone}.` : "";

export function validate(body) {
  const fields = {};
  const str = (v, max) => String(v ?? "").trim().slice(0, max);
  const data = {
    tipus: str(body?.tipus, 40),
    nev: str(body?.nev, 100),
    telefon: str(body?.telefon, 30),
    email: str(body?.email, 120),
    telepules: str(body?.telepules, 80),
    marka: str(body?.marka, 40),
    uzenet: str(body?.uzenet, 2000),
  };
  if (!TIPUS[data.tipus]) fields.tipus = "Válaszd ki, mire van szükséged.";
  if (data.nev.length < 2) fields.nev = "Add meg a neved.";
  const digits = data.telefon.replace(/\D/g, "");
  if (!/^[+\d\s()\/.-]+$/.test(data.telefon) || digits.length < 9 || digits.length > 15) {
    fields.telefon = "Ellenőrizd a telefonszámot, pl. +36 30 123 4567.";
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) fields.email = "Ellenőrizd az e-mail-címet.";
  if (!MARKA.has(data.marka)) data.marka = "";
  if (body?.hozzajarulas !== true) fields.hozzajarulas = "Az elküldéshez fogadd el az adatkezelési tájékoztatót.";
  return { data, fields, ok: Object.keys(fields).length === 0 };
}

export function buildMessage(data) {
  const lines = [
    `Új ajánlatkérés a weboldalról (${site.name})`,
    "",
    `Típus: ${TIPUS[data.tipus]}`,
    `Név: ${data.nev}`,
    `Telefon: ${data.telefon}`,
    `E-mail: ${data.email || "-"}`,
    `Település: ${data.telepules || "-"}`,
    `Márka: ${data.marka || "-"}`,
    "",
    "Üzenet:",
    data.uzenet || "-",
  ];
  return lines.join("\n");
}

const b64 = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const encWord = (s) => `=?UTF-8?B?${b64(s)}?=`;

export function buildMime({ from, to, replyTo, subject, text }) {
  const headers = [
    `From: ${encWord(site.name)} <${from}>`,
    `To: <${to}>`,
    replyTo ? `Reply-To: <${replyTo}>` : null,
    `Subject: ${encWord(subject)}`,
    `Message-ID: <${crypto.randomUUID()}@${from.split("@")[1]}>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ].filter(Boolean);
  const body = b64(text).replace(/.{76}/g, "$&\r\n");
  return headers.join("\r\n") + "\r\n\r\n" + body;
}

const hits = new Map();
export function tooMany(ip, now = Date.now()) {
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
}

function allowedOrigin(origin, env) {
  if (!origin) return false;
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  try {
    const host = new URL(origin).hostname;
    return allowed.some((a) => { try { return new URL(a).hostname === host; } catch { return a === host; } })
      || host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

const json = (body, status, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== ROUTE) {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Nem található.", { status: 404 });
    }

    const origin = request.headers.get("Origin") || "";
    const cors = allowedOrigin(origin, env)
      ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
      : {};
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ ok: false, error: "Csak POST kérés engedélyezett." }, 405, cors);

    // Azonos domainről érkező kérésnél nincs Origin-ellenőrzési gond; idegen domainről csak engedélyezett jöhet.
    const sameOrigin = origin && new URL(origin).host === url.host;
    if (origin && !sameOrigin && !allowedOrigin(origin, env)) return json({ ok: false, error: "Nem engedélyezett forrás." }, 403);

    if (tooMany(request.headers.get("CF-Connecting-IP") || "ismeretlen")) {
      return json({ ok: false, error: `Túl sok kérés rövid idő alatt. Próbáld újra később.${phoneFallback}` }, 429, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Hibás kérés." }, 400, cors);
    }

    // Robotcsapda: kitöltött rejtett mező -> csendben elutasítjuk, de NEM jelentünk sikert.
    if (String(body?.weboldal || "").trim()) return json({ ok: false, error: "A kérést nem tudtuk feldolgozni." }, 400, cors);

    const { data, fields, ok } = validate(body);
    if (!ok) return json({ ok: false, error: "Néhány mezőt javítani kell.", fields }, 400, cors);

    if (!env.MAIL || !env.FORM_TO || !env.FORM_FROM) {
      console.error("Az e-mail küldés nincs beállítva (MAIL / FORM_TO / FORM_FROM).");
      return json({ ok: false, error: `Az online ajánlatkérés jelenleg nem elérhető.${phoneFallback}` }, 503, cors);
    }

    try {
      const { EmailMessage } = await import("cloudflare:email");
      const raw = buildMime({
        from: env.FORM_FROM,
        to: env.FORM_TO,
        replyTo: data.email || null,
        subject: `Ajánlatkérés: ${TIPUS[data.tipus]} – ${data.nev}`,
        text: buildMessage(data),
      });
      await env.MAIL.send(new EmailMessage(env.FORM_FROM, env.FORM_TO, raw));
      return json({ ok: true }, 200, cors);
    } catch (e) {
      console.error("E-mail küldési hiba", e);
      return json({ ok: false, error: `Az ajánlatkérést most nem sikerült elküldeni.${phoneFallback}` }, 502, cors);
    }
  },
};
