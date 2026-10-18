// Közös segédfüggvények a sablonokhoz.

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const has = (v) => v !== null && v !== undefined && String(v).trim() !== "";

// Kitöltendő adat: valódi érték, vagy jól látható [helyőrző].
export const fill = (value, label) =>
  has(value)
    ? esc(value)
    : `<span class="ph" title="Kitöltendő a data/site.json fájlban">[${esc(label)}]</span>`;

export const telHref = (phone) => "tel:" + String(phone).replace(/[^\d+]/g, "");

export const formatAddress = (a = {}) =>
  [a.zip, a.city].filter(has).join(" ") + (has(a.street) ? ", " + a.street : "");

// Egyszerű vonalas ikonok (stroke = currentColor).
const ICONS = {
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.6 17.2a1.9 1.9 0 0 0 2.7 2.7l5.7-5.7a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.5-.5-2.4z"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  phone: '<path d="M6.6 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.1 6.1l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4M12 17v.5"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
};

export const icon = (name, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

// Márkajel: légáramlást idéző három vonal egy lekerekített négyzetben.
export const brandMark = (cls = "brand-mark") =>
  `<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="8" fill="#0F2238"/><path d="M8 11h16M8 16h11M8 21h6" stroke="#5CC8E0" stroke-width="2.6" stroke-linecap="round"/></svg>`;

// Unsplash kép reszponzív srcset-tel (a CDN automatikusan WebP/AVIF formátumot ad).
export const unsplash = (id, w, h, q = 70) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=${q}`;

export const srcset = (id, sizes, ratio) =>
  sizes.map((w) => `${unsplash(id, w, Math.round(w * ratio))} ${w}w`).join(", ");
