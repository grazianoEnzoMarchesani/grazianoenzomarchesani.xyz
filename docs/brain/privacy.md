# Privacy e GDPR

← [index](index.md)

Cosa il sito fa uscire dal browser del visitatore, con quale base giuridica, e come
si raccoglie il consenso.

## Principio: default-deny

**Prima di un click su «Accetta» il sito si comporta come se l'utente avesse rifiutato.**
Non è prudenza, è l'art. 4(11) GDPR: il consenso richiede un'azione positiva inequivocabile,
e il considerando 32 esclude che silenzio, inattività o caselle pre-selezionate valgano.

Producono lo stesso identico stato tecnico: prima visita, banner ignorato, chiusura con
la ✕, click su «Rifiuta». L'unica differenza è che il rifiuto espresso viene registrato e
sospende la richiesta per sei mesi, mentre l'assenza di scelta no.

Corollario implementativo, da non erodere in fase di restyling: **non basta nascondere gli
elementi, non devono esistere**. L'HTML statico non contiene né `<iframe>`, né custom
element che si registrino da soli, né `<link rel="preconnect">` verso terzi.

Nemmeno **per interposta copia locale**: scaricare al build il poster di un video e servirlo
dal proprio dominio evita la richiesta a Google, ma sposta il costo sul repo (~65 KB a video)
addossandolo anche a chi rifiuta. Il default-deny non è «l'immagine da un'altra parte», è
**niente immagine**: senza consenso il blocco video è solo testo, e la copertina vera arriva
da `i.ytimg.com` soltanto dopo il click su «Accetta» — che è esattamente ciò che è stato
accettato. Chi accetta deve vedere la cosa vera, non una versione mutilata.

## Cosa richiede consenso, e cosa no

| Trattamento | Base giuridica | Consenso |
|---|---|---|
| Log di hosting (GitHub Pages) | art. 6(1)(f) legittimo interesse | no |
| `sessionStorage` della spirale Fields | archiviazione strettamente necessaria | no |
| Preferenza di consenso in `localStorage` (`privacy:scelta`, 6 mesi) | archiviazione strettamente necessaria | no |
| Ricerca semantica (~33 MB in Cache API) | art. 6(1)(a) + art. 122 Codice Privacy | **sì** |
| Video YouTube | art. 6(1)(a) + art. 122 | **sì** |
| Email di contatto | art. 6(1)(b)/(f) | no |
| Nomi dei coautori nelle pubblicazioni | art. 6(1)(f), informativa ex art. 14(5)(b) | no |

### Lo storage si dichiara per nome, meccanismo e durata

Il § 3.2 dell'informativa diceva che la scelta sul banner è salvata «con lo stesso
meccanismo» della memoria di sessione, e quindi cancellata alla chiusura della scheda.
Falso: `consenso.ts` scrive in `localStorage`, voce `privacy:scelta`, e la tiene sei mesi —
come dichiarava correttamente il § 7 dello stesso testo, che quindi si contraddiceva.
Corretto in entrambe le lingue con nome della voce, contenuto, durata massima e modo di
cancellarla.

Da qui la regola: **ogni archiviazione sul dispositivo va dichiarata con il meccanismo
esatto, la chiave e la durata**, non con una perifrasi. Una perifrasi è dove si annida la
sottodichiarazione, ed è invisibile a rilettura perché suona plausibile. Se cambia
`consenso.ts`, cambia il § 3.2 nella stessa sessione.

### Coautori delle pubblicazioni

**Non vanno rimossi né troncati**: la citazione amputata è scientificamente falsa e
confligge col diritto morale di paternità (art. 20 L. 633/1941), che è un rischio maggiore
di quello che eviterebbe. L'art. 14(5)(b) esenta dall'informativa individuale per sforzo
sproporzionato, e il rimedio che il GDPR stesso indica è rendere l'informazione pubblica —
cioè un paragrafo nell'informativa. `pubblicazioni.autori.json` è anche l'attuazione pratica
del diritto di rettifica: un file solo da correggere.

### Posta elettronica: la casella è UNICAM, l'infrastruttura è Google

L'indirizzo pubblicato è quello istituzionale, quindi i messaggi che arrivano dal sito
finiscono sull'infrastruttura dell'Ateneo. Ne discendono tre cose, tutte già scritte
nell'informativa:

- **Va dichiarato che gira su Google Workspace.** Chi scrive ha diritto di sapere che il
  messaggio finisce su server Google, con i trasferimenti extra-UE che ne conseguono.
- **Va dichiarato con la data**, perché è un assetto scelto dall'Università e può cambiare
  senza preavviso: la formula è «allo stato attuale», non un'affermazione senza tempo.
- **L'Università non è un responsabile ex art. 28** del titolare del sito: gestisce la
  propria posta come titolare autonomo. Il § 1 non può quindi dire che è estranea a
  *tutti* i trattamenti, e infatti non lo dice più.

**Come è stato verificato, e come si riverifica**: dai record MX di `unicam.it`, tutti su
`ASPMX.L.GOOGLE.COM` e affini — `dig +short MX unicam.it`. **Non** dall'informativa privacy
di UNICAM, che non menziona né il servizio di posta né Google Workspace (l'unico «Google»
che vi compare riguarda la dismissione di Analytics). Quella pagina è linkata
nell'informativa per ciò che è — l'informativa del loro sito, una per lingua — e non come
fonte su questo punto.

Nota non usata, per non fare rumore: l'SPF include anche `spf.protection.outlook.com` e
`_spf.cineca.it`, quindi parte della posta **in uscita** passa da Microsoft e CINECA. Per
chi legge l'informativa la domanda è dove finisce ciò che scrive, e la risposta è Google.

## Consenso unico, non granulare

Scelta dell'utente: un solo interruttore per entrambe le funzioni. Ammissibile perché
rifiutare costa esattamente quanto accettare, il rifiuto non degrada l'accesso ai contenuti
e le funzioni sono accessorie e omogenee. **Se si aggiunge un terzo servizio con destinatari
diversi, la granularità per finalità torna difficilmente evitabile.**

## Implementazione

- `src/scripts/consenso.ts` — sorgente unica di verità. `consensoDato()` è l'unica domanda
  che il resto del codice deve porsi. Copia in memoria oltre a `localStorage`, perché in
  navigazione privata lo storage lancia e la scelta appena espressa deve comunque valere.
- `src/components/ConsensoPrivacy.astro` — banner e pannello sono **lo stesso componente**:
  compare da sé a chi non ha scelto, si riapre dalla pillola «Privacy» del footer mostrando
  lo stato corrente. Incluso una volta sola in `Footer.astro`, che è in tutte le pagine.
- **«Accetta» e «Rifiuta» condividono la stessa costante di classi CSS**: la pari evidenza
  richiesta dal provv. Garante 231/2021 non può dipendere da due stringhe tenute allineate
  a mano.
- Il link «Attiva la ricerca semantica» nella barra della modale di ricerca **non**
  raccoglie il consenso sul posto: chiude la modale e apre il pannello unico. Il pannello
  vive sotto l'overlay della ricerca, quindi lasciarla aperta lo renderebbe oscurato e
  inutilizzabile — il consenso si presta in un solo punto dell'interfaccia.
- La revoca ha effetto reale: smonta i player già caricati, termina il worker della ricerca
  (`spegniWorker()`) e cancella la cache `transformers-cache`.
- Pillola **«Privacy» in basso a sinistra**, permanente; l'RSS, che è contestuale alle
  pagine Fields, le compare a destra. Il footer è quindi sempre `justify-between`.

## Regola editoriale assunta nell'informativa

**Niente fotografie di volti identificabili di terzi.** Dichiarato nel § 2 come impegno del
sito (verificato al 2026-08-22: l'unico raster nei contenuti è `ritratto.png`, che è il
titolare — i poster YouTube in `public/yt/` non esistono più). Da qui in avanti è un vincolo
editoriale: pubblicare la foto di un workshop con persone riconoscibili rende falsa quella
frase, e richiede o la rimozione della frase o le liberatorie.

## Pagine

`/privacy/` e `/it/privacy/` da `PaginaPrivacy.astro`; il testo vive in `src/data/privacy.ts`.
**La data di revisione è mensile, non giornaliera** (`aggiornamento = '2026-08-01'`, reso
«agosto 2026»): un'informativa non cambia da un giorno all'altro e una data al giorno
invecchia a vista, segnalando abbandono appena passa una settimana.
L'email è offuscata con lo stesso token base64 del footer: forma `nome [at] dominio.it`,
leggibile a occhio anche senza JavaScript — un recapito irraggiungibile non soddisfa
l'art. 13(1)(a). Non è richiesto pubblicare un indirizzo fisico.

## Documenti in `docs/legal/`, e cosa vale

Nessuno di questi è pubblicato: `docs/` non è una collection e non entra nel build. Li legge
solo chi lavora al repo. Il testo che vede il visitatore è **solo** `src/data/privacy.ts`,
reso da `/privacy/` e `/it/privacy/`: è l'unico che deve descrivere lo stato attuale, e se
diverge da qualunque altro documento vince lui.

- `privacy-audit.md` — **fotografia pre-intervento**, scritta al presente su un sito che non
  esiste più: attribuisce ancora a Hugging Face, jsDelivr e ai preconnect di
  `lite-youtube-embed` trattamenti che sono stati eliminati. Va tenuto perché è il verbale del
  *perché* di quelle scelte, e quel valore sta proprio nel descrivere lo stato di partenza —
  ma è intestato con un avviso che dice cosa è stato risolto e cosa resta aperto, perché
  altrimenti induce un revisore a «correggere» l'informativa vera su un falso allarme.
- `informativa-privacy.it.md` — bozza superata, già intestata come tale.
- `banner-preferenze.md` — specifica del banner.

## Verifica Il comportamento è
stato verificato con Puppeteer contro il build di produzione (20 controlli): nessuna
richiesta a terzi senza consenso, modello servito solo dal nostro dominio, revoca che
smonta i player, 600 link esterni tutti con `rel="noopener noreferrer"`.
