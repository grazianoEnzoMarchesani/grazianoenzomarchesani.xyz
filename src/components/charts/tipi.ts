/** Lo schema del blocco ```grafico degli articoli di Fields. È la vera API: ciò che non è qui non è raggiungibile dagli articoli. */
export interface Serie {
  chiave: string;
  etichetta?: string;
  colore?: string;
  /** Barre/aree impilate nello stesso gruppo. */
  gruppo?: string;
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
  /** Dati inline, oppure `src` per un JSON/CSV accanto all'articolo. */
  dati?: Record<string, unknown>[];
  src?: string;
  /** Chiave dell'asse X. Default "data". */
  x?: string;
  /** L'asse X è una serie temporale: i valori vengono convertiti in Date. Default true per linea/area. */
  xTemporale?: boolean;
  serie?: Serie[];
  griglia?: boolean;
  assi?: { x?: boolean; y?: boolean };
  tooltip?: boolean;
  riferimenti?: Riferimento[];
  titolo?: string;
  didascalia?: string;
  proporzione?: string;
  /** Valvola di sfogo: passato tale e quale al componente Bklit. */
  props?: Record<string, unknown>;
}
