// Tijdelijke functie: geeft de bevestigingsmails in Brevo het label "optin".
// Wordt na eenmalig gebruik weer verwijderd.
exports.handler = async (event) => {
  if ((event.queryStringParameters || {}).zeker !== "ja") {
    return { statusCode: 400, body: "Niet uitgevoerd." };
  }
  const env = process.env;
  const kop = { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" };
  const uit = [];
  for (const id of [env.BREVO_DOI_TEMPLATE_NL, env.BREVO_DOI_TEMPLATE_FR]) {
    const r = await fetch("https://api.brevo.com/v3/smtp/templates/" + id, {
      method: "PUT", headers: kop, body: JSON.stringify({ tag: "optin" }),
    });
    const zet = r.status + " " + (await r.text()).slice(0, 200);
    const g = await fetch("https://api.brevo.com/v3/smtp/templates/" + id, { headers: kop });
    const j = await g.json().catch(() => ({}));
    uit.push("sjabloon " + id + " | wijzigen: " + zet + " | label nu: " + JSON.stringify(j.tag) + " | actief: " + j.isActive);
  }
  return { statusCode: 200, headers: { "Content-Type": "text/plain; charset=utf-8" }, body: uit.join("\n") };
};
