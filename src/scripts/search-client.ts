export interface DocumentoRicerca {
  id: string;
  collezione: 'research' | 'tools' | 'teaching' | 'projects' | 'publications' | 'skills';
  categoria: string;
  slug: string;
  lingua: 'en' | 'it';
  titolo: string;
  sommario: string;
  tag: string[];
  url: string;
  vettore?: number[];
  punteggio?: number;
  tipoMatch?: 'semantico' | 'testuale';
}

export type ListenerStato = (stato: {
  modelloPronto: boolean;
  caricamento: boolean;
  percentuale: number;
}) => void;

export class MotoreRicerca {
  private indice: DocumentoRicerca[] = [];
  private caricatoIndice = false;
  private worker: Worker | null = null;
  private modelloPronto = false;
  private caricamentoModello = false;
  private percentualeDownload = 0;
  private pendingRequests = new Map<number, (vector: number[]) => void>();
  private requestCounter = 0;
  private listeners: Set<ListenerStato> = new Set();

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
          console.warn('[search-worker]', error);
          this.caricamentoModello = false;
          this.notificaStato();
        }
      };

      this.worker.postMessage({ type: 'init' });
    } catch (err) {
      console.warn('[search] Impossibile avviare Web Worker:', err);
      this.caricamentoModello = false;
      this.notificaStato();
    }
  }

  getStato(): { modelloPronto: boolean; caricamento: boolean; percentuale: number } {
    return {
      modelloPronto: this.modelloPronto,
      caricamento: this.caricamentoModello,
      percentuale: this.percentualeDownload,
    };
  }

  isSemanticaAttiva(): boolean {
    return this.modelloPronto;
  }

  onStatoChange(fn: ListenerStato): () => void {
    this.listeners.add(fn);
    fn({
      modelloPronto: this.modelloPronto,
      caricamento: this.caricamentoModello,
      percentuale: this.percentualeDownload,
    });
    return () => this.listeners.delete(fn);
  }

  private notificaStato(): void {
    const stato = {
      modelloPronto: this.modelloPronto,
      caricamento: this.caricamentoModello,
      percentuale: this.percentualeDownload,
    };
    for (const fn of this.listeners) {
      fn(stato);
    }
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

  async cerca(query: string, linguaAttiva?: string): Promise<DocumentoRicerca[]> {
    await this.inizializzaIndice();
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const lingua: 'en' | 'it' = linguaAttiva === 'it' ? 'it' : 'en';
    const corpus = this.getIndicePerLingua(lingua);
    const parole = q.split(/\s+/).filter(Boolean);

    // 1. Calcolo punteggio lessicale (BM25 / fuzzy match leggero)
    const risultatiLessicali: { doc: DocumentoRicerca; score: number }[] = [];

    for (const doc of corpus) {
      let score = 0;
      const titolo = doc.titolo.toLowerCase();
      const sommario = doc.sommario.toLowerCase();
      const tags = (doc.tag || []).map((t) => t.toLowerCase());
      const categoria = (doc.categoria || '').toLowerCase();

      // Esatto match sul titolo
      if (titolo.includes(q)) score += 10;
      // Match per parole
      for (const p of parole) {
        if (titolo.includes(p)) score += 5;
        if (tags.some((t) => t.includes(p))) score += 4;
        if (categoria.includes(p)) score += 3;
        if (sommario.includes(p)) score += 2;
      }

      if (score > 0) {
        risultatiLessicali.push({ doc, score });
      }
    }

    // 2. Se il modello vettoriale è pronto, calcola similarità semantica
    let queryVector: number[] | null = null;
    if (this.modelloPronto) {
      queryVector = await this.embedQuery(q);
    }

    if (queryVector) {
      const risultatiCombinati: { doc: DocumentoRicerca; punteggio: number; tipo: 'semantico' | 'testuale' }[] = [];

      for (const doc of corpus) {
        const lessicale = risultatiLessicali.find((r) => r.doc.id === doc.id)?.score || 0;
        let semantico = 0;

        if (doc.vettore && doc.vettore.length > 0) {
          semantico = this.calcolaSimilaritaCoseno(queryVector, doc.vettore);
        }

        // Normalizza punteggio
        // Soglia minima di rilevanza semantica: > 0.28
        if (semantico > 0.28 || lessicale > 0) {
          const punteggioFinale = semantico * 10 + lessicale;
          risultatiCombinati.push({
            doc: {
              ...doc,
              punteggio: Math.round(semantico * 100),
              tipoMatch: semantico > 0.35 ? 'semantico' : 'testuale',
            },
            punteggio: punteggioFinale,
            tipo: semantico > 0.35 ? 'semantico' : 'testuale',
          });
        }
      }

      risultatiCombinati.sort((a, b) => b.punteggio - a.punteggio);
      return risultatiCombinati.map((r) => r.doc).slice(0, 20);
    }

    // Fallback: solo risultati testuali ordinati per punteggio
    risultatiLessicali.sort((a, b) => b.score - a.score);
    return risultatiLessicali.map((r) => ({
      ...r.doc,
      punteggio: Math.min(100, Math.round(r.score * 10)),
      tipoMatch: 'testuale' as const,
    })).slice(0, 20);
  }
}

// Istanza singleton per il client
export const searchEngine = new MotoreRicerca();
