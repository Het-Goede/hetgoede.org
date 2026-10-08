/* Meta-pixel voor hetgoede.org en le-bien.org.
   De pixel laadt pas nadat de bezoeker toestemming geeft. Zonder toestemming geen cookies.
   Keuze wordt bewaard in localStorage onder "hg_cookies" ("ja" of "nee"). */
(function () {
  var PIXEL_ID = "4505457693001693";
  var SLEUTEL = "hg_cookies";
  var fr = document.documentElement.lang === "fr";
  var T = fr
    ? { tekst: "Nous aimerions mesurer si nos publicités sur Facebook et Instagram amènent des visiteurs sur ce site. Pour cela, nous utilisons le pixel Meta, qui place des cookies. Vous êtes d’accord ?",
        ja: "D’accord", nee: "Non merci", meer: "En savoir plus", privacy: "/fr/confidentialite", link: "Cookies" }
    : { tekst: "We meten graag of onze advertenties op Facebook en Instagram mensen naar deze site brengen. Daarvoor gebruiken we de Meta-pixel, die cookies plaatst. Ga je akkoord?",
        ja: "Akkoord", nee: "Liever niet", meer: "Meer info", privacy: "/privacy", link: "Cookies" };

  function keuze() { try { return localStorage.getItem(SLEUTEL); } catch (e) { return null; } }
  function bewaar(w) { try { localStorage.setItem(SLEUTEL, w); } catch (e) {} }

  var geladen = false;
  function laadPixel() {
    if (geladen) return; geladen = true;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", PIXEL_ID);
    window.fbq("track", "PageView");
  }

  window.hgMeta = function (event, params) {
    if (geladen && window.fbq) window.fbq("track", event, params || {});
  };

  function banner() {
    if (document.getElementById("hg-cookies")) return;
    var css = document.createElement("style");
    css.textContent =
      "#hg-cookies{position:fixed;left:16px;right:16px;bottom:16px;z-index:50;max-width:560px;margin:0 auto;background:#fff;" +
      "border:1px solid rgba(21,19,15,.12);box-shadow:0 18px 40px rgba(21,19,15,.12);padding:20px 22px;font-family:inherit;" +
      "font-size:14px;line-height:1.6;color:#46443E;text-align:left}" +
      "#hg-cookies .knoppen{display:flex;gap:12px;align-items:center;margin-top:14px;flex-wrap:wrap}" +
      "#hg-cookies button{width:auto;padding:11px 22px;font-size:14px;font-family:inherit;cursor:pointer;border:0}" +
      "#hg-cookies .ja{background:#3F5D2C !important;color:#fff !important}" +
      "#hg-cookies .nee{background:none !important;color:#15130F !important;border-bottom:1px solid rgba(21,19,15,.2);padding:11px 2px}" +
      "#hg-cookies a{color:#15130F;margin-left:auto;font-size:13px}";
    document.head.appendChild(css);
    var d = document.createElement("div");
    d.id = "hg-cookies"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Cookies");
    d.innerHTML = '<div>' + T.tekst + '</div><div class="knoppen"><button type="button" class="ja">' + T.ja +
      '</button><button type="button" class="nee">' + T.nee + '</button><a href="' + T.privacy + '">' + T.meer + '</a></div>';
    document.body.appendChild(d);
    d.querySelector(".ja").onclick = function () { bewaar("ja"); d.remove(); laadPixel(); };
    d.querySelector(".nee").onclick = function () { bewaar("nee"); d.remove(); };
  }

  function voetLink() {
    var c = document.querySelector("footer .c");
    if (!c || document.getElementById("hg-cookielink")) return;
    var a = document.createElement("a");
    a.id = "hg-cookielink"; a.href = "#"; a.textContent = T.link;
    a.style.cssText = "color:inherit;display:inline-block;margin-top:6px";
    a.onclick = function (e) { e.preventDefault(); try { localStorage.removeItem(SLEUTEL); } catch (x) {} banner(); };
    c.appendChild(document.createElement("br")); c.appendChild(a);
  }

  function gebeurtenissen() {
    /* klik op een bestelknop */
    document.querySelectorAll("[data-bestel]").forEach(function (a) {
      a.addEventListener("click", function () { window.hgMeta("InitiateCheckout", { content_name: "Het Goede", currency: "EUR", value: 18 }); });
    });
    /* geslaagde inschrijving: het bedankblok wordt zichtbaar */
    var dank = document.getElementById("dank");
    if (dank && window.MutationObserver) {
      var lancering = /26november/.test(location.pathname);
      var gemeld = false;
      new MutationObserver(function () {
        if (!gemeld && dank.style.display === "block") {
          gemeld = true;
          if (lancering) window.hgMeta("CompleteRegistration", { content_name: "Lancering 26 november" });
          else window.hgMeta("Lead", { content_name: fr ? "Inscription Le Bien" : "Inschrijving Het Goede" });
        }
      }).observe(dank, { attributes: true, attributeFilter: ["style"] });
    }
    /* bevestigde inschrijving via de link in de mail */
    if (/bevestigd/.test(location.pathname)) {
      setTimeout(function () { window.hgMeta("SubmitApplication", { content_name: "Inschrijving bevestigd" }); }, 800);
    }
  }

  function start() {
    var k = keuze();
    if (k === "ja") laadPixel();
    else if (k !== "nee") banner();
    voetLink();
    gebeurtenissen();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
