import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  type FieldCategory,
  type FieldMarker,
  type FieldYear,
} from '../data/fields';

import researchIcon from '../assets/research.svg?raw';
import teachingIcon from '../assets/teaching.svg?raw';
import projectsIcon from '../assets/projects.svg?raw';
import toolsIcon from '../assets/tools.svg?raw';

gsap.registerPlugin(ScrollTrigger);

const ICON_SVG: Record<FieldCategory, string> = {
  research: researchIcon,
  teaching: teachingIcon,
  projects: projectsIcon,
  tools: toolsIcon,
};

const INK = 0x1a1a19;
const PAPER = 0xebf3ee;

const RADIUS = 2.2;
const PITCH = 3; // distanza lungo l'asse per un giro/anno completo
const SEGMENTS_PER_TURN = 64;
const CAMERA_Z = 4.2;
const CAMERA_FOV = 76; // Prospettiva grandangolare esasperata per effetto tunnel immersivo

// Punto sull'elica: t in "giri" assoluti (0 = imboccatura/2026, cresce verso il passato).
function helixPoint(t: number, out = new THREE.Vector3()) {
  const angle = t * Math.PI * 2;
  return out.set(RADIUS * Math.cos(angle), RADIUS * Math.sin(angle), -t * PITCH);
}

/**
 * Sotto questa larghezza (viewport, px) la spirale diventa una "corda"
 * verticale — deciso in sessione di `/grill-me` del 2026-08-20, vedi
 * docs/brain/fields-spiral.md. Allineato al breakpoint `sm:` di Tailwind,
 * unica convenzione responsive già in uso nel sito.
 */
const MOBILE_BREAKPOINT = 640;

type ShapeMode = 'spiral' | 'rope';

// Corda (mobile): serpentina costruita su PUNTI DI CONTROLLO ORTOGONALI,
// non su una spline libera — rifatta da zero in sessione 2026-08-20 dopo
// che la prima versione (un'ansa per anno, con curve di Bézier a mano) è
// stata bocciata dall'utente confrontandola col suo disegno di
// riferimento. Modello corretto: la polilinea di controllo è fatta di
// soli tratti orizzontali e verticali che si incontrano ad angolo retto;
// gli angoli vengono poi raccordati (fillet) con archi di cerchio
// tangenti. Un anno = un tratto ORIZZONTALE dritto (dove vivono i
// marker, lungo in proporzione a quanti contenuti ha quell'anno: più
// contenuti = più spazio, stesso principio delle spire nella spirale
// desktop) + un'INVERSIONE A U che scende alla riga successiva e
// riparte in direzione opposta. Il percorso è continuo come una corda
// vera: l'anno dopo inizia esattamente dove il precedente ha girato,
// mai un ritorno artificiale al centro.
/** true = disegna la polilinea di controllo a spigoli vivi (nessun
 *  raccordo): serve a verificare a occhio dove cadono i punti di
 *  controllo effettivi della corda. */
const ROPE_RIGID = false;
// I due punti di controllo che chiudono l'ansa si allontanano anche
// VERTICALMENTE quando l'anno è pieno — richiesta esplicita
// dell'utente, stessa logica già applicata in orizzontale: un anno
// carico ha più respiro in entrambe le direzioni.
const ROPE_DROP_MIN = 1.7; // altezza minima dell'ansa (anno con un solo contenuto)
const ROPE_DROP_STEP = 0.17; // allungamento verticale dell'ansa per marker dell'anno
const ROPE_DROP_MAX = 3.2;
/**
 * Raggio del raccordo: **sempre il massimo possibile**, cioè metà
 * dell'altezza dell'ansa (richiesta esplicita dell'utente). Così i due
 * quarti di cerchio si toccano e l'ansa è un semicerchio puro: nella
 * corda restano solo tratti dritti ORIZZONTALI, mai verticali. Il
 * raggio quindi non è una costante: cresce con l'ansa, che cresce coi
 * contenuti dell'anno.
 */
function ropeTurnRadius(drop: number) {
  return ROPE_RIGID ? 0 : drop / 2;
}
// Il tratto dritto è lungo quanto serve ai marker di quell'anno: passo
// fisso per marker, non una scala astratta sul massimo. È il punto del
// disegno di riferimento ("questo spazio si potrebbe estendere alla
// bisogna"): distanziare i due punti di controllo fa spazio agli
// elementi. Il massimo esiste solo perché la corda non scorre in
// orizzontale — quello che esce dai bordi non è più raggiungibile — e
// oltre quella soglia i marker si stringono tra loro invece di allargare
// ancora la riga.
const ROPE_MARKER_STEP = 0.4; // passo tra due marker sullo stesso tratto
const ROPE_RUN_MIN = 0.45;
const ROPE_RUN_MAX = 3.4;
/** Distanza minima garantita tra due marker lungo la corda (lunghezza
 *  d'arco): le date reali possono cadere a pochi giorni l'una
 *  dall'altra, le sagome no — non devono mai sovrapporsi. Un filo più
 *  largo di MARKER_SIZE perché le icone sono normalizzate per area, e
 *  quelle allungate (freccia, barra) sono più larghe della loro
 *  "dimensione" nominale. */
const ROPE_MARKER_GAP = 0.46;
/** Margine ai due capi del percorso di un anno: tiene i marker lontani
 *  dal confine con l'anno precedente/successivo. */
const ROPE_MARKER_EDGE = 0.3;
const ROPE_CAMERA_FOV = 64;
/** Larghezza visibile di riferimento (world units) per l'inquadratura ravvicinata:
 *  la telecamera sta vicina alla corda per mostrare i dettagli dei marker e
 *  seguire il percorso curvilineo (tratti orizzontali e curve a U) durante lo scroll. */
const ROPE_CAMERA_TARGET_WIDTH = 2.4;
const ROPE_CAMERA_MIN_Z = 3.2;
const ROPE_CAMERA_MAX_Z = 4.8;

/**
 * Icone vettoriali vere (BufferGeometry) importate dagli SVG di
 * categoria — deciso in sessione di `/grill-me` del 2026-08-19,
 * proseguendo la decisione presa il 2026-08-18 insieme alla
 * transizione di apertura (vedi docs/brain/fields-spiral.md): niente
 * texture raster su sprite, perché una bitmap si sgranerebbe allo
 * zoom-to-fill ~60× della transizione di apertura mentre un vettore
 * resta nitido.
 */
const MARKER_SIZE = .27;

const svgLoader = new SVGLoader();
const iconGeometryCache = new Map<FieldCategory, THREE.BufferGeometry[]>();

/**
 * Parsa l'SVG di categoria in geometrie vettoriali normalizzate:
 * centrate sull'origine e scalate per ingombro visivo (area della
 * bounding box) anziché per bounding box assoluta, così le 4 icone —
 * che hanno proporzioni molto diverse (freccia stretta, X quadrata,
 * diamante, barra diagonale) — pesano uguale lungo la spirale invece
 * di sembrare più grandi o più piccole a seconda della forma.
 */
function getIconGeometries(category: FieldCategory): THREE.BufferGeometry[] {
  const cached = iconGeometryCache.get(category);
  if (cached) return cached;

  // <clipPath> definisce un rettangolo di ritaglio non disegnato — ma
  // SVGLoader non ha alcuna nozione di clipPath, cammina ogni elemento
  // del DOM e lo tratta come un normale path riempito. Va rimosso prima
  // del parsing, altrimenti il rettangolo di clip finisce disegnato
  // sopra il glifo vero.
  const svgWithoutClipPaths = ICON_SVG[category].replace(/<clipPath[\s\S]*?<\/clipPath>/g, '');
  const { paths } = svgLoader.parse(svgWithoutClipPaths);
  // Esclude il rettangolo decorativo fill:none esportato dal tool di
  // disegno (bounding frame di riferimento, non parte del glifo).
  const geometries = paths
    .filter((path) => (path.userData?.style as { fill?: string } | undefined)?.fill !== 'none')
    .flatMap((path) => path.toShapes().map((shape) => new THREE.ShapeGeometry(shape)));

  const box = new THREE.Box3();
  for (const geometry of geometries) {
    geometry.computeBoundingBox();
    box.union(geometry.boundingBox!);
  }
  const centerX = (box.min.x + box.max.x) / 2;
  const centerY = (box.min.y + box.max.y) / 2;
  const width = box.max.x - box.min.x;
  const height = box.max.y - box.min.y;
  const scale = MARKER_SIZE / Math.sqrt(width * height);

  for (const geometry of geometries) {
    geometry.translate(-centerX, -centerY, 0);
    geometry.scale(scale, -scale, 1); // SVG è Y-down, three.js è Y-up
  }

  iconGeometryCache.set(category, geometries);
  return geometries;
}

/**
 * Fog "in primo piano" — deciso in sessione di `/grill-me` del
 * 2026-08-18 (vedi docs/brain/fields-spiral.md): simmetrico al
 * THREE.Fog di sfondo, stessa grandezza (distanza dalla camera), lato
 * opposto — sfuma verso PAPER quando un elemento si avvicina troppo
 * alla camera, non quando si allontana. Basato sulla distanza reale
 * (non sulla sola coordinata Y sullo schermo): il raggio della
 * spirale è fisso mentre il cono visivo si restringe vicino alla
 * camera, quindi gli elementi possono uscire dal frame da qualunque
 * bordo (alto, basso, sinistro, destro) a seconda della loro
 * posizione angolare sulla spira — una soglia legata al solo bordo
 * inferiore lasciava fuori quelli che esconvano lateralmente.
 * Iniettato via onBeforeCompile invece che calcolato per oggetto su
 * CPU: unico modo per avere una dissolvenza continua per-vertice sul
 * filo dell'elica (non solo sui marker), e si aggancia al chunk
 * <fog_fragment> già presente sui materiali invece di duplicarne la
 * logica. `-mvPosition.z` è la stessa metrica di profondità che
 * three.js usa internamente per il fog di sfondo (`vFogDepth`).
 */
const NEAR_FADE_START = 4.2; // profondità (world units) da cui inizia la dissolvenza con grandangolo
const NEAR_FADE_CLOSE = 1.6; // profondità da cui è completa prima del piano camera

const nearFadeUniformsList: { start: THREE.IUniform<number>; close: THREE.IUniform<number> }[] = [];
const symbolOpacityUniform = { value: 1.0 };

function applyNearFogFade(material: THREE.Material, isSymbol = false) {
  const startUniform = { value: NEAR_FADE_START };
  const closeUniform = { value: NEAR_FADE_CLOSE };
  nearFadeUniformsList.push({ start: startUniform, close: closeUniform });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPaperColor = { value: new THREE.Color(PAPER) };
    shader.uniforms.uNearFadeStart = startUniform;
    shader.uniforms.uNearFadeClose = closeUniform;
    if (isSymbol) {
      shader.uniforms.uSymbolOpacity = symbolOpacityUniform;
    }

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vNearFade;\nuniform float uNearFadeStart;\nuniform float uNearFadeClose;',
      )
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvNearFade = 1.0 - smoothstep( uNearFadeClose, uNearFadeStart, -mvPosition.z );',
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vNearFade;\nuniform vec3 uPaperColor;' +
          (isSymbol ? '\nuniform float uSymbolOpacity;' : ''),
      )
      .replace(
        '#include <fog_fragment>',
        '#include <fog_fragment>\n' +
          (isSymbol
            ? 'if (uSymbolOpacity <= 0.001) discard;\ngl_FragColor.rgb = mix( uPaperColor, gl_FragColor.rgb, uSymbolOpacity );\n'
            : '') +
          'gl_FragColor.rgb = mix( gl_FragColor.rgb, uPaperColor, vNearFade );',
      );
  };
  material.needsUpdate = true;
}

function buildShapeMesh(category: FieldCategory): THREE.Object3D {
  // DoubleSide: il flip su Y in getIconGeometries() (SVG Y-down → three.js
  // Y-up) inverte il winding order dei triangoli, altrimenti scartati dal
  // backface culling di default — stessa convenzione degli esempi
  // ufficiali SVGLoader di three.js.
  const material = new THREE.MeshBasicMaterial({ color: INK, fog: true, side: THREE.DoubleSide });
  applyNearFogFade(material, true);

  const group = new THREE.Group();
  for (const geometry of getIconGeometries(category)) {
    group.add(new THREE.Mesh(geometry, material));
  }
  return group;
}

type MarkerObject = {
  /** Geometria visibile — vedi buildShapeMesh(). */
  visual: THREE.Object3D;
  /** Piano invisibile usato solo per il raycasting: un'area di hit
   *  rettangolare uniforme, indipendente dalla sagoma vera (la X, ad
   *  esempio, ha un'area piena molto più piccola della sua bounding
   *  box). */
  hitPlane: THREE.Mesh;
  marker: FieldMarker;
  /** false quando il marker è quasi del tutto sfumato nel fog di
   *  primo piano (vedi NEAR_FADE_*): evita hover/click "fantasma" su
   *  una forma ormai invisibile. */
  interactable: boolean;
  /** Posizione lungo la forma attiva, in "giri" (parte intera = anno,
   *  parte decimale = posizione dentro l'anno). Governa focus, scala,
   *  etichette e scroll. Vale `spiralT` o `ropeT` a seconda della
   *  modalità corrente, riallineato da rebuildPositions(): le due forme
   *  ordinano i marker dentro l'anno in modo diverso (settori di
   *  categoria vs data reale) e il focus deve seguire l'ordine con cui
   *  i marker si incontrano davvero lungo la forma. */
  t: number;
  /** Settori di categoria, un quarto di giro ciascuno (spirale). */
  spiralT: number;
  /** Frazione d'anno della data reale del contenuto (corda). */
  ropeT: number;
  /** Elemento DOM del titolo dinamico fluttuante (se labelsContainer è presente). */
  labelEl?: HTMLButtonElement;
  yearIndex: number;
  markerIndex: number;
};

export type FieldsSpiralHandle = {
  destroy: () => void;
};

/** Durata dello zoom-to-fill — vedi docs/brain/fields-spiral.md,
 *  "Transizione di apertura": rapida e decisa, non cinematica. Il
 *  chiamante (fields.astro) usa la stessa durata per il fade-in
 *  dell'overlay ink, così le due animazioni finiscono insieme. */
export const OPEN_ZOOM_DURATION_MS = 450;

export function initFieldsSpiral(options: {
  canvas: HTMLCanvasElement;
  pinSection: HTMLElement;
  labelsContainer?: HTMLElement;
  timeline: FieldYear[];
  onHoverMarker?: (marker: FieldMarker | null) => void;
  /** Click/tap su un marker o sul suo titolo: avvia la transizione di apertura. */
  onOpenMarker: (marker: FieldMarker, playZoom: () => Promise<void>) => void;
}): FieldsSpiralHandle {
  const { canvas, pinSection, labelsContainer, timeline, onHoverMarker, onOpenMarker } = options;
  nearFadeUniformsList.length = 0;
  symbolOpacityUniform.value = 1.0;
  const turns = timeline.length;
  const totalLength = turns * PITCH;

  const ropeCounts = timeline.map((year) => year.markers.length);
  // Dislivello (= altezza dell'ansa) anno per anno: cresce col numero di
  // contenuti come la lunghezza del tratto.
  const ropeDrop = ropeCounts.map((count) =>
    THREE.MathUtils.clamp(ROPE_DROP_MIN + count * ROPE_DROP_STEP, ROPE_DROP_MIN, ROPE_DROP_MAX),
  );
  // Raggio massimo possibile per ogni ansa: mezza altezza dell'ansa
  // stessa, quindi semicerchio pieno e nessun verticale dritto.
  const ropeRadius = ropeDrop.map(ropeTurnRadius);
  // Lunghezza del tratto dritto orizzontale (da tangente a tangente). Il
  // clamp è la taratura estetica, ma l'ultima parola ce l'ha la
  // non-sovrapposizione: se il percorso dell'anno non basta a tenere
  // tutti i marker distanti almeno ROPE_MARKER_GAP, il tratto si
  // allunga finché basta (la camera si allontana di conseguenza, vedi
  // applyCameraForMode).
  const ropeRunStraight = ropeCounts.map((count, i) => {
    const base = THREE.MathUtils.clamp(count * ROPE_MARKER_STEP, ROPE_RUN_MIN, ROPE_RUN_MAX);
    const curved = Math.PI * ropeRadius[i] + (ropeDrop[i] - 2 * ropeRadius[i]);
    const needed = Math.max(0, count - 1) * ROPE_MARKER_GAP + 2 * ROPE_MARKER_EDGE - curved;
    return Math.max(base, needed);
  });
  /** Tratto dritto effettivamente disegnato: in modalità rigida arriva
   *  fino allo spigolo vivo, cioè un raggio più in là della tangente. */
  const ropeRunDrawn = ropeRunStraight.map((straight, i) => straight + (ROPE_RIGID ? ropeDrop[i] / 2 : 0));
  /** Lunghezza d'arco del percorso di un anno: tratto dritto + ansa. */
  function ropeYearLength(yearIndex: number) {
    const r = ropeRadius[yearIndex] ?? 0;
    return (
      (ropeRunDrawn[yearIndex] ?? ROPE_RUN_MIN) + Math.PI * r + ((ropeDrop[yearIndex] ?? ROPE_DROP_MIN) - 2 * r)
    );
  }
  // y di ciascuna riga: somma cumulata dei dislivelli precedenti (non
  // più un passo costante, gli anni non sono più alti uguali).
  const ropeRowY: number[] = [];
  let ropeTotalLength = 0;
  for (let i = 0; i < turns; i++) {
    ropeRowY.push(-ropeTotalLength);
    ropeTotalLength += ropeDrop[i];
  }

  /**
   * Posizione dei marker di un anno lungo il proprio pezzo di forma.
   * Unica fonte sia per la creazione dei marker sia per la geometria.
   *
   * - Sia per la spirale che per la corda: i marker sono posizionati
   *   in ordine puramente cronologico in base alla **data reale** del
   *   contenuto dentro il suo anno (`yearFraction`).
   * - Anti-sovrapposizione a due passate con spaziatura minima garantita:
   *   `ROPE_MARKER_GAP` lungo la corda e `SPIRAL_MARKER_GAP` lungo la spira.
   *   Il primo elemento in assoluto (anno 2026) cade esattamente a t = 0
   *   sia sulla spirale che sulla corda.
   */
  function yearPlacements(yearData: FieldYear, yearIndex: number) {
    const placements = yearData.markers.map((marker) => ({
      marker,
      category: marker.category,
      localTurn: marker.yearFraction,
      ropeLocal: marker.yearFraction,
    }));

    // Ordine cronologico per data reale
    const sorted = [...placements].sort((a, b) => a.marker.yearFraction - b.marker.yearFraction);

    // 1. Anti-sovrapposizione lungo la CORDA (lunghezza d'arco):
    const length = ropeYearLength(yearIndex);
    const startEdge = yearIndex === 0 ? 0 : ROPE_MARKER_EDGE;
    const usable = Math.max(0, length - startEdge - ROPE_MARKER_EDGE);
    const atRope = sorted.map((p) =>
      sorted.length === 1 && yearIndex === 0
        ? 0
        : startEdge + THREE.MathUtils.clamp(p.ropeLocal, 0, 1) * usable,
    );
    for (let i = 1; i < atRope.length; i++) atRope[i] = Math.max(atRope[i], atRope[i - 1] + ROPE_MARKER_GAP);
    for (let i = atRope.length - 1; i >= 0; i--) {
      const limit = i === atRope.length - 1 ? length - ROPE_MARKER_EDGE : atRope[i + 1] - ROPE_MARKER_GAP;
      atRope[i] = Math.min(atRope[i], limit);
    }
    sorted.forEach((p, i) => {
      p.ropeLocal = THREE.MathUtils.clamp(atRope[i] / length, 0, 1);
    });

    // 2. Anti-sovrapposizione lungo la SPIRALE (frazione di giro [0, 1]):
    const SPIRAL_MARKER_GAP = 0.055;
    const spiralStartEdge = yearIndex === 0 ? 0 : 0.04;
    const spiralEndEdge = 0.04;
    const spiralUsable = Math.max(0, 1.0 - spiralStartEdge - spiralEndEdge);
    const atSpiral = sorted.map((p) =>
      sorted.length === 1 && yearIndex === 0
        ? 0
        : spiralStartEdge + THREE.MathUtils.clamp(p.marker.yearFraction, 0, 1) * spiralUsable,
    );
    for (let i = 1; i < atSpiral.length; i++) atSpiral[i] = Math.max(atSpiral[i], atSpiral[i - 1] + SPIRAL_MARKER_GAP);
    for (let i = atSpiral.length - 1; i >= 0; i--) {
      const limit = i === atSpiral.length - 1 ? 1.0 - spiralEndEdge : atSpiral[i + 1] - SPIRAL_MARKER_GAP;
      atSpiral[i] = Math.min(atSpiral[i], limit);
    }
    sorted.forEach((p, i) => {
      p.localTurn = THREE.MathUtils.clamp(atSpiral[i], 0, 0.98);
    });

    return sorted;
  }

  const ropePlacements = timeline.map(yearPlacements);

  // Punti di controllo: x d'inizio del tratto di ciascun anno. La corda
  // gira e riparte da dove ha girato (a_{i+1} = b_i), quindi le x
  // "camminano" a destra e a sinistra invece di essere allineate — è
  // esattamente quello che succede nel disegno di riferimento, dove i
  // capi di ogni tratto cadono a quote diverse a seconda di quanto è
  // lungo l'anno.
  const ropeStartX: number[] = [];
  const ropeCornerX: number[] = [];
  {
    let x = 0;
    for (let i = 0; i < turns; i++) {
      ropeStartX.push(x);
      // L'ansa è un semicerchio: entra e esce alla STESSA x (il centro
      // del cerchio), quindi la riga dopo riparte da lì. Il punto più
      // esterno — la pancia dell'ansa, un raggio più in là — serve solo
      // per l'ingombro complessivo.
      x += ropeDir(i) * ropeRunDrawn[i];
      ropeCornerX.push(x + ropeDir(i) * ropeRadius[i]);
    }
  }
  const ropeMinX = Math.min(0, ...ropeCornerX, ...ropeStartX);
  const ropeMaxX = Math.max(0, ...ropeCornerX, ...ropeStartX);
  const ropeCenterX = (ropeMinX + ropeMaxX) / 2;

  function ropeDir(yearIndex: number) {
    return yearIndex % 2 === 0 ? 1 : -1;
  }

  /** x del punto di controllo d'inizio tratto, ricentrata sullo schermo. */
  function ropeRunStartX(yearIndex: number) {
    return (ropeStartX[yearIndex] ?? 0) - ropeCenterX;
  }

  /**
   * Punto sul percorso di un anno, con `s` in [0,1] parametrizzato per
   * LUNGHEZZA D'ARCO (non per frazione di sotto-tratto): il filo viene
   * campionato a passo costante e le inversioni non risultano più
   * dense/rade del tratto dritto.
   *
   * Il percorso dell'anno, nell'ordine: tratto dritto orizzontale →
   * quarto di cerchio → eventuale verticale dritto → quarto di cerchio,
   * e si ritrova all'inizio del tratto dell'anno successivo, tangente.
   * Col raggio al massimo (metà ansa, il caso normale) il verticale ha
   * lunghezza zero e i due quarti formano un semicerchio; con raggio 0
   * (ROPE_RIGID) restano gli spigoli vivi della polilinea di controllo.
   * Stessa formula per tutti e tre i casi.
   */
  function ropeYearPoint(yearIndex: number, s: number, out = new THREE.Vector3()) {
    const dir = ropeDir(yearIndex);
    const r = ropeRadius[yearIndex] ?? 0;
    const straight = ropeRunDrawn[yearIndex] ?? ROPE_RUN_MIN;
    const drop = ropeDrop[yearIndex] ?? ROPE_DROP_MIN;
    const y0 = ropeRowY[yearIndex] ?? 0;
    const runStart = ropeRunStartX(yearIndex);
    // Centro dei due archi dell'inversione (stessa x, quote diverse).
    const turnX = runStart + dir * straight;
    const quarter = (Math.PI * r) / 2;
    const vertical = drop - 2 * r;

    let d = s * ropeYearLength(yearIndex);
    if (d <= straight) return out.set(runStart + dir * d, y0, 0);
    d -= straight;
    if (d <= quarter) {
      const a = r > 0 ? d / r : 0; // 0 = sommità dell'arco, π/2 = fianco
      return out.set(turnX + dir * r * Math.sin(a), y0 - r + r * Math.cos(a), 0);
    }
    d -= quarter;
    if (d <= vertical) return out.set(turnX + dir * r, y0 - r - d, 0);
    d -= vertical;
    const a = Math.PI / 2 + (r > 0 ? d / r : 0); // π = fondo dell'arco
    return out.set(turnX + dir * r * Math.sin(a), y0 - drop + r + r * Math.cos(a), 0);
  }

  // Marker: la parte decimale di `t` (per la corda: la frazione d'anno
  // della data del contenuto, vedi yearPlacements) è direttamente la
  // frazione di lunghezza d'arco lungo TUTTO il percorso dell'anno,
  // ansa compresa — è il pezzo di corda che distingue un anno
  // dall'altro, quindi è quello lo spazio a disposizione, non il solo
  // tratto dritto. Identica a ropeWirePoint: marker e filo leggono la
  // stessa parametrizzazione, quindi i marker cadono esattamente sul
  // filo.
  function ropePoint(t: number, out = new THREE.Vector3()) {
    const yearIndex = Math.min(turns - 1, Math.floor(t));
    return ropeYearPoint(yearIndex, Math.min(1, t - yearIndex), out);
  }

  let ropeBodyLength = 0;
  for (let i = 0; i < turns; i++) {
    ropeBodyLength += ropeYearLength(i);
  }

  /**
   * Estensione orizzontale infinita agli estremi della corda:
   * sia all'inizio (anno 0, in alto) che alla fine (ultimo anno, in basso),
   * il filo prosegue orizzontalmente oltre lo schermo nella direzione naturale
   * (opposta alla prima ansa in entrata, e concorde all'uscita dell'ultima ansa),
   * dando l'illusione di una corda infinita senza influire sui marker o sullo scroll.
   */
  const ROPE_EXTENSION_LENGTH = 15;
  const ropeTotalWireLength = ROPE_EXTENSION_LENGTH * 2 + ropeBodyLength;

  // Filo: percorre l'intero tracciato compresi i prolungamenti orizzontali agli estremi
  function ropeWirePoint(tau: number, out = new THREE.Vector3()) {
    const clampedTau = THREE.MathUtils.clamp(tau, 0, 1);
    const D = clampedTau * ropeTotalWireLength;

    // 1. Estensione orizzontale iniziale (prima dell'anno 0)
    if (D < ROPE_EXTENSION_LENGTH) {
      const d = D; // da 0 a ROPE_EXTENSION_LENGTH
      const startX = ropeRunStartX(0);
      const dir0 = ropeDir(0);
      // Prolunga orizzontalmente verso l'esterno (opposto alla prima ansa) a quota Y = ropeRowY[0] = 0
      const x = startX - dir0 * (ROPE_EXTENSION_LENGTH - d);
      return out.set(x, ropeRowY[0] ?? 0, 0);
    }

    // 2. Tracciato principale della serpentina (anni da 0 a turns - 1)
    let dBody = D - ROPE_EXTENSION_LENGTH;
    for (let i = 0; i < turns; i++) {
      const len = ropeYearLength(i);
      if (dBody <= len || (i === turns - 1 && D <= ROPE_EXTENSION_LENGTH + ropeBodyLength)) {
        const s = len > 0 ? THREE.MathUtils.clamp(dBody / len, 0, 1) : 0;
        return ropeYearPoint(i, s, out);
      }
      dBody -= len;
    }

    // 3. Estensione orizzontale terminale (dopo l'ultimo anno)
    const dEnd = D - (ROPE_EXTENSION_LENGTH + ropeBodyLength);
    const lastYear = Math.max(0, turns - 1);
    const dirLast = ropeDir(lastYear);
    const lastStraight = ropeRunDrawn[lastYear] ?? ROPE_RUN_MIN;
    const lastDrop = ropeDrop[lastYear] ?? ROPE_DROP_MIN;
    const endX = ropeRunStartX(lastYear) + dirLast * lastStraight;
    const endY = (ropeRowY[lastYear] ?? 0) - lastDrop;

    // L'inversione dell'ultimo anno esce con tangente orizzontale in direzione -dirLast
    const x = endX - dirLast * dEnd;
    return out.set(x, endY, 0);
  }

  let width = pinSection.clientWidth || window.innerWidth || 800;
  let height = pinSection.clientHeight || window.innerHeight || 600;
  let isTransitioning = false;
  let isOpening = false;
  let isIntroPlaying = false;
  let introTimeline: gsap.core.Timeline | null = null;

  let shapeMode: ShapeMode = width < MOBILE_BREAKPOINT ? 'rope' : 'spiral';

  function shapePoint(t: number, out = new THREE.Vector3()) {
    return shapeMode === 'spiral' ? helixPoint(t, out) : ropePoint(t, out);
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAPER);
  scene.fog = new THREE.Fog(PAPER, PITCH * 1.8, totalLength * 0.85);

  const camera = new THREE.PerspectiveCamera(
    shapeMode === 'spiral' ? CAMERA_FOV : ROPE_CAMERA_FOV,
    width / height,
    0.1,
    100,
  );

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);

  const fog = scene.fog as THREE.Fog;

  function updateCanvasSize() {
    const newWidth = pinSection.clientWidth || window.innerWidth;
    const newHeight = pinSection.clientHeight || window.innerHeight;
    if (newWidth > 0 && newHeight > 0 && (newWidth !== width || newHeight !== height)) {
      width = newWidth;
      height = newHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  function applyCameraForMode() {
    updateCanvasSize();
    if (shapeMode === 'spiral') {
      camera.position.set(0, 0, CAMERA_Z);
      camera.lookAt(0, 0, 0);
      camera.fov = CAMERA_FOV;
      fog.near = PITCH * 1.8;
      fog.far = totalLength * 0.85;
      for (const u of nearFadeUniformsList) {
        u.start.value = NEAR_FADE_START;
        u.close.value = NEAR_FADE_CLOSE;
      }
    } else {
      // Inquadratura ravvicinata: la telecamera segue la corda da vicino,
      // scalando con l'aspect ratio dello schermo per garantire che la porzione
      // attiva della serpentina sia grande, nitida e ben visibile.
      const halfFov = THREE.MathUtils.degToRad(ROPE_CAMERA_FOV) / 2;
      const z = THREE.MathUtils.clamp(
        ROPE_CAMERA_TARGET_WIDTH / (2 * Math.tan(halfFov) * (camera.aspect || 0.5)),
        ROPE_CAMERA_MIN_Z,
        ROPE_CAMERA_MAX_Z,
      );
      camera.position.set(0, 0, z);
      camera.lookAt(0, 0, 0);
      camera.fov = ROPE_CAMERA_FOV;
      // Corda su piano Z=0: il fog di sfondo non deve interferire
      fog.near = z + 10;
      fog.far = z + 30;
      for (const u of nearFadeUniformsList) {
        u.start.value = 1.0;
        u.close.value = 0.3;
      }
    }
    camera.updateProjectionMatrix();
  }
  applyCameraForMode();

  const group = new THREE.Group();
  scene.add(group);

  const hitPlaneGeometry = new THREE.PlaneGeometry(MARKER_SIZE * 1.4, MARKER_SIZE * 1.4);
  const hitPlaneMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const markerObjects: MarkerObject[] = [];

  ropePlacements.forEach((placements, yearIndex) => {
    placements.forEach(({ marker, category, localTurn, ropeLocal }, markerIndex) => {
      const spiralT = yearIndex + localTurn;
      const ropeT = yearIndex + ropeLocal;
      const t = shapeMode === 'spiral' ? spiralT : ropeT;
      const position = shapePoint(t);

      const visual = buildShapeMesh(category);
      visual.position.copy(position);
      group.add(visual);

      const hitPlane = new THREE.Mesh(hitPlaneGeometry, hitPlaneMaterial);
      hitPlane.position.copy(position);
      group.add(hitPlane);

      let labelEl: HTMLButtonElement | undefined;
      if (labelsContainer) {
        labelEl = document.createElement('button');
        labelEl.type = 'button';
        labelEl.className =
          'fields-marker-label pointer-events-none absolute left-0 top-0 text-left font-sans text-xs uppercase tracking-widest text-ink transition-opacity duration-100 select-none leading-snug cursor-pointer group outline-none focus:outline-none';
        labelEl.style.opacity = '0';
        labelEl.style.whiteSpace = 'normal';
        labelEl.style.wordBreak = 'break-word';
        labelEl.style.transform = 'translate3d(-9999px, -9999px, 0)';

        const span = document.createElement('span');
        span.className = 'group-hover:underline';
        span.textContent = marker.title;
        labelEl.appendChild(span);

        labelsContainer.appendChild(labelEl);
      }

      markerObjects.push({
        visual,
        hitPlane,
        marker,
        interactable: true,
        t,
        spiralT,
        ropeT,
        labelEl,
        yearIndex,
        markerIndex,
      });
    });
  });

  // Posizione dell'ultimo marker sulla spirale (massimo spiralT)
  let lastMarkerSpiralT = 0;
  for (const m of markerObjects) {
    if (m.spiralT > lastMarkerSpiralT) {
      lastMarkerSpiralT = m.spiralT;
    }
  }
  if (lastMarkerSpiralT === 0) lastMarkerSpiralT = Math.max(0, turns - 0.5);

  // Estensione terminale della spirale oltre l'ultimo elemento per un unfold elegante
  const spiralTotalTurns = Math.max(turns, lastMarkerSpiralT + 0.85);

  /**
   * Calcola il punto sulla spirale tenendo conto dell'unfold terminale:
   * per t <= lastMarkerSpiralT rimane l'elica standard;
   * per t > lastMarkerSpiralT (il terminale dopo l'ultimo elemento), man mano che
   * unfoldFactor cresce [0 -> 1] con lo scroll, il tratto si raddrizza gradualmente
   * diventando perfettamente orizzontale e tangente sullo schermo, comunicando la fine dello scroll.
   */
  function spiralPoint(t: number, unfoldFactor = 0, out = new THREE.Vector3()) {
    if (unfoldFactor <= 0.0001 || t <= lastMarkerSpiralT) {
      return helixPoint(t, out);
    }
    const hX = RADIUS * Math.cos(t * Math.PI * 2);
    const hY = RADIUS * Math.sin(t * Math.PI * 2);
    const hZ = -t * PITCH;

    const tailLength = spiralTotalTurns - lastMarkerSpiralT;
    if (tailLength <= 0.0001) return out.set(hX, hY, hZ);

    const s = THREE.MathUtils.clamp((t - lastMarkerSpiralT) / tailLength, 0, 1);

    // Angolo di rotazione e quota Z effettiva del gruppo nel mondo
    const phi = group.rotation.z;
    const groupZ = group.position.z;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    // Posizione di partenza locale a t = lastMarkerSpiralT
    const theta0 = lastMarkerSpiralT * Math.PI * 2;
    const p0x = RADIUS * Math.cos(theta0);
    const p0y = RADIUS * Math.sin(theta0);
    const p0z = -lastMarkerSpiralT * PITCH;

    // Tangente iniziale locale rispetto al parametro s (C^1 continuous)
    const t0x = tailLength * (-2 * Math.PI * RADIUS * Math.sin(theta0));
    const t0y = tailLength * (2 * Math.PI * RADIUS * Math.cos(theta0));
    const t0z = tailLength * (-PITCH);

    // Posizione e tangente in coordinate WORLD (spazio schermo)
    const wP0x = p0x * cosPhi - p0y * sinPhi;
    const wP0y = p0x * sinPhi + p0y * cosPhi;
    const wP0z = p0z + groupZ;

    const wT0x = t0x * cosPhi - t0y * sinPhi;
    const wT0y = t0x * sinPhi + t0y * cosPhi;
    const wT0z = t0z;

    // Tangente finale in coordinate WORLD: perfettamente ORIZZONTALE (+X)
    const speed = Math.max(5.0, tailLength * 2 * Math.PI * RADIUS * 1.4);
    const wT1x = speed;
    const wT1y = 0;
    const wT1z = 0;

    // Target finale in coordinate WORLD
    const wP1x = wP0x + (wT0x + wT1x) * 0.55;
    const wP1y = wP0y + wT0y * 0.22;
    const wP1z = wP0z - 0.2 * tailLength * PITCH;

    // Spline cubica di Hermite nello spazio WORLD
    const s2 = s * s;
    const s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;

    const wUx = h00 * wP0x + h10 * wT0x + h01 * wP1x + h11 * wT1x;
    const wUy = h00 * wP0y + h10 * wT0y + h01 * wP1y + h11 * wT1y;
    const wUz = h00 * wP0z + h10 * wT0z + h01 * wP1z + h11 * wT1z;

    // Riconversione delle coordinate WORLD interpolate in coordinate locali del gruppo
    const uX = wUx * cosPhi + wUy * sinPhi;
    const uY = -wUx * sinPhi + wUy * cosPhi;
    const uZ = wUz - groupZ;

    return out.set(
      THREE.MathUtils.lerp(hX, uX, unfoldFactor),
      THREE.MathUtils.lerp(hY, uY, unfoldFactor),
      THREE.MathUtils.lerp(hZ, uZ, unfoldFactor),
    );
  }

  // Filo dell'elica/corda: linea continua, nessuna superficie/shading.
  const totalSegments = Math.ceil(Math.max(turns, spiralTotalTurns) * SEGMENTS_PER_TURN);
  const linePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= totalSegments; i++) linePoints.push(new THREE.Vector3());
  const lineGeometry = new THREE.BufferGeometry();
  function rebuildLinePoints(unfoldFactor = 0) {
    for (let i = 0; i <= totalSegments; i++) {
      if (shapeMode === 'spiral') {
        const t = (i / totalSegments) * spiralTotalTurns;
        spiralPoint(t, unfoldFactor, linePoints[i]);
      } else {
        const tau = i / totalSegments;
        ropeWirePoint(tau, linePoints[i]);
      }
    }
    lineGeometry.setFromPoints(linePoints);
    lineGeometry.computeBoundingSphere();
  }
  rebuildLinePoints(0);
  const lineMaterial = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.8 });
  applyNearFogFade(lineMaterial);
  const helixLine = new THREE.Line(lineGeometry, lineMaterial);
  helixLine.frustumCulled = false;
  group.add(helixLine);

  function getRopeCameraZ() {
    const halfFov = THREE.MathUtils.degToRad(ROPE_CAMERA_FOV) / 2;
    return THREE.MathUtils.clamp(
      ROPE_CAMERA_TARGET_WIDTH / (2 * Math.tan(halfFov) * (camera.aspect || 0.5)),
      ROPE_CAMERA_MIN_Z,
      ROPE_CAMERA_MAX_Z,
    );
  }

  function rebuildMarkerPositions() {
    for (const m of markerObjects) {
      m.t = shapeMode === 'spiral' ? m.spiralT : m.ropeT;
      shapePoint(m.t, m.visual.position);
      m.hitPlane.position.copy(m.visual.position);
    }
  }

  // Spirale: avvitamento, ruota e avanza lungo il proprio asse verso la
  // camera fissa. Durante l'unfold finale oltre l'ultimo elemento, il movimento
  // di avanzamento e rotazione del gruppo decelera morbidamente e si arresta
  // stabilmente all'assetto di arrivo (uAnchor), evitando che l'estremità orizzontale
  // continui a ruotare salendo verso l'alto o tagliandosi nel near-fade.
  // Corda: scorrimento ravvicinato che traccia la curva portando il punto attivo a (0,0).
  const tempRopePoint = new THREE.Vector3();
  function applyProgress(u: number) {
    if (shapeMode === 'spiral') {
      let groupU = u;
      const uUnfoldStart = Math.max(0, (lastMarkerSpiralT - 0.06) / turns);
      const uAnchor = Math.min(1.0, (lastMarkerSpiralT + 0.14) / turns);

      if (u > uUnfoldStart) {
        const rawP = (u - uUnfoldStart) / Math.max(0.001, 1.0 - uUnfoldStart);
        const p = THREE.MathUtils.clamp(rawP, 0, 1);
        // Decelerazione morbida (ease-out quadratico) verso l'assetto di atterraggio
        const easeP = 1 - Math.pow(1 - p, 2);
        groupU = uUnfoldStart + (uAnchor - uUnfoldStart) * easeP;
      }

      group.position.set(0, 0, groupU * totalLength);
      group.rotation.z = -groupU * turns * Math.PI * 2;
    } else {
      const t = u * turns;
      ropePoint(t, tempRopePoint);
      group.position.set(-tempRopePoint.x, -tempRopePoint.y, 0);
      group.rotation.z = 0;
    }
  }

  const savedMarkerId = sessionStorage.getItem('fields-target-marker');
  sessionStorage.removeItem('fields-target-marker');

  // Calcola eventuale progress target u [0, 1] per allineare la spirale al marker
  let initialProgress = 0;
  if (savedMarkerId) {
    const targetObj = markerObjects.find((m) => m.marker.id === savedMarkerId);
    if (targetObj) {
      // Inverti applyProgress per posizionare il marker a una distanza visibile naturale,
      // sull'asse attivo della modalità corrente (Z per la spirale, Y per la corda).
      const targetU =
        shapeMode === 'spiral'
          ? THREE.MathUtils.clamp(targetObj.spiralT / turns, 0, 1)
          : THREE.MathUtils.clamp(targetObj.ropeT / turns, 0, 1);
      initialProgress = targetU;
    }
  }

  const shouldPlayIntro = !savedMarkerId;

  const scrollState = { u: initialProgress };
  let scrollTrigger: ScrollTrigger | undefined;

  function stopIntroEarly() {
    if (introTimeline && isIntroPlaying) {
      introTimeline.kill();
      introTimeline = null;
      isIntroPlaying = false;
      symbolOpacityUniform.value = 1.0;
      group.scale.set(1, 1, 1);
      applyProgress(scrollState.u);
    }
  }

  function startScrollDriver() {
    scrollTrigger = ScrollTrigger.create({
      trigger: pinSection,
      pin: true,
      scrub: 1,
      start: 'top top',
      end: () => `+=${window.innerHeight * turns * 1.2}`,
      onUpdate: (self) => {
        if (isOpening || isTransitioning) return;
        if (isIntroPlaying) {
          if (self.progress > 0.005) {
            stopIntroEarly();
          } else {
            return;
          }
        }
        scrollState.u = self.progress;
        applyProgress(self.progress);
      },
    });

    if (savedMarkerId && scrollTrigger) {
      ScrollTrigger.refresh();
      const scrollDistance = scrollTrigger.end - scrollTrigger.start;
      const scrollPos = scrollTrigger.start + initialProgress * scrollDistance;
      window.scrollTo(0, scrollPos);
      scrollTrigger.scroll(scrollPos);
      scrollState.u = initialProgress;
      applyProgress(initialProgress);
    } else if (shouldPlayIntro) {
      window.scrollTo(0, 0);
    }
  }

  let currentFocusedMarker: MarkerObject | null = null;
  let focusTween: gsap.core.Tween | null = null;

  function stopAutoScroll() {
    if (focusTween) {
      focusTween.kill();
      focusTween = null;
    }
  }

  // Transizione morbida e morphing tra spirale e corda (3 fasi):
  // 1. Simboli 3D e testi (etichette DOM) in fade-out.
  // 2. Morphing continuo per-vertice della linea (Three.js BufferGeometry) + camera/fog e posizionamento gruppo verso il targetU del marker attivo.
  // 3. Simboli e testi riappaiono in fade-in nella nuova disposizione esattamente centrati sull'elemento di riferimento.
  function switchShapeMode(next: ShapeMode) {
    if (next === shapeMode || isTransitioning || isOpening) return;
    isTransitioning = true;
    stopAutoScroll();

    // Identifica l'elemento attualmente in focus (o più vicino al fuoco) prima del resize
    let refMarker = currentFocusedMarker;
    if (!refMarker) {
      const currentTurn = scrollState.u * turns;
      let minD = Infinity;
      for (const m of markerObjects) {
        const d = Math.abs(m.t - currentTurn);
        if (d < minD) {
          minD = d;
          refMarker = m;
        }
      }
    }
    if (!refMarker && markerObjects.length > 0) {
      refMarker = markerObjects[0];
    }

    const targetRefT = refMarker ? (next === 'spiral' ? refMarker.spiralT : refMarker.ropeT) : 0;
    const targetU = THREE.MathUtils.clamp(targetRefT / turns, 0, 1);

    // Coordinate per-vertice di partenza e arrivo per il morphing della linea
    const fromPoints: THREE.Vector3[] = [];
    const toPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= totalSegments; i++) {
      const pFrom = new THREE.Vector3();
      const pTo = new THREE.Vector3();
      const tSpiral = (i / totalSegments) * spiralTotalTurns;
      const tauRope = i / totalSegments;
      if (shapeMode === 'spiral') {
        spiralPoint(tSpiral, 0, pFrom);
        ropeWirePoint(tauRope, pTo);
      } else {
        ropeWirePoint(tauRope, pFrom);
        spiralPoint(tSpiral, 0, pTo);
      }
      fromPoints.push(pFrom);
      toPoints.push(pTo);
    }

    // Parametri iniziali e target di camera, fog e gruppo
    const startFov = camera.fov;
    const targetFov = next === 'spiral' ? CAMERA_FOV : ROPE_CAMERA_FOV;

    const startCameraZ = camera.position.z;
    const targetCameraZ = next === 'spiral' ? CAMERA_Z : getRopeCameraZ();

    const startFogNear = fog.near;
    const targetFogNear = next === 'spiral' ? PITCH * 1.8 : targetCameraZ + 10;
    const startFogFar = fog.far;
    const targetFogFar = next === 'spiral' ? totalLength * 0.85 : targetCameraZ + 30;

    const startNearFadeStart = nearFadeUniformsList[0]?.start.value ?? (shapeMode === 'spiral' ? NEAR_FADE_START : 1.0);
    const targetNearFadeStart = next === 'spiral' ? NEAR_FADE_START : 1.0;
    const startNearFadeClose = nearFadeUniformsList[0]?.close.value ?? (shapeMode === 'spiral' ? NEAR_FADE_CLOSE : 0.3);
    const targetNearFadeClose = next === 'spiral' ? NEAR_FADE_CLOSE : 0.3;

    const startGroupPos = group.position.clone();
    const startGroupRotZ = group.rotation.z;

    const targetGroupPos = new THREE.Vector3();
    let targetGroupRotZ = 0;
    if (next === 'spiral') {
      let groupU = targetU;
      const uUnfoldStart = Math.max(0, (lastMarkerSpiralT - 0.06) / turns);
      const uAnchor = Math.min(1.0, (lastMarkerSpiralT + 0.14) / turns);

      if (targetU > uUnfoldStart) {
        const rawP = (targetU - uUnfoldStart) / Math.max(0.001, 1.0 - uUnfoldStart);
        const p = THREE.MathUtils.clamp(rawP, 0, 1);
        const easeP = 1 - Math.pow(1 - p, 2);
        groupU = uUnfoldStart + (uAnchor - uUnfoldStart) * easeP;
      }

      targetGroupPos.set(0, 0, groupU * totalLength);
      targetGroupRotZ = -groupU * turns * Math.PI * 2;
    } else {
      const tempTarget = new THREE.Vector3();
      ropePoint(targetU * turns, tempTarget);
      targetGroupPos.set(-tempTarget.x, -tempTarget.y, 0);
      targetGroupRotZ = 0;
    }

    // FASE 1: Fade out simultaneo dei simboli e dei testi
    gsap.to(symbolOpacityUniform, {
      value: 0,
      duration: 0.25,
      ease: 'power2.out',
      onComplete: () => {
        // FASE 2: Morphing continuo della linea da spirale a corda (o viceversa) + camera/fog + gruppo
        const morphProgress = { value: 0 };
        gsap.to(morphProgress, {
          value: 1,
          duration: 0.65,
          ease: 'power2.inOut',
          onUpdate: () => {
            const p = morphProgress.value;

            // Interpolazione vertici linea
            for (let i = 0; i <= totalSegments; i++) {
              linePoints[i].lerpVectors(fromPoints[i], toPoints[i], p);
            }
            lineGeometry.setFromPoints(linePoints);
            lineGeometry.computeBoundingSphere();

            // Interpolazione prospettiva camera
            camera.fov = THREE.MathUtils.lerp(startFov, targetFov, p);
            camera.position.set(0, 0, THREE.MathUtils.lerp(startCameraZ, targetCameraZ, p));
            camera.updateProjectionMatrix();

            // Interpolazione fog & near fade
            fog.near = THREE.MathUtils.lerp(startFogNear, targetFogNear, p);
            fog.far = THREE.MathUtils.lerp(startFogFar, targetFogFar, p);
            for (const u of nearFadeUniformsList) {
              u.start.value = THREE.MathUtils.lerp(startNearFadeStart, targetNearFadeStart, p);
              u.close.value = THREE.MathUtils.lerp(startNearFadeClose, targetNearFadeClose, p);
            }

            // Interpolazione assetto del gruppo direttamente verso targetGroupPos/targetGroupRotZ
            group.position.lerpVectors(startGroupPos, targetGroupPos, p);
            group.rotation.z = THREE.MathUtils.lerp(startGroupRotZ, targetGroupRotZ, p);
          },
          onComplete: () => {
            // Geometria linea completata: imposta la nuova modalità e posiziona i marker
            shapeMode = next;
            rebuildMarkerPositions();
            rebuildLinePoints(0);

            scrollState.u = targetU;
            applyCameraForMode();
            applyProgress(targetU);

            // Sincronizza lo scrollTrigger e window.scrollY con il targetU
            const st = scrollTrigger;
            if (st && st.end > st.start) {
              const targetScroll = st.start + targetU * (st.end - st.start);
              window.scrollTo(0, targetScroll);
            }

            // FASE 3: Fade in dei simboli e dei testi nella nuova forma
            gsap.to(symbolOpacityUniform, {
              value: 1,
              duration: 0.3,
              ease: 'power2.in',
              onComplete: () => {
                isTransitioning = false;
              },
            });
          },
        });
      },
    });
  }

  function resize() {
    updateCanvasSize();

    const nextMode: ShapeMode = width < MOBILE_BREAKPOINT ? 'rope' : 'spiral';

    if (nextMode !== shapeMode) {
      if (isIntroPlaying) {
        stopIntroEarly();
      }
      switchShapeMode(nextMode);
    } else if (!isTransitioning && !isIntroPlaying) {
      applyCameraForMode();
      const st = scrollTrigger;
      if (st && st.end > st.start) {
        const targetScroll = st.start + scrollState.u * (st.end - st.start);
        window.scrollTo(0, targetScroll);
      }
      applyProgress(scrollState.u);
    }
  }
  window.addEventListener('resize', resize, { passive: true });
  ScrollTrigger.addEventListener('refresh', resize);

  if (shouldPlayIntro) {
    isIntroPlaying = true;
    symbolOpacityUniform.value = 0;
    startScrollDriver();

    introTimeline = gsap.timeline({
      onComplete: () => {
        isIntroPlaying = false;
        introTimeline = null;
        symbolOpacityUniform.value = 1.0;
        group.scale.set(1, 1, 1);
        scrollState.u = 0;
        applyProgress(0);
      },
    });

    if (shapeMode === 'spiral') {
      const startZ = -totalLength * 0.45;
      const startRotZ = Math.PI * 0.75;
      group.position.set(0, 0, startZ);
      group.rotation.z = startRotZ;

      introTimeline.to(
        group.position,
        {
          z: 0,
          duration: 1.6,
          ease: 'power2.out',
        },
        0,
      );
      introTimeline.to(
        group.rotation,
        {
          z: 0,
          duration: 1.6,
          ease: 'power2.out',
        },
        0,
      );
      introTimeline.to(
        symbolOpacityUniform,
        {
          value: 1.0,
          duration: 1.3,
          ease: 'power2.out',
        },
        0.15,
      );
    } else {
      // Corda mobile: risalita morbida dal passato fino al primo marker sul capo iniziale
      // della corda (anno 2026, t = 0), atterrando perfettamente su scrollState.u = 0.
      const MAX_INTRO_YEARS = 3;
      const introTurns = Math.min(turns, MAX_INTRO_YEARS);
      const startU = turns > 0 ? THREE.MathUtils.clamp(introTurns / turns, 0, 1) : 0;
      const targetU = 0.0;

      scrollState.u = startU;
      applyProgress(startU);

      // Scorrimento disteso e fluido (~1.35s per anno, totale ~4.0s su 3 anni)
      const flyDuration = Math.max(3.2, introTurns * 1.35);
      const flyProgress = { u: startU };

      introTimeline.to(
        flyProgress,
        {
          u: targetU,
          duration: flyDuration,
          ease: 'power1.inOut',
          onUpdate: () => {
            scrollState.u = flyProgress.u;
            applyProgress(flyProgress.u);
          },
        },
        0,
      );
      introTimeline.to(
        symbolOpacityUniform,
        {
          value: 1.0,
          duration: 1.0,
          ease: 'power2.out',
        },
        0.05,
      );
    }
  } else {
    isIntroPlaying = false;
    symbolOpacityUniform.value = 1.0;
    applyProgress(initialProgress);
    startScrollDriver();
  }

  window.addEventListener('wheel', stopAutoScroll, { passive: true });
  window.addEventListener('touchstart', stopAutoScroll, { passive: true });

  // Hover/tap sui marker: raycasting per il pannello di preview e per
  // il trigger della transizione di apertura.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function hitTest(clientX: number, clientY: number): MarkerObject | null {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hitPlanes = markerObjects.filter((m) => m.interactable).map((m) => m.hitPlane);
    const hits = raycaster.intersectObjects(hitPlanes);
    if (hits.length === 0) return null;
    return markerObjects.find((m) => m.hitPlane === hits[0].object) ?? null;
  }

  function onPointerMove(e: MouseEvent) {
    if (isOpening || isTransitioning) return;
    const hit = hitTest(e.clientX, e.clientY);
    canvas.style.cursor = hit ? 'pointer' : 'default';
  }
  canvas.addEventListener('mousemove', onPointerMove, { passive: true });

  /** Anima il marker cliccato fino a riempire lo schermo — vedi
   *  docs/brain/fields-spiral.md, "Transizione di apertura". Il filo
   *  dell'elica e gli altri marker restano fermi: solo la sagoma
   *  cliccata si ingrandisce e si avvicina alla camera. */
  function playOpenZoom(hit: MarkerObject): Promise<void> {
    return new Promise((resolve) => {
      gsap.to(hit.visual.scale, {
        x: 60,
        y: 60,
        z: 60,
        duration: OPEN_ZOOM_DURATION_MS / 1000,
        ease: 'power2.in',
      });
      // Convergenza verso la camera per colpire il centro dello schermo.
      const target =
        shapeMode === 'spiral'
          ? { x: 0, y: 0, z: CAMERA_Z - 0.2 }
          : { x: hit.visual.position.x, y: hit.visual.position.y, z: camera.position.z - 0.2 };
      gsap.to(hit.visual.position, {
        ...target,
        duration: OPEN_ZOOM_DURATION_MS / 1000,
        ease: 'power2.in',
        onComplete: () => resolve(),
      });
    });
  }

  function tryOpen(hit: MarkerObject) {
    if (isOpening || isTransitioning) return;
    stopAutoScroll();
    isOpening = true;
    onHoverMarker?.(null);
    onOpenMarker(hit.marker, () => playOpenZoom(hit));
  }

  function focusMarker(hit: MarkerObject) {
    if (!scrollTrigger || isOpening || isTransitioning) return;
    stopAutoScroll();
    const targetU = THREE.MathUtils.clamp(hit.t / turns, 0, 1);
    const targetScroll = scrollTrigger.start + targetU * (scrollTrigger.end - scrollTrigger.start);
    const scrollObj = { y: window.scrollY };

    focusTween = gsap.to(scrollObj, {
      y: targetScroll,
      duration: 0.7,
      ease: 'power2.out',
      onUpdate: () => {
        window.scrollTo(0, scrollObj.y);
      },
      onInterrupt: () => {
        focusTween = null;
      },
      onComplete: () => {
        focusTween = null;
      },
    });
  }

  function onClick(e: MouseEvent | TouchEvent) {
    if (isOpening || isTransitioning) return;
    if (isIntroPlaying) {
      stopIntroEarly();
      return;
    }
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const hit = hitTest(clientX, clientY);
    if (!hit) return;

    if (hit === currentFocusedMarker) {
      tryOpen(hit);
    } else {
      focusMarker(hit);
    }
  }

  canvas.addEventListener('click', onClick);

  // Collega click a ciascuna etichetta DOM creata (apre sempre direttamente)
  for (const m of markerObjects) {
    if (m.labelEl) {
      m.labelEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isOpening && !isTransitioning) tryOpen(m);
      });
    }
  }

  // Soglia di sfumatura oltre la quale un marker smette di essere
  // interagibile — vedi NEAR_FADE_* e docs/brain/fields-spiral.md.
  // Ricalcolata su CPU (solo per i marker, non per il filo) perché
  // l'hit-test non può leggere il fade calcolato nello shader.
  const HIT_TEST_DISABLE_FADE = 0.85;
  const viewSpacePosition = new THREE.Vector3();
  const worldSpacePosition = new THREE.Vector3();
  const projVector = new THREE.Vector3();

  function smoothstep(edge0: number, edge1: number, x: number) {
    const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  let frame = 0;
  let currentUnfoldFactor = -1;
  const groupQuatInverse = new THREE.Quaternion();
  function animate() {
    const currentProgress = scrollState.u;
    const currentTurnFocus = currentProgress * turns;
    const isRope = shapeMode === 'rope';
    const nearStart = isRope ? 1.0 : NEAR_FADE_START;
    const nearClose = isRope ? 0.3 : NEAR_FADE_CLOSE;

    // Aggiornamento unfold dinamico della parte terminale della spirale
    if (shapeMode === 'spiral' && !isTransitioning) {
      const unfoldStartU = Math.max(0, (lastMarkerSpiralT - 0.05) / turns);
      const rawProgress = (currentProgress - unfoldStartU) / Math.max(0.01, 1.0 - unfoldStartU);
      const unfoldProgress = THREE.MathUtils.clamp(rawProgress, 0, 1);
      const unfoldFactor = smoothstep(0, 1, unfoldProgress);

      if (Math.abs(unfoldFactor - currentUnfoldFactor) > 0.0005) {
        currentUnfoldFactor = unfoldFactor;
        const posAttr = lineGeometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i <= totalSegments; i++) {
          const t = (i / totalSegments) * spiralTotalTurns;
          spiralPoint(t, unfoldFactor, linePoints[i]);
          posAttr.setXYZ(i, linePoints[i].x, linePoints[i].y, linePoints[i].z);
        }
        posAttr.needsUpdate = true;
      }
    }

    let minMarker: MarkerObject | null = null;
    let minAbsDt = Infinity;

    // Billboard & Near Fog Depth check. I marker sono figli di `group`,
    // che ruota per animare l'avvitamento della spirale (vedi
    // applyProgress): impostare il quaternion locale al solo
    // quaternion camera farebbe comporre l'orientamento mondiale con
    // quello del gruppo, facendo ruotare visivamente i simboli insieme
    // alla spira invece di restarne indipendenti. Si annulla la
    // rotazione del gruppo premoltiplicando per la sua inversa, così
    // l'orientamento risultante nel mondo resta sempre quello (fisso)
    // della camera — i simboli non ruotano mai.
    groupQuatInverse.copy(group.quaternion).invert();
    for (const m of markerObjects) {
      m.visual.quaternion.copy(groupQuatInverse).multiply(camera.quaternion);
      m.hitPlane.quaternion.copy(m.visual.quaternion);

      // Stessa metrica di profondità usata nello shader (-mvPosition.z):
      // vale su qualunque bordo, non solo quello inferiore.
      m.hitPlane.getWorldPosition(worldSpacePosition);
      viewSpacePosition.copy(worldSpacePosition).applyMatrix4(camera.matrixWorldInverse);
      const depth = -viewSpacePosition.z;
      const fade = 1 - smoothstep(nearClose, nearStart, depth);
      m.interactable = fade < HIT_TEST_DISABLE_FADE;

      const absDt = Math.abs(currentTurnFocus - m.t);
      if (m.interactable && depth > 0.5 && absDt < minAbsDt) {
        minAbsDt = absDt;
        minMarker = m;
      }
    }

    if (minMarker && minAbsDt < 0.08) {
      currentFocusedMarker = minMarker;
    } else {
      currentFocusedMarker = null;
    }

    // Scala dinamica: ingrandimento fluido in concomitanza del focus
    if (!isOpening && !isTransitioning) {
      for (const m of markerObjects) {
        const absDt = Math.abs(currentTurnFocus - m.t);
        let scale = 1.0;
        if (absDt < 0.5) {
          if (m === minMarker && absDt < 0.08) {
            const activeFactor = 1 - smoothstep(0.0, 0.08, absDt);
            scale = 1.0 + 0.5 * (0.5 + 0.5 * activeFactor);
          } else {
            const adjFactor = 1 - smoothstep(0.01, 0.14, absDt);
            scale = 1.0 + 0.18 * adjFactor;
          }
        }
        m.visual.scale.set(scale, scale, scale);
      }
    }

    // Aggiornamento posizioni proiettate e opacità per i titoli dinamici
    if (labelsContainer) {
      type ActiveLabel = {
        m: MarkerObject;
        opacity: number;
        labelX: number;
        labelY: number;
        maxLabelW: number;
        yTransform: string;
        textAlign: 'left' | 'center' | 'right';
        box: { left: number; right: number; top: number; bottom: number };
        isFocus: boolean;
        absDt: number;
      };

      const activeLabels: ActiveLabel[] = [];

      for (const m of markerObjects) {
        if (!m.labelEl) continue;

        if (isOpening || isTransitioning || isIntroPlaying) {
          m.labelEl.style.opacity = '0';
          m.labelEl.style.pointerEvents = 'none';
          continue;
        }

        m.hitPlane.getWorldPosition(worldSpacePosition);
        viewSpacePosition.copy(worldSpacePosition).applyMatrix4(camera.matrixWorldInverse);
        const depth = -viewSpacePosition.z;

        const nearFade = 1 - smoothstep(nearClose, nearStart, depth);
        if (depth <= 0.5 || nearFade >= HIT_TEST_DISABLE_FADE) {
          m.labelEl.style.opacity = '0';
          m.labelEl.style.pointerEvents = 'none';
          continue;
        }

        const absDt = Math.abs(currentTurnFocus - m.t);
        const focusThreshold = 0.08;
        const neighborThreshold = isRope ? 0.14 : 0.15;

        let opacity = 0;
        if (absDt < neighborThreshold) {
          if (m === minMarker && absDt < focusThreshold) {
            // Marker attivo al punto focale: opacità 100%
            const activeFactor = 1 - smoothstep(0.0, focusThreshold, absDt);
            opacity = 0.5 + 0.5 * activeFactor;
          } else {
            // Marker vicini precedenti e successivi: opacità ridotta subordinata (~30-35%) con schiarimento progressivo
            const adjFactor = 1 - smoothstep(0.01, neighborThreshold - 0.01, absDt);
            opacity = 0.35 * adjFactor;
          }
        }

        if (opacity < 0.05) {
          m.labelEl.style.opacity = '0';
          m.labelEl.style.pointerEvents = 'none';
          continue;
        }

        projVector.copy(worldSpacePosition).project(camera);
        const screenX = (projVector.x * 0.5 + 0.5) * width;
        const screenY = (-projVector.y * 0.5 + 0.5) * height;

        if (isRope) {
          const isFocus = m === minMarker && absDt < focusThreshold;

          const yearIndex = Math.min(turns - 1, Math.floor(m.t));
          const dir = ropeDir(yearIndex);
          const r = ropeRadius[yearIndex] ?? 0;
          const straight = ropeRunDrawn[yearIndex] ?? ROPE_RUN_MIN;
          const length = ropeYearLength(yearIndex);
          const s = m.t - yearIndex;
          const d = s * length;

          const isOnCurve = d > straight && r > 0;
          let nx = 0;
          let ny = 1;

          if (isOnCurve) {
            // Sulla curva dell'ansa: normale analitica che punta all'interno del semicerchio / spazio aperto laterale
            const dTurn = d - straight;
            const alpha = THREE.MathUtils.clamp(dTurn / (Math.PI * r), 0, 1);
            const phi = alpha * Math.PI;
            nx = -dir * Math.sin(phi);
            ny = Math.cos(phi); // in coordinate schermo (Y down)
          } else {
            // Sul tratto orizzontale: alternanza stabile per indice marker (pari sopra, dispari sotto)
            const isBelow = m.markerIndex % 2 === 1;
            nx = 0;
            ny = isBelow ? 1 : -1;
          }

          // Distanza generosa per garantire completo respiro dalle punte delle sagome 3D
          const dist = isOnCurve ? 78 : 68;
          const targetX = screenX + nx * dist;
          const targetY = screenY + ny * dist;

          let yTransform: string;
          let textAlign: 'left' | 'center' | 'right';
          let maxLabelW: number;
          let finalX = targetX;
          let finalY = targetY;
          let boxLeft: number;
          let boxRight: number;
          let boxTop: number;
          let boxBottom: number;
          const estimatedH = 60;

          if (isOnCurve) {
            // Sulla curva: ancoraggio rigorosamente verso l'interno aperto del semicerchio (a sinistra o a destra)
            if (dir === 1) {
              // Curva sul lato destro -> testo esteso a SINISTRA verso l'interno vuoto
              maxLabelW = Math.min(190, Math.max(90, targetX - 16));
              yTransform = 'translate(-100%, -50%)';
              textAlign = 'right';
              boxLeft = targetX - maxLabelW;
              boxRight = targetX;
              boxTop = targetY - estimatedH / 2;
              boxBottom = targetY + estimatedH / 2;
            } else {
              // Curva sul lato sinistro -> testo esteso a DESTRA verso l'interno vuoto
              maxLabelW = Math.min(190, Math.max(90, width - targetX - 16));
              yTransform = 'translateY(-50%)';
              textAlign = 'left';
              boxLeft = targetX;
              boxRight = targetX + maxLabelW;
              boxTop = targetY - estimatedH / 2;
              boxBottom = targetY + estimatedH / 2;
            }
          } else {
            // Posizionamento verticale nello spazio aperto sopra o sotto la linea orizzontale
            maxLabelW = Math.min(200, Math.max(100, width - 32));
            const halfW = maxLabelW / 2;
            finalX = THREE.MathUtils.clamp(targetX, halfW + 16, Math.max(halfW + 16, width - halfW - 16));
            textAlign = 'center';

            if (ny >= 0) {
              // SOTTO
              yTransform = 'translate(-50%, 0)';
              boxLeft = finalX - halfW;
              boxRight = finalX + halfW;
              boxTop = targetY;
              boxBottom = targetY + estimatedH;
            } else {
              // SOPRA
              yTransform = 'translate(-50%, -100%)';
              boxLeft = finalX - halfW;
              boxRight = finalX + halfW;
              boxTop = targetY - estimatedH;
              boxBottom = targetY;
            }
          }

          activeLabels.push({
            m,
            opacity,
            labelX: finalX,
            labelY: finalY,
            maxLabelW,
            yTransform,
            textAlign,
            box: { left: boxLeft, right: boxRight, top: boxTop, bottom: boxBottom },
            isFocus,
            absDt,
          });
        } else {
          // Spirale: accanto al marker sulla destra (la spira curva verso l'interno)
          const labelX = screenX + 52;
          const labelY = screenY;
          const availableWidth = Math.max(100, width - labelX - 28);

          m.labelEl.style.textAlign = 'left';
          m.labelEl.style.padding = '';
          m.labelEl.style.backgroundColor = '';
          m.labelEl.style.borderRadius = '';
          m.labelEl.style.maxWidth = `${Math.min(220, availableWidth)}px`;
          m.labelEl.style.transform = `translate3d(${labelX.toFixed(1)}px, ${labelY.toFixed(1)}px, 0) translateY(-50%)`;
          m.labelEl.style.opacity = opacity.toFixed(2);
          m.labelEl.style.pointerEvents = opacity > 0.2 ? 'auto' : 'none';
        }
      }

      if (isRope) {
        // Ordina per priorità: prima il focus, poi chi è più vicino al focus in absDt
        activeLabels.sort((a, b) => {
          if (a.isFocus && !b.isFocus) return -1;
          if (!a.isFocus && b.isFocus) return 1;
          return a.absDt - b.absDt;
        });

        // Risoluzione collisioni tra etichette sulla corda
        const accepted: { left: number; right: number; top: number; bottom: number }[] = [];
        for (const item of activeLabels) {
          let collides = false;
          for (const b of accepted) {
            // Controllo sovrapposizione AABB con margine di respiro 14px
            if (
              item.box.left < b.right + 14 &&
              item.box.right > b.left - 14 &&
              item.box.top < b.bottom + 14 &&
              item.box.bottom > b.top - 14
            ) {
              collides = true;
              break;
            }
          }

          if (collides && !item.isFocus) {
            item.m.labelEl!.style.opacity = '0';
            item.m.labelEl!.style.pointerEvents = 'none';
            continue;
          }

          accepted.push(item.box);

          item.m.labelEl!.style.textAlign = item.textAlign;
          item.m.labelEl!.style.padding = '';
          item.m.labelEl!.style.backgroundColor = '';
          item.m.labelEl!.style.borderRadius = '';
          item.m.labelEl!.style.maxWidth = `${item.maxLabelW}px`;
          item.m.labelEl!.style.transform = `translate3d(${item.labelX.toFixed(1)}px, ${item.labelY.toFixed(1)}px, 0) ${item.yTransform}`;
          item.m.labelEl!.style.opacity = item.opacity.toFixed(2);
          item.m.labelEl!.style.pointerEvents = item.opacity > 0.2 ? 'auto' : 'none';
        }
      }
    }

    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }
  animate();

  return {
    destroy: () => {
      cancelAnimationFrame(frame);
      stopAutoScroll();
      introTimeline?.kill();
      window.removeEventListener('resize', resize);
      ScrollTrigger.removeEventListener('refresh', resize);
      window.removeEventListener('wheel', stopAutoScroll);
      window.removeEventListener('touchstart', stopAutoScroll);
      canvas.removeEventListener('mousemove', onPointerMove);
      canvas.removeEventListener('click', onClick);
      if (labelsContainer) {
        labelsContainer.innerHTML = '';
      }
      scrollTrigger?.kill();
      renderer.dispose();
    },
  };
}
