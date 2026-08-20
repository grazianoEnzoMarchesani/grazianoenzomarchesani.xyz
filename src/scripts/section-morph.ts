/**
 * Morphing per movimento tra gli sfondi delle sezioni: durante lo
 * scroll da una sezione alla successiva, le icone dello sfondo
 * (entrambe le passate di pattern-algorithm.js: "big" e "small", ognuna
 * col suo colore pieno pre-mescolato — vedi scripts/colors.mjs) si
 * staccano dalla loro sezione e volano fino alla posizione/rotazione/
 * scala che un'icona della stessa categoria occupa nella sezione dopo,
 * invece di comparire in dissolvenza. Validato in prototipo (variante A
 * — diretto) prima di essere portato qui, vedi docs/brain/design.md.
 *
 * Due vincoli scoperti a mano, non ovvi dal solo codice:
 *
 * 1. Le icone volanti vivono in un overlay `position:fixed`, non
 *    dentro l'SVG di sezione: un elemento annidato lì scrollerebbe via
 *    insieme alla sezione invece di restare in scena.
 * 2. La posizione di arrivo NON si può leggere con
 *    getBoundingClientRect() sull'icona di destinazione, perché al
 *    momento del setup quella sezione è ancora fuori viewport (sotto
 *    di un'altezza schermo) — il rect letto sarebbe quello "scrollato
 *    via", non quello che l'icona avrà quando la sezione sarà a
 *    schermo pieno. La posizione va invece derivata analiticamente
 *    dal proprio transform (translate/rotate/scale, già presente
 *    nell'SVG generato) convertito in pixel-space via il rapporto tra
 *    viewBox e viewport — la stessa identica composizione di
 *    trasformazione usata da pattern-algorithm.js, replicata qui bit
 *    a bit. Usare invece una rotazione "attorno al centro" (il default
 *    di CSS/GSAP) disallinea il clone dal resto del pattern a ogni
 *    angolo diverso da 0°/180°, perché l'algoritmo ruota ogni icona
 *    attorno alla propria origine locale, non al proprio centro.
 * 3. Le coordinate di un clone sono "locali" alla sua sezione: hanno
 *    senso solo mentre QUEL preciso confine è a schermo. Un clone
 *    disegnato sempre (con opacità 0/1 costante) resta tecnicamente
 *    nel DOM per tutta la pagina, sovrapposto a qualunque sezione si
 *    stia guardando in quel momento — un "fantasma" ovunque. Ogni
 *    confine quindi nasconde/mostra icone originali e clone in base al
 *    progress del proprio ScrollTrigger, non staticamente al setup.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { blendOver } from '../../scripts/colors.mjs';
import researchIcon from '../assets/research.svg?raw';
import teachingIcon from '../assets/teaching.svg?raw';
import projectsIcon from '../assets/projects.svg?raw';
import toolsIcon from '../assets/tools.svg?raw';

gsap.registerPlugin(ScrollTrigger);

const SVG_NS = 'http://www.w3.org/2000/svg';

// Stesso ordine di ICON_FILES in scripts/generate-patterns.mjs: gli
// indici shapeIndex incorporati nei pattern (#s0..#s3) si riferiscono
// a questa sequenza.
const ICON_RAW = [researchIcon, teachingIcon, projectsIcon, toolsIcon];

function innerMarkup(raw: string): string {
  return raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

// Stessa pulizia di scripts/pattern-algorithm.js: le icone sorgenti
// hanno un colore baked-in su un path interno che altrimenti
// sovrascriverebbe FLYING_COLOR ereditato dal <use> del clone.
function stripBakedFill(markup: string): string {
  return markup.replace(/fill:(?!none)[^;"]+;?/gi, '').replace(/\sfill="(?!none)[^"]*"/gi, '');
}

// Solo la passata "big" (~30-50 icone a sezione): includere anche la
// "small" (250-400 a sezione) è stato il primo tentativo — testato e
// scartato, perché centinaia di icone sovrapposte durante il volo
// affollano lo sfondo e rendono illeggibile il testo sopra. Le grandi
// bastano a leggersi come "sfondo che si ricompone"; le piccole restano
// ferme, sono densità/texture.
//
// Entrambe le passate usano colore pieno pre-mescolato (vedi
// scripts/colors.mjs) invece di fill-opacity: prima, centinaia di icone
// semitrasparenti sovrapposte durante il volo sommavano opacità e
// trasformavano lo sfondo in una nebbia grigia — con colore pieno la
// forma sopra copre semplicemente quella sotto, niente più somma.
const BIG_OPACITY = 0.035;
const BIG_COLOR = blendOver(BIG_OPACITY);
// Il clone vola con lo STESSO colore con cui l'icona nasce e con cui
// atterra (BIG_COLOR): un valore diverso, per quanto la transizione sia
// morbida, resta comunque un cambio di livello visibile — l'icona
// "cambia" durante il volo invece di limitarsi a spostarsi. Deciso
// dopo un primo tentativo con opacità boostata (0.18) durante il volo,
// respinto per questo motivo esatto.
const FLYING_COLOR = BIG_COLOR;

function shapeIndexOf(use: SVGUseElement): number {
  const href = use.getAttribute('href') ?? use.getAttribute('xlink:href') ?? '';
  const m = href.match(/#s(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function parseTransform(use: SVGUseElement): { tx: number; ty: number; theta: number; s: number } {
  const t = use.getAttribute('transform') ?? '';
  const tr = t.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
  const ro = t.match(/rotate\(([-\d.]+)\)/);
  const sc = t.match(/scale\(([-\d.]+)\)/);
  return {
    tx: tr ? parseFloat(tr[1]) : 0,
    ty: tr ? parseFloat(tr[2]) : 0,
    theta: ro ? parseFloat(ro[1]) : 0,
    s: sc ? parseFloat(sc[1]) : 1,
  };
}

// preserveAspectRatio="xMidYMid slice": il viewBox viene scalato per
// COPRIRE tutto il riquadro (non per starci dentro), poi centrato —
// stesso identico rapporto che il browser applica per renderizzare
// l'SVG di sezione. Ogni sezione è sempre h-dvh a piena larghezza,
// quindi il riquadro renderizzato coincide con l'intera viewport.
function pxSpace(svg: SVGSVGElement) {
  const vb = svg.viewBox.baseVal;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scale = vb.width && vb.height ? Math.max(w / vb.width, h / vb.height) : 1;
  return {
    scale,
    offsetX: (w - vb.width * scale) / 2,
    offsetY: (h - vb.height * scale) / 2,
  };
}

type PxTransform = { px: number; py: number; theta: number; s: number };

function toPxTransform(use: SVGUseElement, space: { scale: number; offsetX: number; offsetY: number }): PxTransform {
  const { tx, ty, theta, s } = parseTransform(use);
  return {
    px: space.offsetX + tx * space.scale,
    py: space.offsetY + ty * space.scale,
    theta,
    s: s * space.scale,
  };
}

function writeTransform(use: SVGUseElement, t: PxTransform) {
  use.setAttribute('transform', `translate(${t.px},${t.py}) rotate(${t.theta}) scale(${t.s})`);
}

// Raggruppa le icone "big pass" per categoria (shapeIndex): due icone
// si scambiano il posto solo se sono la stessa categoria, altrimenti
// un'icona atterrerebbe su una forma diversa da quella con cui è
// partita.
function groupByShape(svg: SVGSVGElement): Map<number, SVGUseElement[]> {
  const map = new Map<number, SVGUseElement[]>();
  svg.querySelectorAll<SVGUseElement>(`use[fill="${BIG_COLOR}"]`).forEach((use) => {
    const idx = shapeIndexOf(use);
    (map.get(idx) ?? map.set(idx, []).get(idx)!).push(use);
  });
  return map;
}

// Chiamata di nuovo su resize (vedi index.astro): ripulisce gli
// ScrollTrigger e l'overlay della chiamata precedente prima di
// ricostruire, altrimenti si accumulano copie che scrivono transform
// sugli stessi elementi.
function teardownPreviousMorph() {
  ScrollTrigger.getAll().forEach((st) => {
    if (st.vars.id?.toString().startsWith('section-morph-')) st.kill();
  });
  document.querySelectorAll('[data-section-morph-overlay]').forEach((el) => el.remove());
}

export function initSectionMorph() {
  teardownPreviousMorph();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const scroller = document.getElementById('scroll-container');
  if (!scroller) return;

  const sections = Array.from(scroller.children) as HTMLElement[];
  const svgs = sections.map((s) => s.querySelector<SVGSVGElement>('[data-pattern-bg]'));
  if (!svgs.some(Boolean)) return;

  const overlay = document.createElementNS(SVG_NS, 'svg');
  overlay.setAttribute('data-section-morph-overlay', '');
  overlay.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:5;pointer-events:none;opacity:0;transition:opacity 300ms ease;';
  const defs = document.createElementNS(SVG_NS, 'defs');
  ICON_RAW.forEach((raw, i) => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('id', `morph-icon-${i}`);
    g.innerHTML = stripBakedFill(innerMarkup(raw));
    defs.appendChild(g);
  });
  overlay.appendChild(defs);
  document.body.appendChild(overlay);

  let pairCount = 0;
  // Un'icona può comparire come "arrivo" del confine i e "partenza"
  // del confine i+1 (la stessa sezione è target di uno e source
  // dell'altro): senza questo tracking i due confini scriverebbero
  // opacità in conflitto sullo stesso elemento, e vince solo l'ordine
  // di esecuzione — non la sezione davvero a schermo. Ogni icona viene
  // quindi assegnata a un solo confine.
  const claimed = new Set<SVGUseElement>();

  for (let i = 0; i < sections.length - 1; i++) {
    const fromSvg = svgs[i];
    const toSvg = svgs[i + 1];
    if (!fromSvg || !toSvg) continue;

    const fromSpace = pxSpace(fromSvg);
    const toSpace = pxSpace(toSvg);
    const fromGroups = groupByShape(fromSvg);
    const toGroups = groupByShape(toSvg);

    const fromEls: SVGUseElement[] = [];
    const toEls: SVGUseElement[] = [];
    const cloneEls: SVGUseElement[] = [];

    // Fuori dalla finestra attiva del confine, gli originali tornano
    // visibili e il clone si nasconde: vedi punto 3 in cima al file.
    const EPS = 0.001;
    function setActive(progress: number) {
      const atStart = progress <= EPS;
      const atEnd = progress >= 1 - EPS;
      const cloneVisible = atStart || atEnd ? '0' : '1';
      fromEls.forEach((el) => { el.style.opacity = atStart ? '1' : '0'; });
      toEls.forEach((el) => { el.style.opacity = atEnd ? '1' : '0'; });
      cloneEls.forEach((el) => { el.style.opacity = cloneVisible; });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        id: `section-morph-${i}`,
        trigger: sections[i],
        scroller,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => setActive(self.progress),
        onRefresh: (self) => setActive(self.progress),
      },
    });

    fromGroups.forEach((fromList, idx) => {
      const toList = toGroups.get(idx);
      if (!toList || !toList.length) return;

      const availableFrom = fromList.filter((u) => !claimed.has(u));
      const availableTo = toList.filter((u) => !claimed.has(u));
      const n = Math.min(availableFrom.length, availableTo.length);

      for (let k = 0; k < n; k++) {
        const from = availableFrom[k];
        const to = availableTo[k];
        claimed.add(from);
        claimed.add(to);

        const fromPx = toPxTransform(from, fromSpace);
        const toPx = toPxTransform(to, toSpace);

        // Senza transizione CSS, il passaggio originale↔clone allo
        // scatto della finestra attiva (vedi punto 3) è un cambio
        // istantaneo di opacità — si vede come uno scatto secco. Con
        // la transizione diventa una dissolvenza appena percettibile.
        from.style.transition = 'opacity 200ms ease';
        to.style.transition = 'opacity 200ms ease';
        fromEls.push(from);
        toEls.push(to);

        const clone = document.createElementNS(SVG_NS, 'use');
        clone.setAttribute('href', `#morph-icon-${idx}`);
        clone.setAttribute('fill', FLYING_COLOR);
        clone.style.opacity = '0';
        clone.style.transition = 'opacity 200ms ease';
        overlay.appendChild(clone);
        cloneEls.push(clone);
        pairCount++;

        const state = { ...fromPx };
        writeTransform(clone, state);

        tl.to(
          state,
          {
            px: toPx.px,
            py: toPx.py,
            theta: toPx.theta,
            s: toPx.s,
            ease: 'none',
            onUpdate: () => writeTransform(clone, state),
          },
          0
        );
      }
    });

    setActive(0);
  }

  if (pairCount === 0) {
    overlay.remove();
    return;
  }

  requestAnimationFrame(() => requestAnimationFrame(() => { overlay.style.opacity = '1'; }));
}
