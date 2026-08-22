# Audit privacy / GDPR — grazianoenzomarchesani.xyz

> ⚠️ **Fotografia del codice ad agosto 2026, precedente agli interventi tecnici.**
> Questo documento descrive il sito **com'era prima** delle correzioni, e lo fa al presente:
> letto oggi, attribuisce al sito trattamenti che non esistono più. Resta agli atti perché
> è il verbale del *perché* sono state prese quelle decisioni, e quel valore sta proprio
> nel descrivere lo stato di partenza. **Non è una mappa dello stato attuale.**
>
> Per ciò che il sito fa adesso fa fede **`src/data/privacy.ts`**, il testo pubblicato.
>
> Cosa è stato risolto dopo questa ricognizione:
>
> - **§ 1.1 — modello di ricerca da Hugging Face e jsDelivr:** risolto con l'autoospitamento.
>   Pesi e binari WASM stanno in `public/motore/`, serviti da questo dominio
>   (`search-worker.ts`: `allowLocalModels`, `localModelPath`, `wasmPaths`). Hugging Face e
>   jsDelivr non sono più destinatari di alcun dato, e cade con loro il trasferimento extra-UE.
>   Resta il solo consenso ex art. 122 per l'archiviazione nella Cache API.
> - **§ 1.2 — preconnect di `lite-youtube-embed` verso Google e DoubleClick:** risolto
>   eliminando la libreria. La sostituisce `src/scripts/video-yt.ts`, che non emette alcun
>   preconnect e costruisce l'iframe `youtube-nocookie` solo su click esplicito, previo consenso.
> - **§ 3 — inventario dello storage:** ora incompleto. Alla tabella va aggiunto
>   `localStorage`, voce `privacy:scelta`, che registra la scelta sul banner per un massimo di
>   sei mesi (`src/scripts/consenso.ts`). È archiviazione tecnica necessaria, esente da consenso,
>   ed è dichiarata al § 3.2 dell'informativa pubblicata.
>
> Cosa è stato verificato dopo, e non è più un dubbio:
>
> - **§ 1.3 — copertura di `noopener`/`noreferrer`:** verificata con Puppeteer contro il build
>   di produzione, **600 link esterni, tutti coperti**. Il «va verificato voce per voce» è assolto.
>
> Cosa resta genuinamente aperto:
>
> - **§ 2.2 — registrar e provider DNS** non sono nominati nell'informativa pubblicata. Si
>   scioglie insieme al deploy: il dominio personale è ancora puntato al vecchio sito.
> - **§ 2.1 — pipeline di deploy:** `.github/workflows/` e `public/CNAME` non esistono ancora.
>   Non è una dimenticanza ma una scelta (vedi `docs/brain/constraints.md`): si lavora in
>   locale finché il sito non è pronto.

Ricognizione tecnica preliminare alla stesura dell'informativa. Stato del codice: branch `main`, build in `dist/` verificato.
Metodo: analisi di `package.json`, `astro.config.mjs`, tutti i sorgenti in `src/`, `scripts/`, `public/`, i vendor e le stringhe presenti nel bundle compilato.

---

## 1. Trattamenti che fanno uscire dati dal browser del visitatore

Sono i punti che l'informativa deve coprire per forza, e gli unici che richiedono una base giuridica diversa dal legittimo interesse.

### 1.1 Ricerca semantica — download del modello da Hugging Face e da jsDelivr  ⚠️ **il punto più serio**

- **Dove**: `src/scripts/search-worker.ts`, `src/scripts/search-client.ts`, `src/components/SearchModal.astro`
- **Cosa succede**: alla **apertura della modale di ricerca** (`SearchModal.astro:107-108`) parte un Web Worker che carica `@xenova/transformers` e scarica il modello `Xenova/all-MiniLM-L6-v2` quantizzato. Confermato nel bundle di produzione `dist/_astro/search-worker-*.js`, che contiene letteralmente `https://huggingface.co/` come `remoteHost` e `https://cdn.jsdelivr.net/npm/@xenova/transformers@.../dist/` come percorso dei binari WASM di onnxruntime-web.
- **Destinatari**: **Hugging Face, Inc.** (USA) per i pesi del modello (~33 MB); **jsDelivr** (gestito da Prospect One, Polonia, ma con nodi CDN globali) per i file `.wasm`.
- **Dati trasferiti**: indirizzo IP, user-agent, header `Referer`/`Origin` (quindi la pagina da cui l'utente sta cercando), timestamp. Sono dati personali a tutti gli effetti.
- **Trasferimento extra-UE**: sì, verso gli USA (art. 44-49 GDPR). Da verificare la certificazione DPF di Hugging Face Inc.; jsDelivr è formalmente UE ma serve da nodi in tutto il mondo.
- **Momento**: **prima che l'utente digiti qualcosa**. Basta aprire la modale (click sulla lente o ⌘K) per generare le richieste.
- **Storage sul terminale**: il modello viene memorizzato nella **Cache API** del browser (`env.useBrowserCache`, `search-worker.ts:6`). È archiviazione di informazioni sul dispositivo dell'utente → **art. 5(3) ePrivacy**, recepito in Italia dall'art. 122 Codice Privacy e dalle Linee guida cookie del Garante (provv. 231/2021). Non essendo "strettamente necessario", **richiede consenso preventivo**.
- **Elemento favorevole da valorizzare nell'informativa**: la query digitata **non lascia mai il browser**. L'embedding è calcolato in locale e confrontato con `public/search-index.json`, che è un file statico servito dal sito stesso. Non c'è nessun search-log lato server.
- **Attenuante strutturale**: esiste già un fallback puramente testuale (`search-client.ts:221-261`, `tipoMatch: 'testuale'`) che funziona **senza il modello**. Quindi la ricerca resta pienamente utilizzabile se l'utente rifiuta → il consenso è genuinamente libero, non un cookie wall.
- **Raccomandazione forte**: self-hostare il modello e i `.wasm` in `public/` (`env.allowLocalModels = true`, `env.localModelPath`, `env.backends.onnx.wasm.wasmPaths`). Elimina in un colpo solo due responsabili del trattamento, il trasferimento extra-UE e una delle due voci del banner. Resta solo il consenso per la Cache API — e con un self-host si può anche disattivare quella e tenere il modello in memoria.

### 1.2 YouTube — embed video

- **Dove**: `src/lib/remark-articolo.ts:100-111`, `src/components/FieldArticleBody.astro:8-18`, libreria `lite-youtube-embed`
- **Cosa è già fatto bene**: la **miniatura è scaricata al build** da `i.ytimg.com` e salvata in `public/yt/<id>.jpg` (`remark-articolo.ts:35-43`). A pagina caricata **non parte nessuna richiesta a Google**. Questo va detto esplicitamente nell'informativa: è la differenza tra un embed conforme e uno non conforme.
- **Cosa succede comunque** (`node_modules/lite-youtube-embed/src/lite-yt-embed.js:103-114`): al **primo `pointerover`/hover sulla facciata del video**, prima di qualunque click, la libreria inietta dei `<link rel="preconnect">` verso:
  - `https://www.youtube-nocookie.com`
  - `https://www.google.com`
  - `https://googleads.g.doubleclick.net`
  - `https://static.doubleclick.net`

  Un preconnect apre connessione TCP/TLS e risoluzione DNS: **l'IP del visitatore arriva a Google e alla rete pubblicitaria DoubleClick al passaggio del mouse**. È un contatto involontario e difficilmente giustificabile senza consenso. **Va disattivato o condizionato al consenso.**
- **Al click**: viene creato l'iframe verso `https://www.youtube-nocookie.com/embed/<id>` (riga 208). "nocookie" **non significa "senza tracciamento"**: Google riceve IP, user-agent, referer e scrive comunque nel `localStorage` del dominio dell'iframe; i cookie pubblicitari sono differiti, non eliminati. Va trattato come trasferimento a **Google Ireland Ltd. / Google LLC** con base giuridica **consenso**.
- **Link di fallback**: `<a class="lite-youtube-fallback" href="https://www.youtube.com/watch?v=...">` (riga 110) — è un link normale, si attiva solo su click, ma porta a youtube.com pieno.
- **Stato attuale dei contenuti**: un solo video, in `src/content/research/prova-articolo-completo/` (articolo di prova). Il meccanismo però è generale e va normato adesso.
- **Raccomandazione**: click-to-load esplicito per ogni video (placeholder + "Carica il video da YouTube — verranno inviati dati a Google"), che è anche la soluzione che il Garante considera più solida rispetto al consenso globale del banner.

### 1.3 Link in uscita verso terzi

Presenti nel sito pubblicato: `doi.org`, `github.com`, `orcid.org`, `pubblicazioni.unicam.it` (IRIS), `linkedin.com`, `instagram.com`, `youtube.com`, `sciencedirect.com`, `theplan.it`, `agathon.it`, `sitda.net`, `serif.com`, `cityrhythm.it`, `lifeagreenet-explorer.eu`, `envireader.altervista.org`.

- Non sono un trattamento tuo, ma l'header `Referer` comunica al sito di destinazione da quale tua pagina è arrivato l'utente.
- Ho contato 15 `target="_blank"` e 15 occorrenze di `noopener`/`noreferrer`: la copertura sembra completa, ma va verificata voce per voce prima di dichiararlo.
- L'informativa deve contenere la clausola standard di **esclusione di responsabilità per i siti terzi collegati**.

---

## 2. Trattamenti che avvengono comunque, a monte del browser

### 2.1 Hosting — GitHub Pages

- Da `docs/brain/stack.md` e `constraints.md`: deploy previsto su **GitHub Pages**, non ancora attivo (non esistono `.github/workflows/` né `public/CNAME` — la pipeline è ancora da definire).
- **GitHub, Inc.** (gruppo Microsoft, USA) agisce come **responsabile del trattamento ex art. 28**. I server web registrano necessariamente **indirizzo IP, user-agent, URL richiesto, timestamp, referer** per ogni richiesta.
- Problema pratico da dichiarare onestamente: sul piano gratuito di GitHub Pages **non hai accesso ai log né controllo sulla loro retention**. L'informativa deve dire che i log esistono, che sono trattati dal fornitore per sicurezza e funzionamento (art. 6(1)(f)), e che i tempi di conservazione sono quelli del fornitore.
- Serve il riferimento al **GitHub DPA** (parte dei Customer Terms) e al meccanismo di trasferimento (Microsoft/GitHub sono certificati **EU-US Data Privacy Framework**).
- **Base giuridica**: legittimo interesse. **Nessun consenso richiesto**, ma obbligo informativo sì.

### 2.2 Dominio e DNS

`grazianoenzomarchesani.xyz` è un dominio custom: registrar e provider DNS vedono le query di risoluzione. Vanno nominati nell'informativa una volta scelti/confermati.

---

## 3. Storage sul terminale dell'utente — inventario esatto

Ho verificato: **`document.cookie` non compare mai nel codice. Il sito non usa cookie. Nessuno.** È un'affermazione forte e verificabile, da mettere in evidenza.

| Meccanismo | Dove | Contenuto | Qualificazione |
|---|---|---|---|
| **Cookie** | — | nessuno | — |
| `sessionStorage` | `PaginaFields.astro:180`, `fields-spiral.ts:909-910`, `FieldArticleNavigation.astro:71,80` | chiave `fields-target-marker`, un ID di ancoraggio per riposizionare la spirale 3D dopo la navigazione | **Tecnico/strettamente necessario**, nessun identificatore, cancellato alla chiusura della scheda → **nessun consenso**, solo informativa |
| **Cache API** | `search-worker.ts:6` | pesi del modello ONNX (~33 MB) | **Non necessario → consenso ex art. 122** |
| `localStorage` / IndexedDB diretti | — | nessuno nel codice proprio | — (ma l'iframe YouTube ne scrive sul proprio dominio, una volta caricato) |

---

## 4. Dati personali di terzi pubblicati sul sito

Punto spesso dimenticato e qui rilevante, perché **tu** sei il titolare di questo trattamento.

- **Co-autori delle pubblicazioni**: `src/content/publications/pubblicazioni.autori.json` è un registro di ~decine di nomi e cognomi di persone fisiche, alimentato automaticamente dal `.bib` scaricato da IRIS UNICAM (`scripts/genera-pubblicazioni.mjs`). Nomi e affiliazioni sono dati personali. Base giuridica ragionevole: **legittimo interesse** (citazione bibliografica, dato già pubblico e necessario all'integrità del riferimento scientifico). Va però considerato l'**art. 14** (informativa a interessati i cui dati non sono raccolti presso di loro) e previsto un canale per obiezioni/rettifiche dei nomi.
- **`src/content/publications/references.bib`** — stessa natura, dati bibliografici importati.
- **Contenuti degli articoli in `src/content/`**: da verificare manualmente se contengono **fotografie di persone identificabili** (studenti, partecipanti a workshop, sopralluoghi, video mapping). Se sì servono liberatorie e una menzione nell'informativa. **Non posso stabilirlo dal codice: è una verifica che devi fare tu sulle immagini.**
- **Dati tuoi** (`src/lib/identita.ts`, `content/about/percorso.json`, `content/about/ritratto.png`, email): non sono un trattamento di terzi, ma servono a **identificare il titolare** nell'informativa.

---

## 5. Contatti e comunicazioni

- **Nessun form**: niente contatti, newsletter, commenti, login, registrazione, ricerca lato server. Verificato: non esiste un solo `<form>` che invii dati.
- **Email**: nel footer, offuscata via token e decodificata a runtime (`Footer.astro:230-295`). Due azioni possibili, **entrambe solo su click esplicito**:
  - copia negli appunti (`navigator.clipboard.writeText` — solo scrittura, il codice **non legge mai** gli appunti);
  - apertura del client di posta via `mailto:`.
- Ne discende un trattamento reale: **se l'utente scrive, tu tratti nome, email e contenuto del messaggio**. L'informativa deve avere una sezione dedicata (base giuridica art. 6(1)(b)/(f), conservazione, provider di posta — presumibilmente UNICAM/Microsoft, da confermare).

---

## 6. Tecnologie verificate e NON problematiche

Da dichiarare esplicitamente nell'informativa: è la parte che rende il documento credibile invece che difensivo.

| Tecnologia | Esito |
|---|---|
| **Font** | `@fontsource/anton` + `@fontsource-variable/inter`, file `.woff2` **serviti dal tuo dominio** e preloadati (`BaseHead.astro:29-31`). **Nessuna chiamata a Google Fonts** — l'esatto scenario sanzionato dal LG di Monaco nel 2022. Confermato: `fonts.googleapis.com` non compare da nessuna parte |
| **BKLIT** | I componenti grafici sono **vendorizzati in `src/vendor/bklit/`**. Nessuna chiamata di rete, nessuna telemetria: l'unica occorrenza di `ui.bklit.com` è un URL in un commento. ⚠️ **Attenzione terminologica**: "Bklit" è anche un prodotto di web analytics — qui **non** stai usando quel servizio, solo la sua libreria UI. Non menzionarlo come analytics nell'informativa, sarebbe fuorviante |
| **visx / d3 / topojson** | bundle locali, rendering client-side, nessuna rete |
| **Three.js / GSAP / motion** | bundle locali, animazioni, nessuna rete |
| **KaTeX** | formule renderizzate **al build** (`rehype-katex`); CSS e font KaTeX inclusi nel bundle locale, zero JS a runtime |
| **Miniature YouTube** | scaricate al build, servite da `/yt/` — nessun contatto con `i.ytimg.com` dal browser |
| **`public/search-index.json`** | file statico first-party, contiene solo titoli/tag/vettori dei tuoi contenuti |
| **RSS** (`/rss.xml`, `rss.xsl`) | statico, nessun tracciamento |
| **Astro ClientRouter** (view transitions) | navigazione client-side, nessuna persistenza |
| **Grafici React** | isole idratate dietro `IntersectionObserver`, dati locali |
| **puppeteer, svgo, png-to-ico** | esclusivamente build-time, mai nel browser |
| **Analytics / tag manager / pixel / ads / A/B / heatmap / CMP di terzi** | **assenti**. Nessun Google Analytics, nessun Plausible, nessun beacon. Verificato: `sendBeacon`, `XMLHttpRequest`, `WebSocket` non compaiono nel codice proprio |
| **Geolocalizzazione / fingerprinting** | assenti. `navigator` è usato solo per: clipboard, rilevamento macOS per la scorciatoia ⌘K (`Nav.astro:118`), rilevamento iOS per il fallback di copia (`TastoCitazione.astro:182`). Sono letture di user-agent locali, non trasmesse, non persistite |

---

## 7. Sintesi: cosa deve contenere l'informativa

**Base giuridica per trattamento**

| Trattamento | Base giuridica | Consenso? |
|---|---|---|
| Log di hosting (GitHub Pages) | art. 6(1)(f) legittimo interesse — sicurezza e funzionamento | No |
| `sessionStorage` tecnico (spirale Fields) | art. 122 c.1 Codice Privacy — strettamente necessario | No |
| Ricerca semantica (Hugging Face + jsDelivr + Cache API) | art. 6(1)(a) + art. 122 | **Sì, preventivo** |
| Video YouTube (preconnect + iframe) | art. 6(1)(a) + art. 122 | **Sì, preventivo** |
| Email di contatto | art. 6(1)(b)/(f) | No, ma informativa al primo contatto |
| Nomi dei co-autori nelle pubblicazioni | art. 6(1)(f) — citazione bibliografica | No, ma art. 14 |

**Responsabili / destinatari da nominare**: GitHub Inc. (hosting), Hugging Face Inc. (modello), jsDelivr/Prospect One (WASM), Google Ireland Ltd. e Google LLC (YouTube), registrar/DNS, provider email.

**Trasferimenti extra-UE**: USA per GitHub, Hugging Face, Google. Indicare per ciascuno il meccanismo (adeguatezza EU-US DPF dove applicabile, SCC altrimenti) — Hugging Face va verificato caso per caso.

**Sezioni obbligatorie**: identità e contatti del titolare (art. 13 — e va chiarito che il titolare sei **tu come persona fisica**, non l'Università di Camerino, anche se i contenuti sono accademici); assenza di DPO; finalità e basi giuridiche; destinatari; trasferimenti; periodi di conservazione; diritti artt. 15-22; **diritto di revocare il consenso in ogni momento e come farlo**; reclamo al Garante; assenza di decisioni automatizzate e di profilazione da parte del titolare (fermo restando che Google può profilare tramite l'embed); natura non obbligatoria del conferimento; sito non destinato a minori.

**Meccanismo di raccolta del consenso** — vincoli del provv. Garante 231/2021:
- primo livello con **"Accetta tutto" e "Rifiuta tutto" di pari evidenza**, più la X di chiusura;
- **scroll non vale come consenso**, e niente cookie wall;
- **granularità**: due voci distinte — *Video YouTube* e *Ricerca semantica* — perché sono finalità e destinatari diversi;
- consenso non ri-richiedibile prima di **6 mesi**;
- registrazione della scelta: paradossalmente il banner stesso è l'unica cosa che ha bisogno di scrivere sul terminale (una preferenza in `localStorage`) — è però archiviazione tecnica necessaria e non richiede consenso a sua volta.
- **Alternativa consigliata al banner globale**: click-to-load per il video + toggle nella modale di ricerca. Più conforme, meno invasivo, e coerente col vincolo "velocità estrema" di `constraints.md` perché evita l'ennesimo script bloccante.

**Bilinguismo**: il sito è EN/IT con routing i18n. L'informativa va prodotta **in entrambe le lingue**, con la versione italiana come riferimento legale.

---

## 8. Interventi tecnici — ESEGUITI

Stato al 2026-08-22. Verificati con Puppeteer contro il build di produzione
(20 controlli, tutti superati: nessuna richiesta a terzi senza consenso, modello
servito dal nostro dominio, revoca che smonta i player già caricati).

Ordinati per rapporto tra beneficio di conformità e costo.

1. ✅ **Preconnect verso Google e DoubleClick eliminati.** `lite-youtube-embed` è stato rimosso del tutto (`npm uninstall`): la facciata video è ora markup nostro, prodotto da `src/lib/remark-articolo.ts`, e il player lo costruisce `src/scripts/video-yt.ts` solo dopo il consenso.
2. ✅ **Modello ONNX e binari `.wasm` autoospitati** sotto `/motore/`, scaricati al build da `scripts/prepara-motore-ricerca.mjs` e non versionati. `allowRemoteModels = false` impedisce ogni ritorno silenzioso a Hugging Face. Hugging Face e jsDelivr non sono più destinatari, e con loro sparisce un trasferimento extra-UE.
3. ✅ **Click-to-load sui video.** Senza consenso la facciata è un collegamento esterno a youtube.com con avviso; con il consenso il click carica `youtube-nocookie.com` nella pagina.
4. ✅ **Worker della ricerca dietro consenso** (`src/components/SearchModal.astro`), con il fallback testuale sempre attivo e l'invito ad attivare la semantica nella barra di stato della modale.
5. ✅ **`rel="noopener noreferrer"` verificato su tutti i link esterni**: 600 collegamenti verso domini terzi in tutto il build, zero senza. Il controllo è rieseguibile scandendo `dist/**/*.html`.
6. ⬜ Verificare le immagini nei contenuti per volti identificabili — **richiede l'occhio dell'utente, non ispezionabile dal codice**.
7. ⬜ Definire la pipeline di deploy e confermare hosting, registrar e provider email prima di nominarli nell'informativa.
