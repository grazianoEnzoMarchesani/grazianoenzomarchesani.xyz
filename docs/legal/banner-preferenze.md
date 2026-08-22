# Banner delle preferenze — testo e requisiti

Bozza di lavoro. Accompagna `informativa-privacy.it.md`.

## Come si dividono le informazioni

Modello **a livelli**, quello raccomandato dal Garante (provv. 231/2021) e dalle linee guida EDPB. Non serve — ed è anzi sconsigliato — mettere tutto nel banner.

| | Dove | Cosa contiene |
|---|---|---|
| **1° livello** | Banner | 5-6 righe: chi, cosa si attiva, che puoi rifiutare, link all'informativa. I due pulsanti. |
| **2° livello** | Pagina `/privacy` | L'informativa completa (artt. 13-14 GDPR). |
| **Contestuale** | Sul singolo video | Avviso specifico nel punto in cui il trattamento avverrebbe. |

Il banner **non deve** contenere: elenco dei destinatari, basi giuridiche, tempi di conservazione, diritti dell'interessato, trasferimenti extra-UE. Tutto questo sta nell'informativa. Un banner troppo lungo indebolisce la validità del consenso, perché ostacola la comprensione.

---

## Requisiti vincolanti (provv. Garante 231/2021)

- ✅ **«Accetta» e «Rifiuta» sullo stesso livello**, stessa dimensione, stesso contrasto, stesso numero di click. Nessuna asimmetria cromatica che spinga verso l'accettazione.
- ✅ **X di chiusura** che chiude il banner **senza prestare consenso** (equivale a rifiuto).
- ❌ **Lo scroll non vale come consenso.** Nessun *scroll wall*.
- ❌ **Nessun cookie wall**: il contenuto resta accessibile in ogni caso.
- ✅ **Link all'informativa estesa** ben visibile nel banner.
- ✅ **Scelta modificabile in ogni momento** da un link permanente nel footer.
- ✅ **Se l'utente rifiuta, non ri-chiedere prima di 6 mesi** (salvo modifiche sostanziali o cambio dispositivo).
- ✅ Il banner non deve coprire il contenuto in modo da renderlo illeggibile.

## Stato predefinito: default-deny

Regola non negoziabile, da cui discende tutta l'implementazione.

**Prima di un click su «Accetta», il sito si comporta come se l'utente avesse rifiutato.** Non e' una scelta di prudenza: l'art. 4(11) GDPR richiede un'azione positiva inequivocabile e il considerando 32 esclude che silenzio, inattivita' o caselle pre-selezionate valgano come consenso.

Producono tutti lo stesso stato tecnico:

| Azione dell'utente | Stato funzioni | Scelta registrata | Banner riproposto |
|---|---|---|---|
| Clicca «Accetta» | attive | si' | no (per 6 mesi) |
| Clicca «Rifiuta» | **inattive** | si' | no (per 6 mesi) |
| Chiude con «✕» | **inattive** | no | si', alla visita successiva |
| Ignora il banner e naviga | **inattive** | no | si', alla visita successiva |
| Prima visita in assoluto | **inattive** | no | si' |

Il pulsante «Rifiuta» **non cambia il comportamento del sito** rispetto al non fare nulla: serve a registrare la volonta' dell'utente e quindi a non riproporgli piu' il banner. E' comunque obbligatorio che sia presente e di pari evidenza.

### Conseguenze tecniche

Non basta nascondere gli elementi: **non devono esistere** finche' manca il consenso.

- **Video** — senza consenso non viene renderizzato l'elemento `<lite-youtube>` e non viene caricato il suo JavaScript. Al suo posto, l'anteprima locale dentro un normale collegamento a YouTube (`target="_blank" rel="noopener noreferrer"`), che apre il video **fuori dal sito**. Resa visiva identica, perche' il poster e' gia' servito da noi. Serve intervenire sull'output di build in `src/lib/remark-articolo.ts`, che oggi emette direttamente `<lite-youtube>` nell'HTML statico, e sull'import statico in `src/components/FieldArticleBody.astro:18`, che va reso dinamico e condizionato.
- **Ricerca** — senza consenso non viene istanziato il Web Worker e non parte alcun download del modello. Resta attiva la sola ricerca testuale, gia' implementata, che usa `public/search-index.json`, file first-party che non richiede consenso. Da modificare `src/components/SearchModal.astro:107-108`, dove oggi `inizializzaWorker()` parte all'apertura della modale.
- **Registrazione della scelta** — in `localStorage`, non in `sessionStorage`, perche' deve sopravvivere alla chiusura della scheda. Archiviazione tecnica necessaria, non richiede a sua volta consenso.
- **Revoca** — deve smontare cio' che e' attivo e, per la ricerca, offrire la cancellazione del modello dalla cache del browser.

---

## Nota sulla granularità

Le linee guida richiedono in via generale un consenso **granulare per finalità**. Qui la scelta è stata di adottare un consenso **unico e globale**: è ammissibile perché rifiutare è esattamente facile quanto accettare, il rifiuto non degrada l'accesso ai contenuti e le funzioni coinvolte sono accessorie e omogenee (entrambe facoltative, entrambe attivate su iniziativa dell'utente).

Resta il fatto che l'opzione più solida sarebbe **due interruttori distinti** nel secondo livello, dato che i destinatari sono diversi (nessuno per la ricerca, Google per i video). Se in futuro si aggiungessero altri servizi, la granularità diventerebbe difficilmente evitabile.

---

## Testo del banner — italiano

> ### Preferenze
>
> Questo sito **non usa cookie, non raccoglie statistiche e non ti profila.**
>
> Due funzioni facoltative però possono attivarsi: la **ricerca semantica**, che scarica sul tuo dispositivo un modello di circa 33 MB servito da questo sito, e i **video YouTube**, che una volta avviati comunicano a Google il tuo indirizzo IP.
>
> Se rifiuti, nulla viene scaricato e nessun dato raggiunge Google: la ricerca resta disponibile in modalità testuale e i video restano raggiungibili tramite collegamento.
>
> [ **Accetta** ]  [ **Rifiuta** ]
>
> [Informativa completa](/privacy) · ✕

## Testo del banner — inglese

> ### Preferences
>
> This site **uses no cookies, collects no analytics and does not profile you.**
>
> Two optional features can be enabled: **semantic search**, which downloads a ~33 MB model to your device from this site, and **YouTube videos**, which share your IP address with Google once played.
>
> If you decline, nothing is downloaded and no data reaches Google: search still works in text mode and videos remain reachable via a link.
>
> [ **Accept** ]  [ **Decline** ]
>
> [Full privacy notice](/privacy) · ✕

---

## Avviso contestuale sul video

Mostrato sull'anteprima del video. Con consenso **rifiutato**, il click apre YouTube in una nuova scheda invece di caricare il player incorporato.

### Senza consenso (stato predefinito)

L'anteprima locale resta visibile, ma e' un semplice collegamento: il click **apre YouTube in una nuova scheda**, fuori dal sito. Nessun player incorporato, nessuno script di YouTube caricato.

**IT** — > ▶ **Guarda su YouTube** ↗
> Il video si apre sul sito di YouTube. — [Preferenze](/privacy)

**EN** — > ▶ **Watch on YouTube** ↗
> The video opens on YouTube's own site. — [Preferences](/privacy)

### Con consenso

Il player si carica nella pagina al click, con l'avviso mantenuto per trasparenza.

**IT** — > ▶ **Guarda il video**
> Caricandolo, YouTube (Google) ricevera' il tuo indirizzo IP. — [Preferenze](/privacy)

**EN** — > ▶ **Play video**
> Loading it will share your IP address with YouTube (Google). — [Preferences](/privacy)

---

## Avviso nella modale di ricerca

Con consenso rifiutato, riga discreta sotto il campo di input:

**IT** — > Ricerca testuale attiva. [Attiva la ricerca semantica](/privacy) (scarica ~33 MB, resta sul tuo dispositivo).

**EN** — > Text search active. [Enable semantic search](/privacy) (~33 MB download, stays on your device).

---

## Accesso permanente alle preferenze

### Posizione

**In basso a sinistra**, nel footer fisso (`src/components/Footer.astro`), come pillola con lo stesso trattamento visivo di RSS e Contatti:
`rounded-full bg-paper/60 px-3 py-1 text-[11px] font-mono tracking-wider backdrop-blur-sm`.

Il footer oggi ha due stati: `justify-between` quando mostra l'RSS (solo nelle pagine Fields, `showRss`), `justify-end` altrove. Con un elemento sempre presente a sinistra **diventa sempre `justify-between`**, e lo slot sinistro ospita un gruppo `flex items-center gap-2`.

| Pagina | Slot sinistro | Slot destro |
|---|---|---|
| Home, About, Skills, Publications | `[Privacy]` | `[Contatti]` |
| Fields e articoli | `[Privacy] [RSS]` | `[Contatti]` |

**Ordine:** Privacy per prima, RSS alla sua destra. Cosi' l'elemento permanente occupa sempre lo stesso angolo e non salta di posizione cambiando pagina, mentre e' quello contestuale a comparire di fianco.

⚠️ **Da verificare su schermo stretto:** nelle pagine Fields il footer arriva a tre pillole. Sotto i ~360 px va controllato che non vadano a capo o in collisione; eventualmente su mobile la pillola Privacy resta la sola icona.

### Un solo controllo

Una pillola sola, etichettata **«Privacy»**. Apre il pannello delle preferenze, che contiene lo stato corrente, i due pulsanti e il collegamento all'informativa completa. Non servono due link separati: avendo scelto il consenso unico c'e' un solo interruttore da governare, e l'informativa e' a un click da li'.

### Pannello delle preferenze

E' **lo stesso componente del banner**, riaperto su richiesta, con in piu' l'indicazione dello stato corrente:

**IT**
> ### Preferenze
> Stato attuale: **funzioni facoltative attive** / **funzioni facoltative disattivate**
>
> [testo identico a quello del banner]
>
> [ **Accetta** ]  [ **Rifiuta** ]
> [Informativa completa](/privacy) · ✕

**EN** — idem, con `Current status: optional features enabled / disabled`.

### Cosa deve fare la revoca

Effetto immediato e reale, non un semplice cambio di flag:

1. aggiornare la preferenza in `localStorage`;
2. smontare i player YouTube gia' caricati nella pagina corrente e riportarli allo stato anteprima-con-collegamento;
3. non istanziare piu' il Web Worker della ricerca; se attivo, terminarlo;
4. **cancellare il modello dalla Cache API** — 33 MB non possono restare sul dispositivo di chi ha appena revocato il consenso alla loro archiviazione. Va fatto contestualmente alla revoca, non lasciato all'utente.

---

## Email nell'informativa: offuscamento

L'indirizzo del titolare nella pagina `/privacy` va reso con **la stessa tecnica gia' in uso nel footer** (`src/components/Footer.astro:20-23`): token base64 generato al build, forma visibile `nome [at] dominio.it`.

Il requisito e' duplice e va soddisfatto insieme:

- **leggibile da un essere umano senza JavaScript** — altrimenti il recapito non sarebbe un contatto effettivo ai sensi dell'art. 13(1)(a) GDPR;
- **non raccoglibile da uno scraper** — nessun `mailto:` in chiaro nell'HTML statico, nessuna stringa contenente `@`.

La forma `nome [at] dominio.it` come testo, con decodifica del token solo al click per la copia o l'apertura del client di posta, soddisfa entrambi. La pagina privacy e' un bersaglio classico degli harvester: e' l'unico punto del sito dove ci si aspetta con certezza un indirizzo email.
