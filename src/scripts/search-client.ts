export interface DocumentoRicerca {
  id: string;
  collezione: 'research' | 'tools' | 'teaching' | 'projects' | 'publications' | 'skills';
  categoria: string;
  slug: string;
  lingua: 'en' | 'it';
  titolo: string;
  sommario: string;
  tag: string[];
  /** Presente solo sulle pubblicazioni. */
  autori?: string;
  /** Presente solo su cio' che ha un DOI. */
  doi?: string;
  url: string;
  vettore?: number[];
  /** Rilevanza relativa al miglior risultato della stessa ricerca, 0-100. */
  punteggio?: number;
  /**
   * Similarita' coseno grezza con la query, 0-1, indipendente dagli altri
   * risultati. E' l'unico numero che dice quanto il modello e' davvero
   * sicuro: `punteggio` vale 100 per il primo risultato anche quando il
   * primo risultato e' spazzatura.
   */
  affinita?: number;
  tipoMatch?: 'semantico' | 'testuale';
}

export interface StatoMotore {
  modelloPronto: boolean;
  caricamento: boolean;
  percentuale: number;
  errore: string | null;
}

export type ListenerStato = (stato: StatoMotore) => void;

/** Minuscolo + rimozione diacritici: "Façade" -> "facade". */
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * I campi su cui cerchiamo alla lettera, dal piu' al meno probante.
 * L'ordine conta: e' lo stesso di `campiNormalizzati()`.
 *
 * Il DOI vale piu' di tutto perche' identifica un solo documento: chi lo
 * incolla ha gia' deciso cosa vuole. Gli autori valgono piu' del titolo
 * perche' sono la cosa che il modello semantico sbaglia sempre — un cognome
 * non ha significato, ha solo un'ortografia.
 */
const PESI_CAMPI = [12, 6, 5, 4, 3, 2] as const;

/**
 * Parole funzionali, escluse dal punteggio lessicale.
 *
 * Non e' un dettaglio cosmetico: l'IDF misura la rarita' di un termine nel
 * corpus, e il corpus e' in gran parte inglese. Senza questa lista "come" e
 * "una" risulterebbero rarissimi, quindi importantissimi, e una domanda in
 * italiano verrebbe ordinata dalle sue congiunzioni.
 */
const STOPWORD = new Set(
  ('the a an of and or to in on for with by is are was were as at from that this these those it its ' +
   'what how why when where which who do does did can could i you we they there here about into over ' +
   'il lo la i gli le un uno una dei delle degli di da del dello della a al allo alla ai agli alle ' +
   'e ed o od che chi cui come per con su tra fra non piu meno si ne ci lo li ' +
   'nel nello nella nei negli nelle sul sullo sulla sui sugli sulle cosa quale quali dove quando perche'
  ).split(' ')
);

/** Soglia sotto la quale la similarita' coseno e' rumore, non segnale. */
const SOGLIA_SEMANTICA = 0.3;

/**
 * Estremi della scala di affinita', per il segno grafico nei risultati.
 *
 * Il minimo coincide con `SOGLIA_SEMANTICA` di proposito: cosi' "nessun
 * segno" significa esattamente "il modello non ha contribuito a trovarlo",
 * senza una fascia grigia in cui un risultato recuperato dal semantico
 * apparirebbe come letterale.
 *
 * Il massimo e' osservato, non scelto: query prive di senso semantico
 * ("Naboni", un DOI, "asdfgh") non superano mai 0.32, query con un
 * significato vero partono da 0.53. Se cambia il modello va rimisurato.
 */
export const AFFINITA_RUMORE = SOGLIA_SEMANTICA;
export const AFFINITA_CERTA = 0.55;

/**
 * Quanto pesa il semantico rispetto al lessicale.
 *
 * Con MiniLM le query di una parola sola producono ~0.3 di similarita' contro
 * qualunque documento: moltiplicato per 10 (il valore precedente) quel rumore
 * valeva 3 punti e batteva un match letterale esatto. A x4 vale 1.2, e resta
 * quello che deve essere: il criterio che decide quando non c'e' evidenza
 * testuale, non quello che la scavalca.
 */
const MOLTIPLICATORE_SEMANTICO = 4;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');

/**
 * Prefisso di parola, non sottostringa.
 *
 * `includes()` faceva corrispondere "art" dentro "qu-art-ieri" e "re" dentro
 * 107 documenti su 150. Ancorando all'inizio di parola, "nabon" trova ancora
 * "Naboni" (serve, si cerca mentre si digita) ma "art" trova solo cio' che
 * inizia davvero per art — per esempio il coautore Artopoulos.
 */
const regexPrefisso = (termine: string) =>
  new RegExp('(^|[^a-z0-9])' + escapeRegex(termine));

export class MotoreRicerca {
  private indice: DocumentoRicerca[] = [];
  private caricatoIndice = false;
  private worker: Worker | null = null;
  private modelloPronto = false;
  private caricamentoModello = false;
  private percentualeDownload = 0;
  private erroreModello: string | null = null;
  private pendingRequests = new Map<number, (vector: number[]) => void>();
  private requestCounter = 0;
  private listeners: Set<ListenerStato> = new Set();
  /** I campi minuscoli di ogni documento, calcolati una volta sola. */
  private cacheCampi = new Map<string, string[]>();

  async inizializzaIndice(): Promise<void> {
    if (this.caricatoIndice) return;
    try {
      const resp = await fetch('/search-index.json');
      if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
      this.indice = await resp.json();
      this.caricatoIndice = true;
    } catch (e) {
      console.error('[search] Errore caricamento indice:', e);
    }
  }

  inizializzaWorker(): void {
    if (this.worker || typeof Worker === 'undefined') return;

    this.caricamentoModello = true;
    this.erroreModello = null;
    this.notificaStato();

    try {
      this.worker = new Worker(new URL('./search-worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (e: MessageEvent) => {
        const { id, type, vector, percent, error } = e.data;

        if (type === 'progress') {
          this.percentualeDownload = percent || 0;
          this.notificaStato();
        } else if (type === 'ready') {
          this.modelloPronto = true;
          this.caricamentoModello = false;
          this.percentualeDownload = 100;
          this.notificaStato();
        } else if (type === 'result' && typeof id === 'number') {
          const resolver = this.pendingRequests.get(id);
          if (resolver && vector) {
            this.pendingRequests.delete(id);
            resolver(vector);
          }
        } else if (type === 'error') {
          this.segnalaErrore(error || 'errore sconosciuto nel worker');
        }
      };

      // Senza questo, un fallimento di caricamento del modulo worker e' invisibile.
      this.worker.onerror = (e) => {
        this.segnalaErrore(e.message || 'il worker non si e\' avviato');
      };

      this.worker.postMessage({ type: 'init' });
    } catch (err: any) {
      this.segnalaErrore(err?.message || String(err));
    }
  }

  /**
   * Revoca del consenso: il worker va fermato davvero, non solo ignorato.
   * Se restasse vivo continuerebbe a tenere in memoria il modello appena
   * ripudiato, e la ricerca semantica resterebbe attiva fino al reload.
   */
  spegniWorker(): void {
    this.worker?.terminate();
    this.worker = null;
    this.modelloPronto = false;
    this.caricamentoModello = false;
    this.percentualeDownload = 0;
    this.erroreModello = null;
    this.pendingRequests.clear();
    this.notificaStato();
  }

  getStato(): StatoMotore {
    return {
      modelloPronto: this.modelloPronto,
      caricamento: this.caricamentoModello,
      percentuale: this.percentualeDownload,
      errore: this.erroreModello,
    };
  }

  isSemanticaAttiva(): boolean {
    return this.modelloPronto;
  }

  onStatoChange(fn: ListenerStato): () => void {
    this.listeners.add(fn);
    fn(this.getStato());
    return () => this.listeners.delete(fn);
  }

  private notificaStato(): void {
    const stato = this.getStato();
    for (const fn of this.listeners) {
      fn(stato);
    }
  }

  private segnalaErrore(messaggio: string): void {
    console.warn('[search] motore semantico non disponibile:', messaggio);
    this.erroreModello = messaggio;
    this.caricamentoModello = false;
    this.modelloPronto = false;
    this.notificaStato();
  }

  private embedQuery(query: string): Promise<number[] | null> {
    if (!this.worker || !this.modelloPronto) return Promise.resolve(null);

    const id = ++this.requestCounter;
    return new Promise((resolve) => {
      this.pendingRequests.set(id, resolve);
      this.worker!.postMessage({ id, type: 'embed', query });
      // Timeout di sicurezza
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          resolve(null);
        }
      }, 5000);
    });
  }

  private calcolaSimilaritaCoseno(v1: number[], v2: number[]): number {
    let dot = 0;
    const len = Math.min(v1.length, v2.length);
    for (let i = 0; i < len; i++) {
      dot += v1[i] * v2[i];
    }
    return dot;
  }

  private getIndicePerLingua(lingua: 'en' | 'it'): DocumentoRicerca[] {
    if (lingua === 'en') {
      return this.indice.filter((d) => d.lingua === 'en');
    }

    // In italiano: per ogni contenuto mostriamo la versione 'it', con fallback a 'en' se non tradotto
    const mappa = new Map<string, DocumentoRicerca>();

    // 1. Inserisci tutte le versioni inglesi come base/fallback
    for (const doc of this.indice) {
      if (doc.lingua === 'en') {
        const chiave = `${doc.collezione}/${doc.slug}`;
        mappa.set(chiave, doc);
      }
    }

    // 2. Sovrascrivi con la versione italiana se presente
    for (const doc of this.indice) {
      if (doc.lingua === 'it') {
        const chiave = `${doc.collezione}/${doc.slug}`;
        mappa.set(chiave, doc);
      }
    }

    return Array.from(mappa.values());
  }

  /**
   * I campi cercabili di un documento, nell'ordine di `PESI_CAMPI`.
   * Normalizzare 300 documenti a ogni tasto premuto sarebbe sprecato: l'indice
   * non cambia mai dopo il caricamento, quindi il risultato si tiene.
   */
  private campiNormalizzati(doc: DocumentoRicerca): string[] {
    const inCache = this.cacheCampi.get(doc.id);
    if (inCache) return inCache;

    const campi = [
      norm(doc.doi || ''),
      norm(doc.autori || ''),
      norm(doc.titolo),
      (doc.tag || []).map(norm).join(' '),
      norm(doc.categoria || ''),
      norm(doc.sommario || ''),
    ];
    this.cacheCampi.set(doc.id, campi);
    return campi;
  }

  /**
   * Le parole della query che vale la pena cercare alla lettera.
   * Il prefisso `doi.org/` viene tolto perche' chi incolla un DOI di solito
   * incolla l'URL intero, ma nell'indice c'e' solo la parte `10.xxxx/...`.
   */
  private estraiTermini(query: string): string[] {
    return norm(query)
      .replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '')
      .split(/[\s,;]+/)
      .filter((t) => t.length >= 2 && !STOPWORD.has(t));
  }

  /**
   * Punteggio lessicale di ogni documento, pesato per la rarita' dei termini.
   *
   * L'IDF (`log(N / documenti_che_contengono_il_termine)`) e' cio' che rende
   * superflua una regola del tipo "se il match e' esatto portalo in cima":
   * "naboni" compare in 2 documenti su 150 e vale ~4.3x, "urban" in 48 e vale
   * ~1.1x. La scala si separa da sola, senza casi speciali e senza far
   * sfarfallare i risultati mentre l'utente digita le prime lettere.
   */
  private punteggiLessicali(corpus: DocumentoRicerca[], termini: string[]): number[] {
    const punteggi = new Array(corpus.length).fill(0);
    if (termini.length === 0) return punteggi;

    const regex = termini.map(regexPrefisso);
    const pesiPerDoc: number[][] = [];
    const frequenze = new Array(termini.length).fill(0);

    for (const doc of corpus) {
      const campi = this.campiNormalizzati(doc);
      const riga = new Array(termini.length).fill(0);

      for (let t = 0; t < termini.length; t++) {
        let peso = 0;
        for (let c = 0; c < campi.length; c++) {
          if (campi[c] && regex[t].test(campi[c])) peso += PESI_CAMPI[c];
        }
        riga[t] = peso;
        if (peso > 0) frequenze[t]++;
      }
      pesiPerDoc.push(riga);
    }

    // max(df, 0.5) evita log(N/0) quando un termine non compare da nessuna parte
    const idf = frequenze.map((df) => Math.log(corpus.length / Math.max(df, 0.5)));

    for (let d = 0; d < corpus.length; d++) {
      let somma = 0;
      for (let t = 0; t < termini.length; t++) somma += pesiPerDoc[d][t] * idf[t];
      punteggi[d] = somma;
    }
    return punteggi;
  }

  /**
   * Se valga la pena disturbare il modello semantico.
   *
   * Anni, numeri e DOI sono identificatori: hanno un valore esatto, non un
   * significato. Il modello non lo sa e ci prova lo stesso — "2021", "2022",
   * "2023" e "2024" restituiscono tutti lo stesso documento (il piu' corto
   * dell'indice, il cui vettore e' dominato da un numero) con punteggi
   * indistinguibili. Meglio non chiederglielo: la ricerca letterale su questi
   * termini e' gia' esatta, e il semantico puo' solo aggiungere rumore.
   */
  private meritaSemantica(query: string): boolean {
    const q = norm(query);
    if (/10\.\d{4,9}\//.test(q)) return false; // DOI
    return /[a-z]{2}/.test(q); // almeno una parola vera, non solo cifre
  }

  async cerca(query: string, linguaAttiva?: string): Promise<DocumentoRicerca[]> {
    await this.inizializzaIndice();
    const qOriginale = query.trim();
    if (!norm(qOriginale)) return [];

    const lingua: 'en' | 'it' = linguaAttiva === 'it' ? 'it' : 'en';
    const corpus = this.getIndicePerLingua(lingua);
    if (corpus.length === 0) return [];

    const lessicali = this.punteggiLessicali(corpus, this.estraiTermini(qOriginale));

    // Se il modello non c'e' (consenso negato, download fallito, iOS vecchio)
    // resta solo il lessicale: e' un degrado, non un guasto.
    const queryVector =
      this.modelloPronto && this.meritaSemantica(qOriginale)
        ? await this.embedQuery(qOriginale)
        : null;

    const risultati: { doc: DocumentoRicerca; totale: number }[] = [];

    for (let d = 0; d < corpus.length; d++) {
      const doc = corpus[d];
      const lessicale = lessicali[d];

      let semantico = 0;
      if (queryVector && doc.vettore && doc.vettore.length > 0) {
        semantico = this.calcolaSimilaritaCoseno(queryVector, doc.vettore);
      }
      const contributoSemantico =
        semantico > SOGLIA_SEMANTICA ? semantico * MOLTIPLICATORE_SEMANTICO : 0;

      const totale = lessicale + contributoSemantico;
      if (totale <= 0) continue;

      risultati.push({
        doc: {
          ...doc,
          affinita: semantico > 0 ? Math.round(semantico * 1000) / 1000 : 0,
          tipoMatch: lessicale >= contributoSemantico ? 'testuale' : 'semantico',
        },
        totale,
      });
    }

    risultati.sort((a, b) => b.totale - a.totale);

    // `punteggio` e' rilevanza relativa al miglior risultato: i punteggi grezzi
    // hanno scale diverse (un DOI vale 60, un match semantico 1.5) e mostrarli
    // come valore assoluto non direbbe niente.
    const massimo = risultati[0]?.totale || 1;
    return risultati.slice(0, 20).map((r) => ({
      ...r.doc,
      punteggio: Math.round((r.totale / massimo) * 100),
    }));
  }

}

// Istanza singleton per il client
export const searchEngine = new MotoreRicerca();
