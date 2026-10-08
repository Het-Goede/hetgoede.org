// Inschrijvingen van de website naar Brevo, met dubbele bevestiging per mail.
// Twee soorten: de algemene inschrijving (hetgoede.org en le-bien.org) en de lancering (/26november).
// Instellingen staan als omgevingsvariabelen in Netlify:
//   BREVO_API_KEY          API-sleutel van het Brevo-account van Het Goede
//   BREVO_LIST_ID          lijst "Het Goede — inschrijvingen" (3)
//   BREVO_EVENT_LIST_ID    lijst "Lancering 26 november"
//   BREVO_DOI_TEMPLATE_NL  Nederlandstalige bevestigingsmail (1)
//   BREVO_DOI_TEMPLATE_FR  Franstalige bevestigingsmail (2)
//   SITE_URL               https://hetgoede.org

const DOELEN = {
  steun: "Steun tonen",
  volgen: "Op de hoogte blijven en mening geven",
  expertise: "Expertise inzetten",
};
// velden die in Brevo moeten bestaan; ontbreekt er een, dan maakt de functie ze aan
const VELDEN = { VOORNAAM: "text", ACHTERNAAM: "text", NAAM: "text", LAND: "text", POSTCODE: "text",
  KEUZE: "text", TOELICHTING: "text", REDEN: "text", TAAL: "text", BRON: "text", INSCHRIJFDATUM: "text",
  AANTAL: "float", LANCERING: "text" };

function antwoord(status, body) {
  return { statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
const kort = (v, n) => String(v || "").trim().slice(0, n);

async function brevo(pad, methode, sleutel, body) {
  return fetch("https://api.brevo.com/v3" + pad, {
    method: methode,
    headers: { "api-key": sleutel, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function maakVelden(sleutel) {
  for (const [naam, type] of Object.entries(VELDEN)) {
    await brevo("/contacts/attributes/normal/" + naam, "POST", sleutel, { type }).catch(() => {});
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return antwoord(405, { fout: "Niet toegestaan." });
  let d;
  try { d = JSON.parse(event.body || "{}"); } catch { return antwoord(400, { fout: "Ongeldige aanvraag." }); }
  if (d.website) return antwoord(200, { ok: true }); // spamval

  const taal = d.taal === "fr" ? "fr" : "nl";
  const fr = taal === "fr";
  const email = String(d.email || "").trim().toLowerCase();
  const voornaam = kort(d.voornaam, 80);
  const achternaam = kort(d.achternaam, 80);
  const naam = kort(d.naam, 160) || [voornaam, achternaam].filter(Boolean).join(" ");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return antwoord(400, { fout: fr ? "Cette adresse e-mail n’est pas valide." : "Dat e-mailadres klopt niet." });
  if (!naam) return antwoord(400, { fout: fr ? "Indiquez votre nom." : "Vul je naam in." });
  if (d.akkoord !== true) return antwoord(400, { fout: fr ? "Cochez la case du consentement." : "Vink de toestemming aan." });

  const env = process.env;
  const site = (env.SITE_URL || "https://hetgoede.org").replace(/\/$/, "");
  const lancering = d.soort === "lancering";

  const lijsten = [];
  if (lancering) {
    lijsten.push(Number(env.BREVO_EVENT_LIST_ID));
    if (d.nieuws === true) lijsten.push(Number(env.BREVO_LIST_ID));
  } else {
    lijsten.push(Number(env.BREVO_LIST_ID));
  }

  const attributes = {
    VOORNAAM: voornaam, ACHTERNAAM: achternaam, NAAM: naam,
    TAAL: taal.toUpperCase(),
    BRON: String(d.bron || "website").replace(/[^a-z0-9\-]/gi, "").slice(0, 40) || "website",
    INSCHRIJFDATUM: new Date().toISOString().slice(0, 10),
  };
  if (lancering) {
    attributes.LANCERING = "Ingeschreven";
    attributes.AANTAL = Math.min(Math.max(Number(d.aantal) || 1, 1), 10);
  } else {
    attributes.LAND = kort(d.land, 60);
    attributes.POSTCODE = kort(d.postcode, 20);
    attributes.KEUZE = DOELEN[d.doel] || "Onbekend";
    attributes.TOELICHTING = kort(d.expertise, 1000);
    attributes.REDEN = kort(d.reden, 1000);
  }

  const payload = {
    email,
    includeListIds: lijsten.filter((n) => n > 0),
    templateId: Number(fr ? env.BREVO_DOI_TEMPLATE_FR : env.BREVO_DOI_TEMPLATE_NL),
    redirectionUrl: `${site}/bevestigd?taal=${taal}${lancering ? "&soort=lancering" : ""}`,
    attributes,
  };
  const fout = fr ? "L’inscription n’a pas abouti." : "De inschrijving lukte niet.";

  try {
    for (let poging = 0; poging < 2; poging++) {
      const r = await brevo("/contacts/doubleOptinConfirmation", "POST", env.BREVO_API_KEY, payload);
      if (r.ok) return antwoord(200, { ok: true });
      const tekst = await r.text();
      if (r.status === 400 && /duplicate|already/i.test(tekst)) return antwoord(200, { ok: true });
      if (poging === 0 && r.status === 400 && /attribute/i.test(tekst)) { await maakVelden(env.BREVO_API_KEY); continue; }
      console.error("Brevo", r.status, tekst);
      return antwoord(502, { fout });
    }
    return antwoord(502, { fout });
  } catch (e) {
    console.error(e);
    return antwoord(502, { fout });
  }
};
