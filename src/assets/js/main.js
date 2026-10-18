/* Miklósi Klíma – oldal viselkedése. Függőség nélkül. Ajánlatkérés csak telefonon. */
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

  /* ---------- mobil hívás sáv: rejtve, amíg a hero gombjai vagy a nagy hívógomb látszik ---------- */
  var bar = $("[data-mobile-bar]");
  if (bar && "IntersectionObserver" in window) {
    var visible = {};
    var sync = function () {
      var any = Object.keys(visible).some(function (k) { return visible[k]; });
      bar.classList.toggle("is-hidden", any);
    };
    [[".fork", "fork"], [".hero-panel", "panel"], [".call-card-big", "call"]].forEach(function (pair) {
      var el = $(pair[0]);
      if (!el) return;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { visible[pair[1]] = entry.isIntersecting; });
        sync();
      }, { threshold: 0.15 }).observe(el);
    });
  }
})();
