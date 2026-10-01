// Inschrijving van de website naar Brevo, met dubbele bevestiging per mail.
// Instellingen staan als omgevingsvariabelen in Netlify (Site configuration → Environment variables):
//   BREVO_API_KEY          de API-sleutel van het Brevo-account van Het Goede
//   BREVO_LIST_ID          het nummer van de lijst "Het Goede — inschrijvingen"
//   BREVO_DOI_TEMPLATE_NL  het nummer van de Nederlandstalige bevestigingsmail
//   BREVO_DOI_TEMPLATE_FR  het nummer van de Franstalige bevestigingsmail
//   SITE_URL               bv. https://hetgoede.org (voor de pagina na het bevestigen)

const KEUZES = { boek: "Boek bestellen", vereniging: "Betrokken bij de vereniging", beide: "Allebei" };

function antwoord(status, body) {
  return { statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return antwoord(405, { fout: "Niet toegestaan." });

  let d;
  try { d = JSON.parse(event.body || "{}"); } catch { return antwoord(400, { fout: "Ongeldige aanvraag." }); }

  // spamval: dit veld is onzichtbaar voor mensen
  if (d.website) return antwoord(200, { ok: true });

  const email = String(d.email || "").trim().toLowerCase();
  const naam = String(d.naam || "").trim().slice(0, 120);
  const taal = d.taal === "fr" ? "fr" : "nl";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return antwoord(400, { fout: "Dat e-mailadres klopt niet." });
  if (!naam) return antwoord(400, { fout: "Vul je naam in." });
  if (d.akkoord !== true) return antwoord(400, { fout: "Vink de toestemming aan." });

  const env = process.env;
  const template = Number(taal === "fr" ? env.BREVO_DOI_TEMPLATE_FR : env.BREVO_DOI_TEMPLATE_NL);
  const site = (env.SITE_URL || "https://hetgoede.org").replace(/\/$/, "");

  const payload = {
    email,
    includeListIds: [Number(env.BREVO_LIST_ID)],
    templateId: template,
    redirectionUrl: `${site}/bevestigd${taal === "fr" ? "?taal=fr" : ""}`,
    attributes: {
      NAAM: naam,
      KEUZE: KEUZES[d.keuze] || "Onbekend",
      TOELICHTING: String(d.toelichting || "").trim().slice(0, 1000),
      TAAL: taal.toUpperCase(),
      BRON: String(d.bron || "website").replace(/[^a-z0-9\-]/gi, "").slice(0, 40) || "website",
      INSCHRIJFDATUM: new Date().toISOString().slice(0, 10),
    },
  };

  try {
    const r = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) return antwoord(200, { ok: true });
    const tekst = await r.text();
    // wie al ingeschreven is, krijgt gewoon dezelfde bevestiging te zien
    if (r.status === 400 && /duplicate|already/i.test(tekst)) return antwoord(200, { ok: true });
    console.error("Brevo", r.status, tekst);
    return antwoord(502, { fout: "De inschrijving lukte niet." });
  } catch (e) {
    console.error(e);
    return antwoord(502, { fout: "De inschrijving lukte niet." });
  }
};
