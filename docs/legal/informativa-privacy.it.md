# Informativa sulla privacy — bozza superata

> ⚠️ **Questo file non è più la fonte del testo pubblicato.**
> L'informativa è ora implementata: il testo vivo, in italiano e in inglese, sta in
> **`src/data/privacy.ts`** ed è servito da `/privacy/` e `/it/privacy/`.
> Le modifiche vanno fatte lì. Questo documento resta solo come traccia della bozza
> discussa in fase di stesura; se i due testi divergono, vince il codice.

**Bozza di lavoro** — non ancora pubblicata. Da rivedere con un professionista prima della messa online.
Scritta per lo stato del sito **successivo** agli interventi tecnici concordati (modello di ricerca autoospitato, preconnect verso Google disattivati, video a caricamento su richiesta). I paragrafi che dipendono da quegli interventi sono marcati con ⚙️ e vanno riletti se gli interventi non vengono fatti.

Ultimo aggiornamento: agosto 2026

---

## In breve

Questo sito non usa cookie, non usa sistemi di statistiche o di analisi del traffico, non contiene pubblicità e non profila chi lo visita. I caratteri tipografici, i grafici e le animazioni sono serviti direttamente da questo dominio: nessuna richiesta parte verso Google, verso reti pubblicitarie o verso servizi di terze parti mentre leggi una pagina.

Due sole funzioni possono comportare un trattamento ulteriore, ed entrambe si attivano **solo se scegli di attivarle**: la ricerca semantica e la riproduzione dei video YouTube. Se non dai il consenso, il sito resta pienamente utilizzabile.

Quanto segue spiega tutto nel dettaglio, come richiesto dagli articoli 13 e 14 del Regolamento (UE) 2016/679 (GDPR).

---

## 1. Titolare del trattamento

Il titolare del trattamento è **Graziano Enzo Marchesani**, in qualità di persona fisica.

- Email: graziano.marchesani [at] unicam.it

L'art. 13(1)(a) GDPR richiede l'identita' e i **dati di contatto** del titolare: un recapito idoneo a consentire l'esercizio dei diritti. Un indirizzo email e' sufficiente. Non e' richiesta l'indicazione di un indirizzo fisico di residenza.

Questo è un sito personale. Sebbene i contenuti riguardino attività di ricerca e didattica svolte presso l'Università di Camerino, **il sito non è un sito istituzionale e l'Università non è titolare né responsabile dei trattamenti qui descritti**.

Non è stato nominato un Responsabile della protezione dei dati (DPO), non ricorrendone i presupposti di cui all'art. 37 GDPR.

---

## 2. Cosa questo sito non fa

Per chiarezza, e perché è verificabile ispezionando il codice sorgente del sito, che è pubblico:

- **Non utilizza cookie.** Nessuno, né tecnici né di terze parti.
- **Non utilizza sistemi di analisi del traffico** (Google Analytics o equivalenti), né pixel di tracciamento, né beacon, né mappe di calore, né test A/B.
- **Non ospita pubblicità** e non aderisce a reti pubblicitarie.
- **Non profila** gli utenti e non adotta processi decisionali automatizzati.
- **Non rileva la posizione geografica** e non impiega tecniche di identificazione del dispositivo (*fingerprinting*).
- **Non ospita moduli di contatto, registrazione, commenti o iscrizione a newsletter.** Nessun dato viene inviato a questo sito compilando qualcosa.
- **I caratteri tipografici sono ospitati su questo dominio.** Non viene effettuata alcuna chiamata a Google Fonts o ad altri servizi esterni di distribuzione dei font.
- **Le formule matematiche, i grafici e le animazioni** sono generati localmente, senza librerie caricate da server esterni.
- **Le anteprime dei video** sono scaricate in fase di pubblicazione e servite da questo dominio: aprendo una pagina che contiene un video, **nessuna richiesta raggiunge Google o YouTube**.

---

## 3. Dati trattati senza necessità di consenso

### 3.1 Dati di navigazione registrati dal servizio di hosting

Il sito è ospitato su **GitHub Pages**, servizio fornito da GitHub, Inc. Come ogni server web, l'infrastruttura registra automaticamente alcuni dati per ogni richiesta ricevuta:

- indirizzo IP;
- tipo e versione del browser e del sistema operativo (*user agent*);
- indirizzo della pagina richiesta e data e ora della richiesta;
- eventuale pagina di provenienza (*referer*).

Questi dati sono necessari al funzionamento stesso della comunicazione via Internet: senza indirizzo IP nessuna pagina potrebbe esserti recapitata.

- **Finalità:** consegna dei contenuti, sicurezza dell'infrastruttura, diagnosi di malfunzionamenti e prevenzione degli abusi.
- **Base giuridica:** legittimo interesse del titolare a erogare il servizio in modo sicuro e funzionante, art. 6(1)(f) GDPR.
- **Destinatario:** GitHub, Inc. (gruppo Microsoft), in qualità di responsabile del trattamento ex art. 28 GDPR.
- **Conservazione:** i tempi sono determinati dal fornitore. Il titolare **non ha accesso a questi registri** e non li utilizza per alcuna finalità propria.
- **Trasferimento extra-UE:** vedi § 6.

### 3.2 Archiviazione tecnica sul tuo dispositivo

Nella pagina *Fields* il sito salva temporaneamente, nella memoria di sessione del browser (`sessionStorage`), un identificativo dell'elemento che stavi consultando. Serve unicamente a riposizionare correttamente l'animazione quando torni indietro da un articolo.

Non contiene dati personali né identificativi, non permette di riconoscerti, **non è leggibile da terzi e viene cancellato automaticamente alla chiusura della scheda del browser**.

- **Base giuridica:** archiviazione strettamente necessaria alla fornitura del servizio richiesto, esente da consenso ai sensi dell'art. 122, comma 1, del Codice Privacy (D.Lgs. 196/2003) e dell'art. 5(3) della Direttiva 2002/58/CE.

Se esprimi una scelta sul banner delle preferenze, la scelta stessa viene invece salvata nella memoria locale del browser (`localStorage`, voce `privacy:scelta`) insieme alla data: resta al massimo sei mesi, poi scade e tutto torna allo stato di rifiuto. Anche questa archiviazione è tecnica e necessaria.

### 3.3 Contatti via email

Il sito pubblica un indirizzo email, che puoi copiare o usare per aprire il tuo programma di posta. **Nessun messaggio transita da questo sito**: la comunicazione avviene interamente tra il tuo servizio di posta e il mio.

Se mi scrivi, tratterò i dati contenuti nel messaggio (nome, indirizzo email, e ogni informazione che deciderai di includere) al solo fine di risponderti.

- **Base giuridica:** esecuzione di misure precontrattuali o riscontro a una tua richiesta, art. 6(1)(b) GDPR; in via residuale, legittimo interesse a dare seguito alle comunicazioni ricevute, art. 6(1)(f).
- **Conservazione:** per il tempo necessario a gestire la richiesta e i suoi eventuali sviluppi.
- **Destinatario:** il fornitore del servizio di posta elettronica. Allo stato attuale la posta del dominio `@unicam.it` e' erogata dall'Universita' di Camerino tramite **Google Workspace**: i messaggi sono consegnati e conservati sui server di Google, con i trasferimenti extra-UE che ne conseguono. E' un assetto scelto dall'Ateneo, non da questo sito.

### 3.4 Nomi dei coautori delle pubblicazioni

Il sito pubblica l'elenco delle pubblicazioni scientifiche del titolare, comprensivo dei **nomi dei coautori**, importati dall'archivio istituzionale della ricerca IRIS dell'Università di Camerino e dai riferimenti bibliografici dei rispettivi editori.

I dati sono limitati a **cognome e iniziali del nome**. Non vengono raccolti né pubblicati indirizzi email, affiliazioni, identificativi personali o altri dati dei coautori.

- **Finalità:** corretta e completa attribuzione della paternità scientifica dei lavori, obbligo deontologico prima ancora che giuridico.
- **Base giuridica:** legittimo interesse alla veridicità e all'integrità del riferimento bibliografico, art. 6(1)(f) GDPR. Si tratta di dati già resi pubblici dagli editori, riprodotti nel medesimo contesto e con le medesime finalità originarie, entro le ragionevoli aspettative degli interessati.
- **Informativa ex art. 14:** i dati non sono raccolti presso gli interessati. Informarli individualmente comporterebbe uno sforzo sproporzionato ai sensi dell'art. 14(5)(b) GDPR; la presente informativa, resa pubblicamente accessibile, assolve a tale obbligo.
- **Diritti:** ogni coautore può in qualsiasi momento richiedere la rettifica della grafia del proprio nome oppure opporsi al trattamento, scrivendo all'indirizzo indicato al § 1. Le richieste sono gestite senza ritardo.

---

## 4. Dati trattati solo con il tuo consenso

### Stato predefinito: tutto disattivato

Nessuna delle due funzioni descritte in questo paragrafo si attiva automaticamente.

Lo stato iniziale del sito, per chiunque e su qualunque dispositivo, è **di rifiuto**. Finché non compi un'azione positiva ed esplicita di accettazione, non viene scaricato alcun contenuto da terzi, non viene archiviato nulla sul tuo dispositivo oltre a quanto indicato al § 3.2, e nessuna richiesta raggiunge i soggetti indicati.

Equivalgono a rifiuto, e producono esattamente lo stesso effetto tecnico: chiudere il banner con la «✕», premere «Rifiuta», ignorare il banner, proseguire la navigazione senza rispondere. Nessun comportamento passivo può essere interpretato come consenso, in conformità all'art. 4(11) e al considerando 32 del GDPR.

L'unica differenza tra il rifiuto espresso e l'assenza di scelta riguarda il banner stesso: se rifiuti esplicitamente, la scelta viene registrata e non ti verrà richiesta di nuovo per sei mesi; se non rispondi, il banner potrà essere riproposto in una visita successiva.

### 4.1 Ricerca semantica ⚙️

La ricerca del sito funziona in due modalità.

La **ricerca testuale** è sempre attiva, non richiede consenso e non comporta alcun trattamento ulteriore: confronta ciò che digiti con un indice statico servito da questo dominio.

La **ricerca semantica** aggiunge la capacità di trovare contenuti concettualmente affini anche quando non contengono le parole che hai digitato. Per farlo, il browser deve scaricare un modello linguistico di circa 33 MB, servito da questo stesso dominio, e conservarlo nella memoria cache del browser per non doverlo riscaricare a ogni visita.

**Ciò che digiti non lascia mai il tuo browser.** L'elaborazione avviene interamente sul tuo dispositivo: non esiste alcun registro delle ricerche, né lato server né altrove. Nessuno — nemmeno il titolare — può sapere cosa hai cercato.

- **Base giuridica:** consenso, art. 6(1)(a) GDPR e art. 122 Codice Privacy per l'archiviazione sul dispositivo.
- **Se non presti il consenso:** la ricerca continua a funzionare in modalità testuale. Non viene scaricato nulla e non viene archiviato nulla sul tuo dispositivo.

### 4.2 Video YouTube ⚙️

Alcuni articoli contengono video ospitati su YouTube. L'anteprima che vedi nella pagina è un'immagine statica servita da questo dominio: **aprendo la pagina non viene contattato alcun server di Google**.

Il video viene caricato **solo se lo richiedi espressamente**. In quel momento il browser stabilisce una connessione con i server di Google e vengono comunicati:

- il tuo indirizzo IP;
- informazioni sul browser e sul dispositivo;
- l'indirizzo della pagina da cui stai guardando il video;
- eventuali dati già presenti nel tuo browser relativi al tuo account Google, se hai effettuato l'accesso.

Viene utilizzata la modalità *privacy avanzata* (dominio `youtube-nocookie.com`), che **riduce ma non elimina** questi trattamenti: Google può comunque archiviare informazioni sul tuo dispositivo e associare la visione al tuo profilo.

Da quel momento **il trattamento è effettuato da Google in qualità di titolare autonomo**, secondo le proprie condizioni. Il titolare di questo sito non ha accesso a tali dati né alcun controllo su di essi. Per saperne di più: [Informativa privacy di Google](https://policies.google.com/privacy).

- **Base giuridica:** consenso, art. 6(1)(a) GDPR e art. 122 Codice Privacy.
- **Destinatari:** Google Ireland Limited e Google LLC.
- **Se non presti il consenso:** l'anteprima resta visibile insieme al titolo del video e a un collegamento diretto a YouTube, che puoi scegliere di aprire. Nessuna parte dell'articolo diventa inaccessibile.

### 4.3 Revoca del consenso

Puoi **modificare o revocare la tua scelta in qualsiasi momento**, senza doverne indicare il motivo e senza alcuna conseguenza sulla fruibilità del sito, dal collegamento **«Preferenze privacy»** presente in fondo a ogni pagina.

La revoca non pregiudica la liceità del trattamento effettuato prima della revoca stessa. Con riferimento ai dati eventualmente già acquisiti da Google, la revoca sul presente sito impedisce ulteriori trasmissioni ma non incide sui trattamenti già effettuati da tale soggetto, verso il quale i diritti vanno esercitati direttamente.

---

## 5. Collegamenti verso siti esterni

Il sito contiene collegamenti a risorse esterne: DOI di pubblicazioni scientifiche, archivi istituzionali, repository di codice, profili accademici e social, siti di progetti.

Seguendo tali collegamenti lasci questo sito. Il titolare **non esercita alcun controllo sui siti di destinazione** e non risponde dei loro contenuti né dei trattamenti di dati personali da essi effettuati, disciplinati dalle rispettive informative.

---

## 6. Trasferimenti verso Paesi terzi

Alcuni dei soggetti indicati hanno sede o infrastrutture al di fuori dello Spazio Economico Europeo, in particolare negli Stati Uniti d'America.

| Soggetto | Trattamento | Garanzia per il trasferimento |
|---|---|---|
| GitHub, Inc. (Microsoft) | hosting e registri di accesso | Decisione di adeguatezza *EU–US Data Privacy Framework*; clausole contrattuali tipo |
| Google Ireland Ltd. / Google LLC | riproduzione dei video, **solo previo consenso** | Decisione di adeguatezza *EU–US Data Privacy Framework*; clausole contrattuali tipo |

I trasferimenti avvengono ai sensi degli articoli 44 e seguenti del GDPR. Puoi ottenere maggiori informazioni sulle garanzie adottate scrivendo all'indirizzo indicato al § 1.

---

## 7. Periodi di conservazione

- **Registri di accesso dell'hosting:** secondo le politiche del fornitore; non accessibili al titolare.
- **Archiviazione tecnica di sessione:** fino alla chiusura della scheda del browser.
- **Preferenze sul consenso:** fino a 6 mesi, o fino a quando non le modifichi.
- **Modello della ricerca semantica:** nella cache del tuo browser, finché non la svuoti o non revochi il consenso.
- **Corrispondenza email:** per il tempo necessario a gestire la richiesta.
- **Dati bibliografici:** finché la pubblicazione resta presente sul sito.

---

## 8. I tuoi diritti

In relazione ai dati che ti riguardano puoi esercitare, ai sensi degli articoli 15-22 del GDPR, i diritti di:

- **accesso** — sapere se e quali dati sono trattati e ottenerne copia;
- **rettifica** — correggere dati inesatti o incompleti;
- **cancellazione** — ottenere l'eliminazione dei dati, nei casi previsti;
- **limitazione** — chiedere la sospensione del trattamento;
- **portabilità** — ricevere i dati in formato strutturato, ove applicabile;
- **opposizione** — opporti in qualsiasi momento ai trattamenti fondati sul legittimo interesse, per motivi connessi alla tua situazione particolare;
- **revoca del consenso** — in qualsiasi momento, con le modalità del § 4.3.

Le richieste vanno inviate all'indirizzo indicato al § 1 e ricevono riscontro entro un mese, prorogabile nei casi previsti dall'art. 12(3) GDPR.

Se ritieni che il trattamento violi la normativa, hai diritto di proporre **reclamo al Garante per la protezione dei dati personali** (Piazza Venezia 11, 00187 Roma — [www.garanteprivacy.it](https://www.garanteprivacy.it)) o all'autorità di controllo dello Stato in cui risiedi, oppure di ricorrere all'autorità giudiziaria.

---

## 9. Processi decisionali automatizzati

Il titolare non effettua profilazione né adotta decisioni basate unicamente su trattamenti automatizzati ai sensi dell'art. 22 GDPR.

Resta inteso che Google, ove tu presti il consenso alla riproduzione dei video, può effettuare attività di profilazione secondo le proprie condizioni, sulle quali il titolare non ha controllo.

---

## 10. Minori

Il sito non è rivolto a minori di anni quattordici e non raccoglie consapevolmente i loro dati. I contenuti didattici sono destinati a studenti universitari.

---

## 11. Natura del conferimento

Nessun conferimento di dati è obbligatorio. Il mancato consenso alle funzioni descritte al § 4 comporta unicamente la loro disattivazione, senza alcuna limitazione all'accesso ai contenuti del sito.

---

## 12. Modifiche

La presente informativa può essere aggiornata per adeguarla a modifiche del sito o della normativa. La data in testa al documento indica l'ultima revisione. Le modifiche sostanziali che incidono sui consensi già raccolti comportano una nuova richiesta di consenso.
