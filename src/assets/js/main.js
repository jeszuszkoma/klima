/* Miklósi Klíma – oldal viselkedése. Függőség nélkül. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- fejléc: árnyék görgetéskor ---------- */
  var header = $(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobil menü ---------- */
  var toggle = $(".menu-toggle");
  var menu = $("#menu");
  function setMenu(open) {
    if (!toggle || !menu) return;
    if (header) document.documentElement.style.setProperty("--menu-top", header.getBoundingClientRect().bottom + "px");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü bezárása" : "Menü megnyitása");
    menu.classList.toggle("is-open", open);
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setMenu(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (toggle.getAttribute("aria-expanded") === "true" && !e.target.closest(".site-header")) setMenu(false);
    });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1024) setMenu(false); });
  }

  /* ---------- űrlap ---------- */
  var form = $("#ajanlat-form");
  var formCard = $("#ajanlatkeres");
  var contact = {};
  try { contact = JSON.parse(($("#contact-data") || {}).textContent || "{}"); } catch (e) { contact = {}; }

  // CTA-k: a megfelelő ajánlatkérési típus (és márka) előválasztása.
  $$("[data-tipus]").forEach(function (link) {
    link.addEventListener("click", function () {
      if (!form) return;
      var radio = form.querySelector('input[name="tipus"][value="' + link.getAttribute("data-tipus") + '"]');
      if (radio) { radio.checked = true; updateBrandField(); clearError("tipus"); }
      var marka = link.getAttribute("data-marka");
      if (marka && form.marka) form.marka.value = marka;
    });
  });

  // A márka mező szövege a választott típushoz igazodik.
  function updateBrandField() {
    if (!form) return;
    var checked = form.querySelector('input[name="tipus"]:checked');
    var own = checked && checked.value === "csak-telepites";
    var label = $("[data-marka-label]", form);
    if (label) label.firstChild.nodeValue = own ? "Milyen márkájú a készüléked? " : "Melyik márka érdekel? ";
    $$("option[data-only='klima']", form).forEach(function (opt) {
      opt.hidden = own; opt.disabled = own;
      if (own && form.marka.value === opt.value) form.marka.value = "";
    });
  }

  var MESSAGES = {
    tipus: "Válaszd ki, mire van szükséged.",
    nevUres: "Add meg a neved.",
    nevRovid: "A név legalább 2 karakter legyen.",
    telUres: "Add meg a telefonszámod, hogy vissza tudjalak hívni.",
    telHibas: "Ellenőrizd a telefonszámot, pl. +36 30 123 4567.",
    hozzajarulas: "Az elküldéshez fogadd el az adatkezelési tájékoztatót."
  };

  function fieldEl(name) {
    return name === "tipus" ? $(".choice-field", form) : form.elements[name];
  }
  function setError(name, msg) {
    var el = fieldEl(name);
    var box = $("#" + name + "-hiba", form);
    if (el) el.setAttribute("aria-invalid", "true");
    if (box) { box.textContent = msg; box.hidden = false; }
  }
  function clearError(name) {
    var el = fieldEl(name);
    var box = $("#" + name + "-hiba", form);
    if (el) el.removeAttribute("aria-invalid");
    if (box) { box.textContent = ""; box.hidden = true; }
  }

  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function validPhone(s) {
    var v = String(s || "").trim();
    if (!/^[+\d\s()\/.-]+$/.test(v)) return false;
    var d = digits(v);
    return d.length >= 9 && d.length <= 15;
  }

  function validate() {
    var errors = [];
    var tipus = form.querySelector('input[name="tipus"]:checked');
    var nev = form.nev.value.trim();
    var tel = form.telefon.value.trim();

    if (!tipus) errors.push(["tipus", MESSAGES.tipus]);
    if (!nev) errors.push(["nev", MESSAGES.nevUres]);
    else if (nev.length < 2) errors.push(["nev", MESSAGES.nevRovid]);
    if (!tel) errors.push(["telefon", MESSAGES.telUres]);
    else if (!validPhone(tel)) errors.push(["telefon", MESSAGES.telHibas]);
    if (!form.hozzajarulas.checked) errors.push(["hozzajarulas", MESSAGES.hozzajarulas]);

    ["tipus", "nev", "telefon", "hozzajarulas"].forEach(clearError);
    errors.forEach(function (e) { setError(e[0], e[1]); });
    return errors;
  }

  function contactLinesHtml() {
    var parts = [];
    if (contact.phone) parts.push('Hívj: <a href="tel:' + contact.phone.replace(/[^\d+]/g, "") + '">' + contact.phone + "</a>");
    return parts.map(function (p) { return "<p>" + p + "</p>"; }).join("");
  }

  function showStatus(html) {
    var box = $(".form-status", form);
    box.className = "form-status is-error";
    box.innerHTML = html;
    box.hidden = false;
    box.setAttribute("tabindex", "-1");
    box.focus({ preventScroll: false });
  }
  function hideStatus() {
    var box = $(".form-status", form);
    box.hidden = true; box.innerHTML = "";
  }

  if (form) {
    updateBrandField();
    $$('input[name="tipus"]', form).forEach(function (r) {
      r.addEventListener("change", function () { updateBrandField(); clearError("tipus"); });
    });
    // Javítás közben csak az adott mező hibája frissül, a többi mezőt nem bántjuk.
    var checkOne = {
      nev: function (v) { return !v ? MESSAGES.nevUres : v.length < 2 ? MESSAGES.nevRovid : ""; },
      telefon: function (v) { return !v ? MESSAGES.telUres : !validPhone(v) ? MESSAGES.telHibas : ""; }
    };
    Object.keys(checkOne).forEach(function (name) {
      var el = form.elements[name];
      var recheck = function () {
        if (el.getAttribute("aria-invalid") !== "true") return;
        var msg = checkOne[name](el.value.trim());
        if (msg) setError(name, msg); else clearError(name);
      };
      el.addEventListener("blur", recheck);
      el.addEventListener("input", recheck);
    });
    form.hozzajarulas.addEventListener("change", function () { if (form.hozzajarulas.checked) clearError("hozzajarulas"); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      hideStatus();
      var errors = validate();
      if (errors.length) {
        var first = fieldEl(errors[0][0]);
        var focusTarget = errors[0][0] === "tipus" ? form.querySelector('input[name="tipus"]') : first;
        if (focusTarget) focusTarget.focus();
        return;
      }

      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) {
        // Nincs beállított küldési mód: soha nem jelenik meg hamis siker.
        showStatus("<p><strong>Az online ajánlatkérés még nincs bekapcsolva, ezért az üzenetedet most nem lehet elküldeni.</strong></p>" +
          (contactLinesHtml() || "<p>Próbáld újra később.</p>"));
        return;
      }

      var data = {
        tipus: form.querySelector('input[name="tipus"]:checked').value,
        nev: form.nev.value.trim(),
        telefon: form.telefon.value.trim(),
        telepules: form.telepules.value.trim(),
        marka: form.marka.value,
        uzenet: form.uzenet.value.trim(),
        hozzajarulas: form.hozzajarulas.checked,
        weboldal: form.weboldal.value
      };

      var button = form.querySelector('button[type="submit"]');
      var label = button.textContent;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.textContent = "Küldés folyamatban…";

      var controller = "AbortController" in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (controller) controller.abort(); }, 15000);

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data),
        signal: controller ? controller.signal : undefined
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) { return { res: res, body: body }; });
        })
        .then(function (r) {
          if (r.res.ok && r.body && r.body.ok === true) {
            form.hidden = true;
            var ok = $(".form-success", formCard);
            ok.hidden = false;
            ok.focus();
            return;
          }
          if (r.body && r.body.fields) {
            Object.keys(r.body.fields).forEach(function (k) { setError(k, r.body.fields[k]); });
          }
          var msg = (r.body && r.body.error) || "Az ajánlatkérést most nem sikerült elküldeni.";
          showStatus("<p><strong>" + escapeHtml(msg) + "</strong></p>" + contactLinesHtml());
        })
        .catch(function () {
          showStatus("<p><strong>Az ajánlatkérést most nem sikerült elküldeni. Ellenőrizd az internetkapcsolatot, és próbáld újra.</strong></p>" + contactLinesHtml());
        })
        .then(function () {
          clearTimeout(timer);
          button.disabled = false;
          button.removeAttribute("aria-busy");
          button.textContent = label;
        });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- termékadatlapról érkezés: ?klima=<név> előtölti az űrlapot ---------- */
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var klima = (params.get("klima") || "").slice(0, 160);
    if (klima) {
      var r = form.querySelector('input[name="tipus"][value="klima-telepites"]');
      if (r) { r.checked = true; updateBrandField(); }
      var brand = /^gree\b/i.test(klima) ? "Gree" : /^syen\b/i.test(klima) ? "Syen" : "";
      if (brand) form.marka.value = brand;
      if (!form.uzenet.value) form.uzenet.value = "Ez a klíma érdekel: " + klima + ".";
    }
  }

  /* ---------- termékgaléria ---------- */
  var gallery = $("[data-gallery]");
  if (gallery) {
    var main = $("[data-gallery-main]", gallery);
    $$(".thumb", gallery).forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!main) return;
        main.src = btn.getAttribute("data-src");
        main.alt = btn.getAttribute("data-alt");
        $$(".thumb", gallery).forEach(function (b) { b.removeAttribute("aria-current"); });
        btn.setAttribute("aria-current", "true");
      });
    });
  }

  /* ---------- mobil alsó sáv: elrejtés, amikor az űrlap látszik ---------- */
  var bar = $("[data-mobile-bar]");
  var fork = $(".fork");
  if (bar && "IntersectionObserver" in window) {
    var visible = { form: false, fork: false };
    var sync = function () { bar.classList.toggle("is-hidden", visible.form || visible.fork); };
    var watch = function (el, key) {
      if (!el) return;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { visible[key] = entry.isIntersecting; });
        sync();
      }, { threshold: 0.15 }).observe(el);
    };
    watch(formCard, "form");
    watch(fork, "fork");
  }
})();
