/**
 * I CONTENUTI, NELLA LINGUA GIUSTA
 * ================================
 *
 * Ogni contenuto vive in un solo file .mdx con le due lingue separate
 * al suo interno dal token $$$ (nel frontmatter e/o nel corpo).
 * Il loader `loaderBilingue()` genera per lo store di Astro due voci: `en/<slug>` e `it/<slug>`.
 *
 * `perLingua()` seleziona le voci per la lingua richiesta: se la versione
 * nella lingua richiesta esiste la usa, altrimenti fa il fallback trasparente sull'inglese.
 */

import { linguaDefault, type Lingua } from "../i18n/testi";

/**
 * L'id di una voce è `en/slug` oppure `it/slug`: la parte dopo la prima
 * barra è la CHIAVE univoca del contenuto.
 */
export function chiaveDi(id: string): string {
  const taglio = id.indexOf("/");
  return taglio === -1 ? id : id.slice(taglio + 1);
}

export function linguaDi(id: string): Lingua {
  const taglio = id.indexOf("/");
  const l = taglio === -1 ? linguaDefault : id.slice(0, taglio);
  return l === "it" ? "it" : "en";
}

/**
 * Filtra una collezione tenendo una sola versione per contenuto: quella
 * nella lingua chiesta se c'è, altrimenti l'inglese di default.
 */
export function perLingua<T extends { id: string }>(
  voci: T[],
  lingua: Lingua | string = linguaDefault,
): (T & { chiave: string; tradotto: boolean })[] {
  const scelte = new Map<string, T & { chiave: string; tradotto: boolean }>();

  for (const voce of voci) {
    const chiave = chiaveDi(voce.id);
    const suaLingua = linguaDi(voce.id);
    const gia = scelte.get(chiave);

    const vince = suaLingua === lingua || !gia;
    if (!vince) continue;
    if (gia && gia.tradotto && suaLingua !== lingua) continue;

    scelte.set(chiave, { ...voce, chiave, tradotto: suaLingua === lingua });
  }

  return [...scelte.values()];
}

/** Ordina per data decrescente: il più recente in cima. */
export function perData<T extends { data: { data?: Date } }>(voci: T[]): T[] {
  return [...voci].sort((a, b) => {
    const timeA = a.data.data ? new Date(a.data.data).getTime() : 0;
    const timeB = b.data.data ? new Date(b.data.data).getTime() : 0;
    return timeB - timeA;
  });
}

/**
 * Formatta date rispettando la lingua.
 */
export function dataEstesa(data: Date, lingua: Lingua | string = linguaDefault): string {
  return new Intl.DateTimeFormat(lingua === "it" ? "it-IT" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(data);
}
