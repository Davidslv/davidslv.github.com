/* Rewrite .js-buy-cta hrefs to the visitor's Amazon store.
   No-JS visitors keep the default (UK) link baked into the markup. */
(function () {
  var links = document.querySelectorAll(".js-buy-cta");
  if (!links.length) return;

  var ALIAS = {
    UK: "gb", GB: "gb", IE: "gb",
    AT: "de",
    NZ: "au",
    UM: "us", PR: "us", VI: "us", GU: "us"
  };

  var TZ = {
    "Europe/London": "gb",
    "Europe/Dublin": "gb",
    "Europe/Berlin": "de",
    "Europe/Vienna": "de",
    "Europe/Paris": "fr",
    "Europe/Madrid": "es",
    "Europe/Rome": "it",
    "Europe/Amsterdam": "nl",
    "Europe/Stockholm": "se",
    "Europe/Warsaw": "pl",
    "America/Toronto": "ca",
    "America/Vancouver": "ca",
    "America/Sao_Paulo": "br",
    "America/Mexico_City": "mx",
    "America/New_York": "us",
    "America/Chicago": "us",
    "America/Denver": "us",
    "America/Los_Angeles": "us",
    "America/Phoenix": "us",
    "Australia/Sydney": "au",
    "Australia/Melbourne": "au",
    "Pacific/Auckland": "au",
    "Asia/Tokyo": "jp",
    "Asia/Kolkata": "in"
  };

  function country() {
    try {
      var loc = new Intl.Locale(navigator.language);
      if (loc.region) return loc.region.toLowerCase();
    } catch (e) {}

    var lang = (navigator.language || "").toLowerCase();
    var dash = lang.lastIndexOf("-");
    if (dash !== -1) return lang.slice(dash + 1);

    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    if (TZ[tz]) return TZ[tz];
    if (tz.indexOf("America/") === 0) return "us";
    if (tz.indexOf("Europe/") === 0) return "gb";
    if (tz.indexOf("Australia/") === 0) return "au";
    return "gb";
  }

  var raw = country();
  var key = ALIAS[raw.toUpperCase()] || raw;

  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute("data-href-" + key);
    if (href) links[i].setAttribute("href", href);
  }
})();
