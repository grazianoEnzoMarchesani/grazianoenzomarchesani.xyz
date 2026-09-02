/**
 * Rifiniture client dell'impaginato "Marginalia" degli articoli di Fields.
 * Il layout a tre colonne è tutto CSS (FieldArticleLayout / FieldArticleBody):
 * qui stanno solo le cose che il CSS non può fare da solo.
 *
 * Solo sopra 1180px (stesso breakpoint del CSS). Sotto, no-op: indice nel
 * <details>, note restano nel flusso in fondo all'articolo.
 *
 * TRAPPOLA NOTA (vedi monta-grafici.ts): con <ClientRouter /> i moduli <script>
 * non si rieseguono al cambio pagina. Tutto è agganciato a `astro:page-load` ed
 * è idempotente; `astro:before-swap` smonta prima dello scambio del DOM.
 */

const BP = "(min-width: 1180px)";
const prm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let osservatore: IntersectionObserver | undefined;
/** Osservatori/loop che aspettano il montaggio e la fine animazione dei grafici
 *  prima di copiarne l'SVG nella rail. */
let atteseGrafico: Array<{ disconnect(): void }> = [];
/** Blocchi (footnotes) spostati nella fascia note, con il segno
 *  che marca il punto da cui vengono, per poterli rimettere a posto. */
let spostati: Array<{ blocco: HTMLElement; segno: Comment }> = [];

/** Taglio automatico dalle proporzioni, per le figure senza marcatore @…. */
function classificaFigure(articolo: HTMLElement) {
  for (const fig of articolo.querySelectorAll<HTMLElement>("figure.figura")) {
    if (/\bfig--(inset|band|portrait|full)\b/.test(fig.className)) continue;
    const img = fig.querySelector("img");
    if (!img) continue;
    const w = img.naturalWidth || Number(img.getAttribute("width")) || 0;
    const h = img.naturalHeight || Number(img.getAttribute("height")) || 0;
    if (!w || !h) {
      // dimensioni non ancora note (SVG senza viewBox, immagine non caricata):
      // riprova al load, una volta.
      img.addEventListener("load", () => classificaFigure(articolo), { once: true });
      continue;
    }
    const ratio = w / h;
    if (ratio > 1.8) fig.classList.add("fig--band");
    else if (ratio < 0.8) fig.classList.add("fig--portrait");
  }
}

/** Riempie l'anteprima di un grafico con una "istantanea" dell'SVG che React
 *  monta più tardi — scattata a animazione conclusa (vedi `attendiStabile`).
 *  Il clone resta SVG inline (così eredita variabili CSS e font della pagina).
 *  Interventi sul clone:
 *  - id rinominati e riferimenti `url(#…)` riscritti, o il grafico vero
 *    risolverebbe gradienti/mask sul clone e la linea sparirebbe;
 *  - via `clip-path` (il clip dell'animazione "grow": a scatto anticipato
 *    ritaglierebbe la linea quasi a zero);
 *  - via griglia, assi, etichette, aree di riferimento: a questa scala è rumore;
 *  - tratti dei <path> ispessiti in proporzione, così la linea si legge e
 *    conserva il suo gradiente che sfuma alle estremità (niente
 *    `non-scaling-stroke`, che la renderebbe piatta e di spessore uniforme);
 *    le barre sono forme piene e si scalano senza ritocchi.
 *  Inquadra l'area del tracciato con `…Mid meet`: la linea si vede tutta. */
const RIF = ["clip-path", "mask", "fill", "stroke", "filter"];
const VIA_DAL_CLONE = ".chart-grid, .chart-reference-area, .visx-axis, [class*='axis'], text";
function anteprimaGrafico(fig: HTMLElement, anteprima: HTMLElement) {
  const copia = () => {
    const svg = fig.querySelector("svg");
    // Il momento giusto per scattare lo decide `attendiStabile` sotto: qui basta
    // che l'SVG col tracciato ci sia (linea/area: <path>; barre: <rect>).
    if (!svg || !svg.querySelector("path, g[class*='bar-series'] rect")) return false;
    try {
      const clone = svg.cloneNode(true) as SVGElement;
      const uid = "mini" + Math.random().toString(36).slice(2, 8);
      const rinomina = (v: string) => v.replace(/url\(#([^)]+)\)/g, `url(#${uid}-$1)`);
      for (const el of clone.querySelectorAll(VIA_DAL_CLONE)) el.remove();
      for (const el of clone.querySelectorAll<SVGElement>("*")) {
        if (el.id) el.id = `${uid}-${el.id}`;
        el.removeAttribute("clip-path");
        for (const a of RIF) {
          const v = el.getAttribute(a);
          if (v?.includes("url(#")) el.setAttribute(a, rinomina(v));
        }
        const stile = el.getAttribute("style");
        if (stile?.includes("url(#")) el.setAttribute("style", rinomina(stile));
        const href = el.getAttribute("href");
        if (href?.startsWith("#")) el.setAttribute("href", `#${uid}-${href.slice(1)}`);
        if (el.tagName === "path") {
          const sw = parseFloat(el.getAttribute("stroke-width") || "2") || 2;
          el.setAttribute("stroke-width", String(sw * 5));
        }
      }
      // Inquadra l'area del tracciato: il <g translate(x,y)> col rettangolo del
      // plot. Ripiego: tutto il viewBox.
      const dentro = clone.querySelector<SVGGElement>("g[transform^='translate(']");
      const plot = dentro?.querySelector("rect");
      const tr = dentro?.getAttribute("transform")?.match(/translate\(\s*([\d.-]+)[ ,]+([\d.-]+)/);
      const pw = parseFloat(plot?.getAttribute("width") || "");
      const ph = parseFloat(plot?.getAttribute("height") || "");
      if (tr && pw && ph) {
        clone.setAttribute("viewBox", `${tr[1]} ${tr[2]} ${pw} ${ph}`);
      } else if (!clone.getAttribute("viewBox")) {
        const w = parseFloat(clone.getAttribute("width") || "") || svg.clientWidth;
        const h = parseFloat(clone.getAttribute("height") || "") || svg.clientHeight;
        if (w && h) clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
      }
      clone.removeAttribute("width");
      clone.removeAttribute("height");
      clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
      anteprima.replaceChildren(clone);
      anteprima.classList.remove("ph", "ph--chart");
    } catch {
      /* clone fallito: si tiene il segnaposto ▦ */
    }
    return true;
  };
  /* Scatta l'istantanea solo a animazione FINITA. Motion (`motion/react`) anima
   * le barre in mille modi (attributi, style, a volte WAAPI che non notifica il
   * MutationObserver): l'unico segnale affidabile è la geometria renderizzata.
   * Si campiona il bounding box del disegno a ogni frame e si copia quando resta
   * identico per 350 ms. Ripiego dopo 12 s, per non lasciare mai il buco. */
  const attendiStabile = () => {
    let firma = "";
    let da = 0;
    let raf = 0;
    const scadenza = performance.now() + 12000;

    // Solo i "segni" dei dati: le barre se ci sono, altrimenti i path (linea/area).
    // Escludendo griglia e assi si evita di dichiarare "stabile" un grafico dove
    // gli assi sono già fermi ma le barre sono ancora ad altezza zero.
    const misura = () => {
      const barre = fig.querySelectorAll<SVGGraphicsElement>("svg g[class*='bar-series'] rect");
      const segni = barre.length ? barre : fig.querySelectorAll<SVGGraphicsElement>("svg path");
      let s = "";
      let vivo = false;
      for (const p of segni) {
        let b: DOMRect;
        try {
          b = p.getBBox();
        } catch {
          continue;
        }
        s += `${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.width)},${Math.round(b.height)}|`;
        if (b.width > 3 && b.height > 3) vivo = true;
      }
      return vivo ? s : "";
    };

    const tick = (t: number) => {
      const s = misura();
      if (s && s === firma) {
        if (t - da >= 350) return void copia();
      } else {
        firma = s;
        da = t;
      }
      if (performance.now() < scadenza) raf = requestAnimationFrame(tick);
      else copia();
    };

    raf = requestAnimationFrame(tick);
    atteseGrafico.push({ disconnect: () => cancelAnimationFrame(raf) });
  };

  // Prima aspetta che l'isola React monti l'SVG, poi passa al polling di stabilità.
  const montato = () => !!fig.querySelector("svg path, svg g[class*='bar-series'] rect");
  if (montato()) return attendiStabile();
  const mo = new MutationObserver(() => {
    if (!montato()) return;
    mo.disconnect();
    attendiStabile();
  });
  mo.observe(fig, { childList: true, subtree: true });
  atteseGrafico.push(mo);
}

/** Rifinisce la rail delle figure, che FieldArticleLayout disegna già lato
 *  server (provini immagine con `getImage()`, segnaposto per grafici e video).
 *  Qui resta solo: agganciare il clic-per-scrollare alla figura corrispondente,
 *  e riempire il segnaposto dei grafici con un'istantanea dell'SVG che React
 *  monta più tardi (compromesso accettato: prima dell'isola resta l'icona ▦). */
function costruisciMiniature(articolo: HTMLElement) {
  for (const mo of atteseGrafico) mo.disconnect();
  atteseGrafico = [];

  const voci = document.querySelectorAll<HTMLElement>(".field-rail-figure .field-rail-fig[data-fig]");
  for (const voce of voci) {
    const n = voce.dataset.fig ?? "";
    const fig = articolo.querySelector<HTMLElement>(`figure[data-fig="${CSS.escape(n)}"]`);
    if (!fig) continue;

    if (!voce.dataset.legata) {
      voce.dataset.legata = "1";
      voce.addEventListener("click", (e) => {
        e.preventDefault();
        fig.scrollIntoView({ block: "center", behavior: prm ? "auto" : "smooth" });
      });
    }

    const anteprima = voce.querySelector<HTMLElement>(".sw.ph--chart");
    if (anteprima && !anteprima.dataset.grafico && fig.classList.contains("grafico")) {
      anteprima.dataset.grafico = "1";
      anteprimaGrafico(fig, anteprima);
    }
  }
}

/** Frase del testo avvolta in uno <span> per l'evidenziazione "torna al
 *  richiamo": va disfatta (unwrap) a fine animazione o prima di uno swap. */
let fraseEvidenziata: HTMLElement | undefined;

function sfaiFrase() {
  const s = fraseEvidenziata;
  fraseEvidenziata = undefined;
  const p = s?.parentNode;
  if (!s || !p) return;
  while (s.firstChild) p.insertBefore(s.firstChild, s);
  p.removeChild(s);
  p.normalize();
}

/** Clic su una nota → evidenzia nel corpo la frase che contiene il richiamo
 *  (dall'ultimo confine di frase fino al numero), stessa resa grigiastra del
 *  resto. Se la frase attraversa un tag inline si ripiega sul blocco intero. */
function evidenziaFrase(ancora: HTMLElement) {
  sfaiFrase();
  const sup = ancora.closest("sup") ?? ancora;
  const blocco = sup.closest<HTMLElement>("p, li, figcaption, blockquote, h2, h3, h4");
  if (!blocco) return;

  const walker = document.createTreeWalker(blocco, NodeFilter.SHOW_TEXT);
  const nodi: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (sup.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING) nodi.push(n as Text);
  }
  if (!nodi.length) return;

  const testo = nodi.map((x) => x.data).join("");
  let taglio = 0;
  const confine = /[.!?:](["'”’)\]]*)\s+/g;
  for (let m = confine.exec(testo); m; m = confine.exec(testo)) taglio = confine.lastIndex;

  let acc = 0;
  let nodo = nodi[0];
  let off = 0;
  for (const x of nodi) {
    if (acc + x.data.length >= taglio) {
      nodo = x;
      off = taglio - acc;
      break;
    }
    acc += x.data.length;
  }

  const range = document.createRange();
  range.setStart(nodo, off);
  range.setEndAfter(sup);

  const span = document.createElement("span");
  span.className = "fnref--evidenziato";
  try {
    range.surroundContents(span);
    fraseEvidenziata = span;
    if (prm) setTimeout(sfaiFrase, 2500);
    else span.addEventListener("animationend", sfaiFrase, { once: true });
  } catch {
    blocco.classList.add("fnref--evidenziato");
    const pulisci = () => blocco.classList.remove("fnref--evidenziato");
    if (prm) setTimeout(pulisci, 2500);
    else blocco.addEventListener("animationend", pulisci, { once: true });
  }
}

/** Scroll fluido cliccando le voci dell'indice (rail desktop + <details> mobile).
 *  Delegato su document, agganciato una volta sola. */
let scrollLisciAgganciato = false;
function agganciaScrollLisci() {
  if (scrollLisciAgganciato) return;
  scrollLisciAgganciato = true;
  // Capture: intercetta prima del ClientRouter di Astro, che sui link con hash
  // fa uno scatto istantaneo.
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target as HTMLElement;

      // Richiami di nota nel corpo (1, 2, 3…): invece di saltare in fondo alla
      // pagina, evidenzia la nota corrispondente nella fascia a margine — stessa
      // logica del "rettangolo grigiastro" delle pubblicazioni cercate. Solo da
      // desktop, dove le note sono spostate nella rail; sotto il breakpoint la
      // nota resta nel flusso e il salto all'ancora ha senso.
      const rif = t.closest<HTMLAnchorElement>(
        ".field-article a[data-footnote-ref][href^='#']",
      );
      if (rif && window.matchMedia(BP).matches) {
        const nota = document.getElementById(decodeURIComponent(rif.hash.slice(1)));
        if (nota?.closest(".field-note")) {
          e.preventDefault();
          e.stopPropagation();
          nota.scrollIntoView({ behavior: prm ? "auto" : "smooth", block: "nearest" });
          nota.classList.remove("nota--evidenziata");
          void nota.offsetWidth;
          nota.classList.add("nota--evidenziata");
          return;
        }
      }

      // Il verso opposto: clic su una nota a margine (ovunque nel suo corpo, non
      // sui link che contiene) riporta al richiamo nel testo, con scroll fluido.
      const notaLi = t.closest<HTMLElement>(".field-note .footnotes li[id]");
      if (notaLi && !t.closest("a") && window.matchMedia(BP).matches) {
        const ancora = document.getElementById(notaLi.id.replace("fn-", "fnref-"));
        if (ancora) {
          e.preventDefault();
          e.stopPropagation();
          evidenziaFrase(ancora);
          (fraseEvidenziata ?? ancora).scrollIntoView({
            behavior: prm ? "auto" : "smooth",
            block: "center",
          });
        }
        return;
      }

      const a = t.closest<HTMLAnchorElement>(
        ".field-rail a[href^='#'], .field-toc a[href^='#']",
      );
      if (!a) return;
      const id = decodeURIComponent(a.hash.slice(1));
      const target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      target.scrollIntoView({ behavior: prm ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", a.hash);
    },
    true,
  );
}

/** Evidenzia nell'indice la sezione in vista. */
function scrollSpy(articolo: HTMLElement) {
  osservatore?.disconnect();
  const heading = [...articolo.querySelectorAll<HTMLElement>("h2[id]")];
  const link = new Map<string, HTMLElement>();
  for (const a of document.querySelectorAll<HTMLElement>(".field-rail a[data-h]")) {
    link.set(a.dataset.h ?? "", a);
  }
  if (!heading.length || !link.size) return;

  osservatore = new IntersectionObserver(
    (voci) => {
      for (const voce of voci) {
        if (!voce.isIntersecting) continue;
        for (const a of link.values()) a.classList.remove("is-on");
        link.get((voce.target as HTMLElement).id)?.classList.add("is-on");
      }
    },
    { rootMargin: "-12% 0px -68% 0px" },
  );
  for (const h of heading) osservatore.observe(h);
}

/** Sposta le footnotes nella fascia note (o le rimette a posto). */
function sistemaNote(articolo: HTMLElement) {
  const fascia = document.querySelector<HTMLElement>(".field-note");
  const desktop = window.matchMedia(BP).matches;

  // rimetti sempre a posto quel che era stato spostato, poi valuta se rispostare
  for (const { blocco, segno } of spostati) segno.parentNode?.insertBefore(blocco, segno);
  for (const { segno } of spostati) segno.remove();
  spostati = [];
  fascia?.replaceChildren();

  if (!desktop || !fascia) {
    if (fascia) fascia.hidden = true;
    return;
  }

  const blocchi = [
    ...articolo.querySelectorAll<HTMLElement>(":scope > .footnotes"),
  ];
  for (const blocco of blocchi) {
    const segno = document.createComment("nota-spostata");
    blocco.parentNode?.insertBefore(segno, blocco);
    fascia.append(blocco);
    spostati.push({ blocco, segno });
  }

  // pulizia footnotes: via il titolo "Footnotes" e le frecce di ritorno
  for (const x of fascia.querySelectorAll(".footnotes > h2, .footnotes [data-footnote-backref], .footnotes .data-footnote-backref")) {
    x.remove();
  }
  fascia.hidden = spostati.length === 0;
}

function applica() {
  const articolo = document.querySelector<HTMLElement>(".field-article");
  if (!articolo) return;
  agganciaScrollLisci();
  classificaFigure(articolo);
  costruisciMiniature(articolo);
  scrollSpy(articolo);
  sistemaNote(articolo);
}

function smonta() {
  sfaiFrase();
  osservatore?.disconnect();
  osservatore = undefined;
  for (const mo of atteseGrafico) mo.disconnect();
  atteseGrafico = [];
}

document.addEventListener("astro:page-load", () => {
  applica();
  window.matchMedia(BP).addEventListener("change", applica);
});
document.addEventListener("astro:before-swap", () => {
  smonta();
  window.matchMedia(BP).removeEventListener("change", applica);
});
