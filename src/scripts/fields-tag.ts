/**
 * IL FILTRO A TAG DI FIELDS
 * =========================
 *
 * Tre pezzi, un solo modulo perché sono la stessa interazione:
 *
 * 1. IL PALLINO. Unico controllo permanente sulla scena. Acceso, attorno
 *    al marker in focus compaiono i suoi tag.
 * 2. I SATELLITI. Etichette DOM disposte ad arco attorno alla sagoma in
 *    focus, sempre dalla parte OPPOSTA al titolo fluttuante: il titolo
 *    ha la precedenza sullo spazio, i satelliti girano attorno.
 * 3. LO STATO. I tag scelti vivono nell'URL (`?tag=a,b`), non in una
 *    variabile: la vista filtrata si condivide, si ricarica e torna
 *    indietro col tasto del browser (un tag alla volta).
 *
 * Il filtro è in AND progressivo: i satelliti mostrano solo i tag della
 * voce in focus, che per costruzione è già sopravvissuta ai tag attivi.
 * Ogni tag proposto porta quindi ad almeno un risultato — non esiste un
 * satellite che porta nel vuoto, e non serve calcolare conteggi.
 */

import type { FieldFocus } from './fields-spiral';

/** slug -> etichetta nella lingua della pagina. */
export type DizionarioTag = Record<string, string>;

const PARAMETRO = 'tag';

/** Raggio dell'arco dei satelliti attorno alla sagoma in focus. */
const RAGGIO_BASE = 118;
const RAGGIO_PASSO = 26;
/** Semi-apertura dell'arco: 55° sopra e sotto l'orizzontale. */
const APERTURA = (55 * Math.PI) / 180;
const MARGINE_SCHERMO = 12;
/**
 * In basso la fascia libera è più alta: lì stanno la barra del footer
 * (RSS / Contact) e il toggle dei tag, e un satellite che ci finisce sopra
 * copre proprio il controllo che lo ha fatto comparire.
 */
const MARGINE_BASSO = 96;

export function leggiTagAttivi(url: URL = new URL(window.location.href)): string[] {
  const grezzo = url.searchParams.get(PARAMETRO);
  if (!grezzo) return [];
  return grezzo.split(',').map((s) => s.trim()).filter(Boolean);
}

export function urlConTag(slug: string[], base: URL = new URL(window.location.href)): string {
  const url = new URL(base.href);
  if (slug.length === 0) url.searchParams.delete(PARAMETRO);
  else url.searchParams.set(PARAMETRO, slug.join(','));
  return `${url.pathname}${url.search}`;
}

type Opzioni = {
  /** Layer sopra il canvas in cui vivono i satelliti. */
  contenitore: HTMLElement;
  /** Il pallino. */
  pulsante: HTMLButtonElement;
  /** Riga delle pillole dei tag attivi. */
  barra: HTMLElement;
  dizionario: DizionarioTag;
  /** Etichetta accessibile del tasto per togliere un tag. */
  etichettaRimuovi: string;
  /** Chiede la ricostruzione della spirale con questi tag. */
  onCambio: (slug: string[]) => void;
};

export function creaFiltroTag(opzioni: Opzioni) {
  const { contenitore, pulsante, barra, dizionario, etichettaRimuovi, onCambio } = opzioni;

  let aperto = false;
  let attivi = leggiTagAttivi();
  /** Satelliti attualmente montati, per slug. */
  const satelliti = new Map<string, HTMLButtonElement>();
  let ultimoFuoco: string | null = null;

  function segnaPulsante() {
    pulsante.setAttribute('aria-pressed', aperto ? 'true' : 'false');
    pulsante.dataset.attivo = aperto ? 'true' : 'false';
    pulsante.dataset.filtrato = attivi.length > 0 ? 'true' : 'false';
  }

  function svuotaSatelliti() {
    for (const el of satelliti.values()) el.remove();
    satelliti.clear();
    ultimoFuoco = null;
  }

  function disegnaBarra() {
    barra.replaceChildren();
    barra.hidden = attivi.length === 0;
    for (const slug of attivi) {
      const pillola = document.createElement('button');
      pillola.type = 'button';
      pillola.className =
        'pillola-tag pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-widest';
      pillola.innerHTML = `<span>${dizionario[slug] ?? slug}</span><span aria-hidden="true" class="opacity-50">×</span>`;
      pillola.setAttribute('aria-label', `${etichettaRimuovi}: ${dizionario[slug] ?? slug}`);
      pillola.addEventListener('click', () => togli(slug));
      barra.appendChild(pillola);
    }
  }

  function applica(nuovi: string[], modo: 'push' | 'replace' = 'push') {
    attivi = nuovi;
    const href = urlConTag(attivi);
    if (modo === 'push') history.pushState({ tag: attivi }, '', href);
    else history.replaceState({ tag: attivi }, '', href);
    svuotaSatelliti();
    disegnaBarra();
    segnaPulsante();
    onCambio(attivi);
  }

  function aggiungi(slug: string) {
    if (attivi.includes(slug)) return;
    applica([...attivi, slug]);
  }

  function togli(slug: string) {
    applica(attivi.filter((s) => s !== slug));
  }

  function creaSatellite(slug: string) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className =
      'fields-tag-satellite pillola-tag pointer-events-auto absolute left-0 top-0 whitespace-nowrap rounded-full px-3 py-1 font-sans text-[0.625rem] uppercase tracking-widest text-ink opacity-0 transition-opacity duration-200 hover:opacity-100';
    el.textContent = dizionario[slug] ?? slug;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      aggiungi(slug);
    });
    contenitore.appendChild(el);
    return el;
  }

  /**
   * Posiziona i satelliti su un arco attorno alla sagoma in focus.
   *
   * Il lato si sceglie, non si subisce: si preferisce quello che guarda
   * FUORI dallo schermo (verso il vuoto, non verso il cuore fitto della
   * spirale), e se lì ci sono dei titoli il raggio cresce finché l'arco
   * non li scavalca — non solo il titolo della voce in focus, ma anche
   * quelli dei marker vicini. Se scavalcarli porterebbe i satelliti
   * oltre il bordo, si passa dall'altra parte: un titolo non si copre mai.
   */
  function collocaSatelliti(fuoco: FieldFocus, slug: string[]) {
    const preferito = fuoco.x >= window.innerWidth / 2 ? 1 : -1;

    type Posa = { x: number; y: number; largo: number; alto: number };

    function prova(verso: number): { pose: Posa[]; costo: number } {
      const pose: Posa[] = [];
      let costo = 0;

      slug.forEach((s, i) => {
        const el = satelliti.get(s);
        const largo = el?.offsetWidth || 90;
        const alto = el?.offsetHeight || 24;

        const quota = slug.length === 1 ? 0.5 : i / (slug.length - 1);
        const angolo = (quota - 0.5) * 2 * APERTURA;

        let raggio = RAGGIO_BASE;
        let x = 0;
        let y = 0;
        let scontro = true;

        for (let tentativo = 0; tentativo < 5 && scontro; tentativo++) {
          x = fuoco.x + verso * Math.cos(angolo) * raggio;
          y = fuoco.y + Math.sin(angolo) * raggio;
          scontro = fuoco.ingombri.some(
            (box) =>
              x - largo / 2 < box.right + 8 &&
              x + largo / 2 > box.left - 8 &&
              y - alto / 2 < box.bottom + 8 &&
              y + alto / 2 > box.top - 8,
          );
          if (scontro) raggio += RAGGIO_PASSO;
        }

        // Costo: quanto il satellite sborda dallo schermo, più una penalità
        // secca se resta comunque addosso al titolo.
        const fuoriX =
          Math.max(0, MARGINE_SCHERMO + largo / 2 - x) +
          Math.max(0, x + largo / 2 + MARGINE_SCHERMO - window.innerWidth);
        const fuoriY =
          Math.max(0, MARGINE_SCHERMO + alto / 2 - y) +
          Math.max(0, y + alto / 2 + MARGINE_BASSO - window.innerHeight);
        costo += fuoriX + fuoriY + (scontro ? 400 : 0);

        pose.push({ x, y, largo, alto });
      });

      return { pose, costo };
    }

    const a = prova(preferito);
    const b = prova(-preferito);
    const scelta = a.costo <= b.costo ? a : b;

    slug.forEach((s, i) => {
      const el = satelliti.get(s);
      const posa = scelta.pose[i];
      if (!el || !posa) return;

      const x = Math.min(
        Math.max(posa.x, posa.largo / 2 + MARGINE_SCHERMO),
        window.innerWidth - posa.largo / 2 - MARGINE_SCHERMO,
      );
      const y = Math.min(
        Math.max(posa.y, posa.alto / 2 + MARGINE_SCHERMO),
        window.innerHeight - posa.alto / 2 - MARGINE_BASSO,
      );

      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = '0.85';
    });
  }

  /** Chiamata a ogni frame dalla spirale. */
  function aggiornaFuoco(fuoco: FieldFocus | null) {
    if (!aperto || !fuoco) {
      if (satelliti.size > 0) svuotaSatelliti();
      return;
    }

    const proponibili = fuoco.marker.tag.filter((s) => !attivi.includes(s) && s in dizionario);

    if (fuoco.marker.id !== ultimoFuoco) {
      svuotaSatelliti();
      ultimoFuoco = fuoco.marker.id;
      for (const s of proponibili) satelliti.set(s, creaSatellite(s));
    }

    if (satelliti.size > 0) collocaSatelliti(fuoco, proponibili);
  }

  function commuta() {
    aperto = !aperto;
    if (!aperto) svuotaSatelliti();
    segnaPulsante();
  }

  function onTasto(e: KeyboardEvent) {
    if (e.key === 'Escape' && aperto) commuta();
  }

  function onPopState() {
    attivi = leggiTagAttivi();
    svuotaSatelliti();
    disegnaBarra();
    segnaPulsante();
    onCambio(attivi);
  }

  pulsante.addEventListener('click', commuta);
  document.addEventListener('keydown', onTasto);
  window.addEventListener('popstate', onPopState);

  disegnaBarra();
  segnaPulsante();

  return {
    aggiornaFuoco,
    attivi: () => attivi,
    destroy() {
      svuotaSatelliti();
      pulsante.removeEventListener('click', commuta);
      document.removeEventListener('keydown', onTasto);
      window.removeEventListener('popstate', onPopState);
    },
  };
}

/** Tiene solo gli anni e i marker compatibili con TUTTI i tag richiesti. */
export function filtraTimeline<T extends { markers: { tag: string[] }[] }>(timeline: T[], slug: string[]): T[] {
  if (slug.length === 0) return timeline;
  return timeline
    .map((anno) => ({
      ...anno,
      markers: anno.markers.filter((m) => slug.every((s) => m.tag.includes(s))),
    }))
    .filter((anno) => anno.markers.length > 0);
}
