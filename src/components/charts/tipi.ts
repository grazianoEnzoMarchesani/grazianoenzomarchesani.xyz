/** Lo schema del blocco ```grafico degli articoli di Fields. È la vera API: ciò che non è qui non è raggiungibile dagli articoli. */
export interface Serie {
  chiave: string;
  etichetta?: string;
  colore?: string;
  /** Barre/aree impilate nello stesso gruppo. */
  gruppo?: string;
  /**
   * Linea/area tratteggiata invece che piena: lo stratagemma per distinguere due serie
   * in un grafico monocromo senza ricorrere al colore. Il valore è il pattern SVG
   * `stroke-dasharray` (es. "6,4"); `true` usa il default "6,4". Ignorato da barre e dispersione.
   */
  tratteggio?: string | boolean;
  /**
   * Su quale asse Y appoggiare la serie: `"sinistra"` (default) o `"destra"`.
   * Serve quando due serie hanno unità e ordini di grandezza diversi
   * (es. temperatura in °C e umidità in g/kg): ognuna ottiene la sua scala.
   * Solo linea/area.
   */
  asseY?: "sinistra" | "destra";
}

export interface Riferimento {
  y?: number;
  y1?: number;
  y2?: number;
  etichetta?: string;
  colore?: string;
}

export interface ConfigGrafico {
  tipo?: "linea" | "area" | "barre" | "dispersione";
  /**
   * Solo `barre`: `"orizzontale"` sviluppa le barre in orizzontale, con le
   * categorie sull'asse verticale (a sinistra) e i valori in orizzontale.
   * Adatto a categorie con etichette lunghe o a un confronto per ranking.
   * I valori vengono scritti in fondo a ogni barra; la scala è data dalle
   * linee di griglia verticali. Default `"verticale"`.
   */
  orientamento?: "verticale" | "orizzontale";
  /** Dati inline, oppure `src` per un JSON/CSV accanto all'articolo. */
  dati?: Record<string, unknown>[];
  src?: string;
  /** Chiave dell'asse X. Default "data". */
  x?: string;
  /** L'asse X è una serie temporale: i valori vengono convertiti in Date. Default true per linea/area. */
  xTemporale?: boolean;
  /**
   * Solo linea/area: granularità con cui formattare l'asse X e il titolo del
   * tooltip. Di default è giorno+mese ("3 Aug"). Per una serie che copre più
   * anni con un punto per anno, usa `"anno"` (mostra "2020"): l'asse a
   * giorno+mese mostrerebbe sempre "1 Jan". `"mese-anno"` → "Aug 2025".
   */
  formatoData?: "anno" | "mese-anno" | "giorno-mese";
  serie?: Serie[];
  griglia?: boolean;
  /** Mostra la legenda sotto il grafico. Default: true se ci sono ≥2 serie con `etichetta`. */
  legenda?: boolean;
  assi?: {
    x?: boolean;
    y?: boolean;
    /**
     * Quante etichette mostrare sull'asse X (densità delle date/categorie).
     * Per linea/area è il numero di tacche; per le barre verticali è il numero
     * massimo di etichette prima che ne salti alcune. Serve soprattutto per
     * dare la stessa densità a due grafici affiancati (istogramma + cumulata).
     */
    tacche?: number;
    /** Titolo dell'asse X, sotto il grafico. */
    titoloX?: string;
    /** Titolo dell'asse Y, ruotato lungo l'asse. Metterci sempre l'unità di misura. */
    titoloY?: string;
    /** Titolo del secondo asse Y (a destra), se qualche serie ha `asseY: destra`. */
    titoloYDestra?: string;
  };
  /**
   * Estremi dell'asse Y. Di default linea/area partono da 0; darli espliciti
   * (`yMin`/`yMax`) alza la linea di base e sfrutta meglio l'altezza quando i dati
   * vivono lontano dallo zero. Le barre partono sempre da 0 e ignorano `yMin`,
   * ma leggono `yMax` per fissare il tetto della scala (utile per dare a più
   * grafici affiancati la stessa scala).
   */
  yMin?: number;
  yMax?: number;
  /** Come `yMin`/`yMax` ma per il secondo asse Y a destra (serie con `asseY: destra`). Solo linea. */
  yMinDestra?: number;
  yMaxDestra?: number;
  tooltip?: boolean;
  riferimenti?: Riferimento[];
  titolo?: string;
  didascalia?: string;
  proporzione?: string;
  /** Valvola di sfogo: passato tale e quale al componente Bklit. */
  props?: Record<string, unknown>;
}
