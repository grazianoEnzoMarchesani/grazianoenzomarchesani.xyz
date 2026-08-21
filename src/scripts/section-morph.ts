/**
 * Morphing per movimento tra gli sfondi delle sezioni: durante lo
 * scroll da una sezione alla successiva, le icone "big" dello sfondo
 * si staccano dalla loro sezione e volano fino alla posizione/
 * rotazione/scala che un'icona della stessa categoria occupa nella
 * sezione dopo, invece di comparire in dissolvenza. Validato in
 * prototipo (variante A — diretto), vedi docs/brain/design.md.
 *
 * Vincoli scoperti a mano, non ovvi dal solo codice:
 *
 * 1. Le icone volanti vivono in un overlay `position:fixed`, non
 *    dentro l'SVG di sezione: un elemento annidato lì scrollerebbe via
 *    insieme alla sezione invece di restare in scena.
 * 2. La posizione di arrivo NON si può leggere con
 *    getBoundingClientRect() sull'icona di destinazione, perché al
 *    momento del setup quella sezione è ancora fuori viewport — il
 *    rect letto sarebbe quello "scrollato via". Si legge invece il
 *    `transform` già presente nell'SVG generato e lo si usa TALE E
 *    QUALE, in unità viewBox: la conversione in pixel non avviene mai
 *    per icona, la fa una volta sola il transform dello "stage" (vedi
 *    updateStage). Così un cambio di viewport — su mobile la barra URL
 *    che riappare scrollando in su, che cambia `dvh` sotto i piedi —
 *    aggiorna una sola scrittura di stile invece di invalidare 34
 *    coordinate congelate al setup: era questo a far atterrare le
 *    icone fuori posto.
 *    Nota: l'algoritmo ruota ogni icona attorno alla propria origine
 *    locale, non al proprio centro — da cui `transform-origin: 0 0`.
 * 3. Le coordinate di un clone sono "locali" alla sua sezione: hanno
 *    senso solo mentre QUEL preciso confine è a schermo. Un clone
 *    disegnato sempre resterebbe nel DOM per tutta la pagina come un
 *    "fantasma" sovrapposto a qualunque sezione. I cloni compaiono
 *    quindi solo mentre il loro confine è in volo — ma la visibilità
 *    degli ORIGINALI non può appartenere al singolo confine, perché le
 *    icone di una sezione sono contese da due confini adiacenti: vedi
 *    setFlying, dove sta la proprietà unica.
 * 4. I cloni sono `<div>` con `mask-image` dell'icona e la tile del
 *    pattern come `background-image`, non `<use>` SVG con
 *    `fill="url(#pattern)"`. Un pattern-fill dentro una forma che
 *    ruota e scala è il caso peggiore per il rasterizer: ri-tiling
 *    completo a ogni frame, nessuna composizione GPU. Con
 *    maschera + background il browser compone un layer già
 *    rasterizzato e il transform diventa gratis. La grafica è
 *    identica: stessa forma (la maschera È l'icona sorgente) e stessa
 *    tile (vedi TILES, byte per byte i pattern di prima).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { blendOver } from '../../scripts/colors.mjs';
import researchIcon from '../assets/research.svg?url';
import teachingIcon from '../assets/teaching.svg?url';
import projectsIcon from '../assets/projects.svg?url';
import toolsIcon from '../assets/tools.svg?url';

// Stesso ordine di ICON_FILES in scripts/generate-patterns.mjs: gli
// indici shapeIndex incorporati nei pattern (#s0..#s3) si riferiscono
// a questa sequenza.
const ICON_URL = [researchIcon, teachingIcon, projectsIcon, toolsIcon];

// viewBox dei file in src/assets/, nello stesso ordine. Serve a dare al
// div-maschera lo stesso riquadro che `<use href="#sN">` occupa nello
// sfondo generato. Se un'icona viene ridisegnata con un viewBox
// diverso, va aggiornata qui — l'assert in fondo al file lo segnala in
// dev invece di lasciar sbagliare le proporzioni in silenzio.
const ICON_SIZE: [number, number][] = [
  [179, 264],
  [264, 264],
  [251, 251],
  [174, 258],
];

// Entrambe le passate dello sfondo usano colore pieno pre-mescolato
// (vedi scripts/colors.mjs) invece di fill-opacity: prima, centinaia di
// icone semitrasparenti sovrapposte durante il volo sommavano opacità e
// trasformavano lo sfondo in una nebbia grigia — con colore pieno la
// forma sopra copre semplicemente quella sotto.
const BIG_OPACITY = 0.035;
const BIG_COLOR = blendOver(BIG_OPACITY);
const PATTERN_INK_OPACITY = 0.12;
const PATTERN_INK_COLOR = blendOver(PATTERN_INK_OPACITY);

// Pattern decorativi delicati per i cloni volanti:
// - 0: Pois regolari (grid dots)
// - 1: Puntini sfalsati (staggered dots)
// - 2: Righette oblique a 45° (diagonal stripes 45°)
// - 3: Righette oblique a -45° (diagonal stripes -45°)
const TILES: { size: number; markup: string }[] = [
  {
    size: 20,
    markup: `<rect width="20" height="20" fill="${BIG_COLOR}"/><circle cx="10" cy="10" r="2" fill="${PATTERN_INK_COLOR}"/>`,
  },
  {
    size: 24,
    markup: `<rect width="24" height="24" fill="${BIG_COLOR}"/><circle cx="6" cy="6" r="1.8" fill="${PATTERN_INK_COLOR}"/><circle cx="18" cy="18" r="1.8" fill="${PATTERN_INK_COLOR}"/>`,
  },
  {
    size: 16,
    markup: `<rect width="16" height="16" fill="${BIG_COLOR}"/><line x1="0" y1="16" x2="16" y2="0" stroke="${PATTERN_INK_COLOR}" stroke-width="1.5" stroke-linecap="square"/><line x1="-4" y1="4" x2="4" y2="-4" stroke="${PATTERN_INK_COLOR}" stroke-width="1.5" stroke-linecap="square"/><line x1="12" y1="20" x2="20" y2="12" stroke="${PATTERN_INK_COLOR}" stroke-width="1.5" stroke-linecap="square"/>`,
  },
  {
    size: 16,
    markup: `<rect width="16" height="16" fill="${BIG_COLOR}"/><line x1="0" y1="0" x2="16" y2="16" stroke="${PATTERN_INK_COLOR}" stroke-width="1.5" stroke-linecap="square"/><line x1="12" y1="-4" x2="20" y2="4" stroke="${PATTERN_INK_COLOR}" stroke-width="1.5" stroke-linecap="square"/><line x1="-4" y1="12" x2="4" y2="20" stroke="${PATTERN_INK_COLOR}" stroke-width="1.5" stroke-linecap="square"/>`,
  },
];

function tileUrl(i: number): string {
  const { size, markup } = TILES[i];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${markup}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function shapeIndexOf(use: SVGUseElement): number {
  const href = use.getAttribute('href') ?? use.getAttribute('xlink:href') ?? '';
  const m = href.match(/#s(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

type SrcTransform = { tx: number; ty: number; theta: number; s: number };

// L'algoritmo che genera gli sfondi produce ogni tanto rumore in
// virgola mobile in notazione scientifica — `translate(1.42e-14, 827.9)`
// invece di `translate(0, 827.9)`. Un pattern di numero ingenuo
// (`[-\d.]+`) non la riconosce, e la vecchia versione di questa
// funzione in quel caso non falliva: restituiva `tx: 0, ty: 0`,
// buttando via anche la coordinata valida e spedendo quell'icona a
// volare da/verso l'angolo in alto a sinistra. Da qui NUM, e da qui il
// null invece di uno zero silenzioso: un transform che non si sa
// leggere fa saltare la coppia, non la fa atterrare nel posto sbagliato.
const NUM = String.raw`-?[\d.]+(?:e[-+]?\d+)?`;
const RE_TRANSLATE = new RegExp(`translate\\((${NUM}),\\s*(${NUM})\\)`);
const RE_ROTATE = new RegExp(`rotate\\((${NUM})\\)`);
const RE_SCALE = new RegExp(`scale\\((${NUM})\\)`);

function parseTransform(use: SVGUseElement): SrcTransform | null {
  const t = use.getAttribute('transform') ?? '';
  const tr = t.match(RE_TRANSLATE);
  if (!tr) return null;
  const ro = t.match(RE_ROTATE);
  const sc = t.match(RE_SCALE);
  return {
    tx: parseFloat(tr[1]),
    ty: parseFloat(tr[2]),
    theta: ro ? parseFloat(ro[1]) : 0,
    s: sc ? parseFloat(sc[1]) : 1,
  };
}

// Raggruppa le icone "big pass" per categoria (shapeIndex): due icone
// si scambiano il posto solo se sono la stessa categoria, altrimenti
// un'icona atterrerebbe su una forma diversa da quella con cui è
// partita.
function groupByShape(svg: SVGSVGElement): Map<number, SVGUseElement[]> {
  const map = new Map<number, SVGUseElement[]>();
  svg.querySelectorAll<SVGUseElement>('use[fill^="url(#pat-"]').forEach((use) => {
    const idx = shapeIndexOf(use);
    (map.get(idx) ?? map.set(idx, []).get(idx)!).push(use);
  });
  return map;
}

// Chiamata di nuovo su resize (vedi PaginaHome.astro): ripulisce gli
// ScrollTrigger, l'overlay e il listener di viewport della chiamata
// precedente prima di ricostruire, altrimenti si accumulano copie.
let detachViewportListener: (() => void) | null = null;

export function teardownPreviousMorph() {
  ScrollTrigger.getAll().forEach((st) => {
    if (st.vars.id?.toString().startsWith('section-morph-')) st.kill();
  });
  document.querySelectorAll('[data-section-morph-overlay]').forEach((el) => el.remove());
  detachViewportListener?.();
  detachViewportListener = null;
}

export function initSectionMorph() {
  teardownPreviousMorph();
  // Il morphing è desktop-only per scelta. Su touch resta spento: lì il
  // costo per frame è più alto e la barra URL che appare/scompare
  // cambia `dvh` durante lo scroll, quindi le icone volanti rischiano
  // di non combaciare con quelle statiche all'arrivo. Senza overlay le
  // sezioni restano identiche — gli sfondi statici non li tocca nessuno,
  // cambia solo che le icone non volano più da una sezione all'altra.
  // `pointer: coarse` invece della larghezza: distingue il dispositivo,
  // non la finestra, così un desktop con la finestra stretta continua ad
  // avere l'animazione.
  if (window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;

  const scroller = document.getElementById('scroll-container');
  if (!scroller) return;

  const sections = Array.from(scroller.children) as HTMLElement[];
  const svgs = sections.map((s) => s.querySelector<SVGSVGElement>('[data-pattern-bg]'));
  const refSvg = svgs.find(Boolean);
  if (!refSvg) return;

  const overlay = document.createElement('div');
  overlay.setAttribute('data-section-morph-overlay', '');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:5;pointer-events:none;opacity:0;transition:opacity 300ms ease;contain:strict;';

  // Unico punto di conversione viewBox → pixel: i cloni dentro lo stage
  // usano le coordinate viewBox grezze lette dall'SVG sorgente, e lo
  // stage riproduce la stessa mappatura che il browser applica agli
  // sfondi di sezione (preserveAspectRatio="xMidYMid slice": scala per
  // COPRIRE il riquadro, poi centra). Aggiornarlo a ogni cambio di
  // viewport costa una scrittura di stile — vedi punto 2 in testa al
  // file.
  const stage = document.createElement('div');
  stage.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0;';
  overlay.appendChild(stage);
  document.body.appendChild(overlay);

  const vb = refSvg.viewBox.baseVal;
  function updateStage() {
    const rect = refSvg!.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const scale = vb.width && vb.height ? Math.max(w / vb.width, h / vb.height) : 1;
    const offsetX = (w - vb.width * scale) / 2;
    const offsetY = (h - vb.height * scale) / 2;
    stage.style.transform = `translate(${offsetX}px,${offsetY}px) scale(${scale})`;
  }
  updateStage();

  window.addEventListener('resize', updateStage);
  window.visualViewport?.addEventListener('resize', updateStage);
  detachViewportListener = () => {
    window.removeEventListener('resize', updateStage);
    window.visualViewport?.removeEventListener('resize', updateStage);
  };

  // Le icone di una sezione appartengono a DUE confini: sono i `toEls`
  // di quello che la precede e i `fromEls` di quello che la segue. Se
  // ogni confine scrive l'opacità dei propri originali, a riposo i due
  // padroni si contraddicono — il primo le vuole a 0 (destinazione non
  // ancora raggiunta), il secondo a 1 (partenza a riposo) — e vince chi
  // ha aggiornato per ultimo. Da qui un difetto intermittente, che
  // cambia col verso dello scroll e che sull'ULTIMO confine non si vede
  // mai, perché quello non ha un vicino a destra che gli contenda le
  // icone.
  //
  // Proprietà unica: gli originali sono visibili di default e solo il
  // confine effettivamente in volo nasconde i suoi. Ne vola uno alla
  // volta — le finestre dei confini sono contigue e non si sovrappongono
  // — quindi `flying` basta a descrivere tutto lo stato.
  type Boundary = { fromEls: SVGUseElement[]; toEls: SVGUseElement[]; cloneEls: HTMLElement[] };
  const boundaries: Boundary[] = [];
  let flying = -1;

  function setFlying(next: number) {
    if (next === flying) return;
    const apply = (b: Boundary, on: boolean) => {
      const originals = on ? '0' : '1';
      b.fromEls.forEach((el) => { el.style.opacity = originals; });
      b.toEls.forEach((el) => { el.style.opacity = originals; });
      b.cloneEls.forEach((el) => {
        el.style.opacity = on ? '1' : '0';
        el.style.willChange = on ? 'transform' : 'auto';
      });
    };
    if (flying >= 0) apply(boundaries[flying], false);
    flying = next;
    if (next >= 0) apply(boundaries[next], true);
  }

  let pairCount = 0;

  for (let i = 0; i < sections.length - 1; i++) {
    const fromSvg = svgs[i];
    const toSvg = svgs[i + 1];
    if (!fromSvg || !toSvg) continue;

    const fromGroups = groupByShape(fromSvg);
    const toGroups = groupByShape(toSvg);

    const fromEls: SVGUseElement[] = [];
    const toEls: SVGUseElement[] = [];
    const cloneEls: HTMLElement[] = [];

    // Soglie strette. Servono a non lasciare i cloni visibili a riposo
    // quando lo snap subpixel (mobile/Brave) fa fermare il progress a
    // 0.0001 invece che a 0 — ma vanno tenute PICCOLE, perché nell'
    // istante dello scambio il clone è già `soglia × lunghezza del volo`
    // lontano dall'icona statica che sta sostituendo. Misurato su
    // schermo 412×915: volo mediano ~300-390px, massimo ~800px, quindi
    // a 0.04 lo scambio faceva saltare ogni icona di 11-16px (fino a
    // 32px) in un frame, due volte per confine. A 0.004 il salto è di
    // 1-3px, sotto la soglia del percepibile. `setFlying` è memoizzato:
    // onUpdate scatta a ogni frame di scroll, ma le opacità cambiano
    // solo ai due passaggi di stato — prima erano ~100 scritture di
    // stile per frame che riscrivevano lo stesso valore. Il toggle di
    // will-change viaggia insieme, così i layer GPU dei cloni esistono
    // solo mentre volano davvero.
    const START_THRESHOLD = 0.004;
    const END_THRESHOLD = 0.996;
    const bi = boundaries.length;
    boundaries.push({ fromEls, toEls, cloneEls });

    const onProgress = (p: number) => {
      if (p > START_THRESHOLD && p < END_THRESHOLD) setFlying(bi);
      else if (flying === bi) setFlying(-1);
    };

    const tl = gsap.timeline({
      scrollTrigger: {
        id: `section-morph-${i}`,
        trigger: sections[i],
        scroller,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => onProgress(self.progress),
        onRefresh: (self) => onProgress(self.progress),
      },
    });

    fromGroups.forEach((fromList, idx) => {
      const toList = toGroups.get(idx);
      if (!toList || !toList.length) return;

      const n = Math.min(fromList.length, toList.length);
      const [iconW, iconH] = ICON_SIZE[idx] ?? [100, 100];
      const mask = `url("${ICON_URL[idx]}") no-repeat center / 100% 100%`;
      const tile = tileUrl(idx % TILES.length);
      const tileSize = TILES[idx % TILES.length].size;

      for (let k = 0; k < n; k++) {
        const from = fromList[k];
        const to = toList[k];

        const fromT = parseTransform(from);
        const toT = parseTransform(to);
        if (!fromT || !toT) continue;

        // Nessuna transizione sullo scambio originale↔clone: serviva a
        // camuffare il salto delle soglie larghe, ma con soglie strette
        // il clone parte esattamente sopra l'icona che sostituisce e lo
        // scambio istantaneo è invisibile. Peggio: due copie della
        // stessa forma al 50% di opacità NON compongono la copia piena
        // (queste forme sono a 0.035 di alpha), quindi la dissolvenza
        // si vedeva come un doppio fantasma più chiaro — e su scroll
        // veloce una dissolvenza veniva interrotta dalla successiva,
        // lasciando le icone a opacità intermedia.
        fromEls.push(from);
        toEls.push(to);

        const clone = document.createElement('div');
        clone.style.cssText =
          `position:absolute;left:0;top:0;width:${iconW}px;height:${iconH}px;opacity:0;` +
          `background:${tile};background-size:${tileSize}px ${tileSize}px;` +
          `-webkit-mask:${mask};mask:${mask};`;
        stage.appendChild(clone);
        cloneEls.push(clone);
        pairCount++;

        // transformOrigin 0 0: l'algoritmo dello sfondo ruota e scala
        // ogni icona attorno alla propria origine locale, non al centro
        // (il default di CSS/GSAP), e l'ordine translate → rotate →
        // scale è lo stesso che GSAP compone nella sua matrice.
        gsap.set(clone, {
          x: fromT.tx,
          y: fromT.ty,
          rotation: fromT.theta,
          scale: fromT.s,
          transformOrigin: '0 0',
        });

        tl.to(
          clone,
          { x: toT.tx, y: toT.ty, rotation: toT.theta, scale: toT.s, ease: 'none' },
          0
        );
      }
    });

  }

  if (pairCount === 0) {
    overlay.remove();
    detachViewportListener?.();
    detachViewportListener = null;
    return;
  }

  requestAnimationFrame(() => requestAnimationFrame(() => { overlay.style.opacity = '1'; }));
}

// Controllo in dev: ICON_SIZE è copiato a mano dai viewBox dei file in
// src/assets/. Se un'icona viene ridisegnata, la maschera si
// deformerebbe in silenzio — qui invece compare un warning in console.
if (import.meta.env?.DEV) {
  ICON_URL.forEach((url, i) => {
    fetch(url)
      .then((r) => r.text())
      .then((raw) => {
        const m = raw.match(/viewBox="[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)"/);
        if (!m) return;
        const [w, h] = [parseFloat(m[1]), parseFloat(m[2])];
        const [ew, eh] = ICON_SIZE[i];
        if (w !== ew || h !== eh) {
          console.warn(`[section-morph] ICON_SIZE[${i}] è ${ew}×${eh}, il file dice ${w}×${h}`);
        }
      })
      .catch(() => {});
  });
}
