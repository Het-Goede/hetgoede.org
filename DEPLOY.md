# Het Goede — website, techstack en overdracht

Dit bestand beschrijft hoe hetgoede.org is opgezet, waar alles staat en hoe je het overneemt.
Wachtwoorden staan hier nooit in. Die staan in het wachtwoorddocument in de Drive van Untold.

## De stack in één zin

GitHub (code) + Netlify (hosting en de inschrijffunctie) + Combell (domein, DNS en mailbox) +
Brevo (inschrijvingen en mails). Dezelfde opbouw als untold-legacy.com.

## Waar alles staat

| Onderdeel | Dienst | Account | Overdragen |
|---|---|---|---|
| Domein hetgoede.org | Combell | account van Untold | domeinoverdracht naar het Combell-account van de vereniging |
| Mailbox info@hetgoede.org | Combell | hoort bij het domein | gaat mee met het domein |
| Code | GitHub | organisatie Het-Goede, repository hetgoede.org | nieuwe persoon als Owner toevoegen, oude eigenaars verwijderen |
| Hosting | Netlify | login info@hetgoede.org | wachtwoord wijzigen |
| Inschrijvingen | Brevo | login info@hetgoede.org, gratis plan | wachtwoord en gsm-nummer wijzigen |
| Webshop | Shopify van Untold | blijft bij Untold | niet overgedragen |
| Advertentiemeting | Meta-pixel van Untold | blijft bij Untold | niet overgedragen |

Alle logins hangen aan info@hetgoede.org. Wie die mailbox beheert, kan elk wachtwoord herstellen.
Bescherm die mailbox dus het best van allemaal.

## Wat er in deze repository zit

Alle bestanden staan naast elkaar in de hoofdmap.

```
index.html              de pagina
privacy.html            privacyverklaring
bevestigd.html          pagina na het bevestigen van de inschrijving
netlify.toml            instellingen en redirects (functions = ".")
inschrijven.js          stuurt een inschrijving naar Brevo
cover.png               de cover van het boek
stap1.png … stap6.png   de groeistappen van de ginkgo
ginkgo.svg              de ginkgo als vector
untold-wordmerk-*.png   het wordmerk van Untold
avenir-*.woff2          Avenir (weblicentie vereist)
```

## Hoe een inschrijving loopt

1. Iemand vult het formulier in en vinkt de toestemming aan.
2. De pagina stuurt dat naar de functie op Netlify.
3. De functie stuurt het naar Brevo, met de vraag om een bevestigingsmail.
4. Wie op de link in die mail klikt, komt op de lijst en landt op /bevestigd.
5. Kiest iemand voor het boek, dan verschijnt na de inschrijving een knop naar de webshop.

Per inschrijving bewaart Brevo: NAAM, KEUZE, TOELICHTING, TAAL, BRON en INSCHRIJFDATUM.

## Instellingen in Netlify

Site configuration → Environment variables:

| Naam | Waarde |
|---|---|
| BREVO_API_KEY | API-sleutel uit Brevo (Instellingen → SMTP & API) |
| BREVO_LIST_ID | nummer van de lijst "Het Goede — inschrijvingen" |
| BREVO_DOI_TEMPLATE_NL | nummer van de Nederlandstalige bevestigingsmail |
| BREVO_DOI_TEMPLATE_FR | nummer van de Franstalige bevestigingsmail |
| SITE_URL | https://hetgoede.org |

Build settings: build command leeg, publish directory `.`, functions directory `.`

## Instellingen in Brevo

- Contactvelden aanmaken: NAAM (tekst), KEUZE (tekst), TOELICHTING (tekst), TAAL (tekst), BRON (tekst), INSCHRIJFDATUM (datum)
- Lijst: Het Goede — inschrijvingen
- Twee sjablonen voor dubbele bevestiging (NL en FR), met de tag "optin" en de bevestigingslink
- Afzender: info@hetgoede.org, met het domein geverifieerd (DKIM en DMARC bij Combell)
- Afzendergegevens onderaan elke mail: GKW Floré

## DNS bij Combell

De nameservers blijven bij Combell, omdat de mailbox er ook staat.
- `A` voor hetgoede.org naar het IP-adres dat Netlify opgeeft
- `CNAME` voor www naar de netlify.app-naam van de site
- De records die Brevo opgeeft voor de domeinverificatie
- MX en SPF van Combell niet aanraken: die laten de mailbox werken

## De QR-code op de bladwijzer

Wijst naar https://hetgoede.org/doe-mee. Dat adres staat in de gedrukte boeken en mag nooit veranderen.
De bestemming staat in netlify.toml en mag wel aangepast worden. Inschrijvingen via die weg krijgen
BRON = bladwijzer. Voor het lanceringsmoment kan je hetzelfde doen met ?bron=event.

## Nog in te vullen voor livegang

- De regel `<meta name="robots" content="noindex, nofollow">` weghalen uit index.html, privacy.html en bevestigd.html. Die houdt zoekmachines weg zolang de site in opbouw is
- BESTEL_URL bovenaan het script in index.html: de link naar de productpagina in de webshop
- De privacyverklaring: adres en ondernemingsnummer van GKW Floré, en de cookiepassage
- De Meta-pixel, met cookiemelding (laadt pas na toestemming)
- De weblicentie op Avenir
- De Franse versie, zodra het domein vastligt

## Fase twee, na 26 november

Wil de vereniging zelf teksten aanpassen, dan komt er een beheerlaag met Decap CMS via DecapBridge,
zoals bij untold-legacy.com. De teksten verhuizen dan naar een apart bestand dat het CMS bewerkt.

## Overdracht, in volgorde

1. Wachtwoord van info@hetgoede.org wijzigen en doorgeven aan de vereniging
2. Domein overdragen naar hun Combell-account (de mailbox gaat mee)
3. Hun persoon als Owner in de GitHub-organisatie, Untold-eigenaars verwijderen
4. Netlify en Brevo: wachtwoord wijzigen, gsm-nummer in Brevo aanpassen
5. In de GitHub-koppeling van Netlify hun eigen GitHub-account koppelen
6. Dit bestand bijwerken met wie nu wat beheert
