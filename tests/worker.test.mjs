// Az ajánlatkérő végpont tesztjei (node --test tests/).
import { test } from "node:test";
import assert from "node:assert/strict";
import worker, { validate, buildMime, buildMessage, tooMany } from "../worker/index.js";

const good = { tipus: "csak-telepites", nev: "Teszt Elek", telefon: "+36 30 123 4567", email: "", hozzajarulas: true };
const req = (body, headers = {}) =>
  new Request("https://pelda.hu/api/ajanlatkeres", {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": String(Math.random()), ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("érvényes adatok átmennek", () => {
  assert.equal(validate(good).ok, true);
});

test("kötelező mezők és formátumok", () => {
  const r = validate({ tipus: "x", nev: "A", telefon: "12ab", email: "nem-email", hozzajarulas: false });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.fields).sort(), ["email", "hozzajarulas", "nev", "telefon", "tipus"]);
});

test("ismeretlen márka kiürül, hosszú szöveg levágódik", () => {
  const r = validate({ ...good, marka: "<script>", uzenet: "x".repeat(5000) });
  assert.equal(r.data.marka, "");
  assert.equal(r.data.uzenet.length, 2000);
});

test("MIME üzenet UTF-8 base64 tárggyal és törzzsel", () => {
  const mime = buildMime({ from: "weboldal@pelda.hu", to: "ajanlat@pelda.hu", replyTo: null, subject: "Ajánlatkérés – Ő", text: buildMessage(validate(good).data) });
  assert.match(mime, /^From: =\?UTF-8\?B\?/m);
  assert.match(mime, /Subject: =\?UTF-8\?B\?/);
  assert.match(mime, /Content-Transfer-Encoding: base64/);
  const body = mime.split("\r\n\r\n")[1].replace(/\r\n/g, "");
  assert.match(Buffer.from(body, "base64").toString("utf8"), /Csak telepítés saját készülékkel/);
});

test("küldési beállítás nélkül 503, soha nem ok:true", async () => {
  const res = await worker.fetch(req(good), {});
  assert.equal(res.status, 503);
  assert.equal((await res.json()).ok, false);
});

test("hibás adat: 400 mezőhibákkal", async () => {
  const res = await worker.fetch(req({ ...good, telefon: "" }), {});
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.ok(body.fields.telefon);
});

test("robotcsapda: 400, nem ok:true", async () => {
  const res = await worker.fetch(req({ ...good, weboldal: "spam" }), {});
  assert.equal(res.status, 400);
  assert.equal((await res.json()).ok, false);
});

test("hibás JSON: 400", async () => {
  const res = await worker.fetch(req("{nem json"), {});
  assert.equal(res.status, 400);
});

test("idegen forrás tiltva", async () => {
  const res = await worker.fetch(req(good, { Origin: "https://rossz.example" }), { ALLOWED_ORIGINS: "https://jeszuszkoma.github.io" });
  assert.equal(res.status, 403);
});

test("küldési hiba esetén 502, nem ok:true", async () => {
  const env = { FORM_TO: "a@pelda.hu", FORM_FROM: "b@pelda.hu", MAIL: { send: async () => { throw new Error("hiba"); } } };
  const res = await worker.fetch(req(good), env);
  assert.ok([502].includes(res.status));
  assert.equal((await res.json()).ok, false);
});

test("sebességkorlát: 6. kérés 10 percen belül tiltva", () => {
  const ip = "teszt-ip";
  const t = 1_000_000;
  for (let i = 0; i < 5; i++) assert.equal(tooMany(ip, t + i), false);
  assert.equal(tooMany(ip, t + 6), true);
});

test("egyéb útvonalon a statikus fájlokat adja", async () => {
  const res = await worker.fetch(new Request("https://pelda.hu/klimak.html"), { ASSETS: { fetch: async () => new Response("ok") } });
  assert.equal(await res.text(), "ok");
});
