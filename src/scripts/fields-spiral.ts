import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FIELD_CATEGORY_ORDER,
  type FieldCategory,
  type FieldMarker,
  type FieldYear,
} from '../data/fields';

gsap.registerPlugin(ScrollTrigger);

const INK = 0x1a1a19;
const PAPER = 0xf4f1ea;

const RADIUS = 2.2;
const PITCH = 3; // distanza lungo l'asse per un giro/anno completo
const SEGMENTS_PER_TURN = 64;
const CAMERA_Z = 5;

// Punto sull'elica: t in "giri" assoluti (0 = imboccatura/2026, cresce verso il passato).
function helixPoint(t: number, out = new THREE.Vector3()) {
  const angle = t * Math.PI * 2;
  return out.set(RADIUS * Math.cos(angle), RADIUS * Math.sin(angle), -t * PITCH);
}

/**
 * Sagome piene (non più solo contorno) — deciso in sessione di
 * `/grill-me` del 2026-08-18 insieme alla transizione di apertura (vedi
 * docs/brain/fields-spiral.md): la X resta un'eccezione, è una croce di
 * tratti, non un'area chiudibile, quindi resta due barre sottili invece
 * di una superficie.
 *
 * Geometria vettoriale vera (BufferGeometry), non una texture raster su
 * sprite: la texture canvas usata in origine si sarebbe sgranata allo
 * zoom-to-fill della transizione di apertura (una bitmap 128×128
 * ingrandita ~60×), lo stesso motivo per cui un raster zoomato perde
 * qualità mentre un vettore no.
 */
const MARKER_SIZE = 0.22;

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
const NEAR_FADE_START = 6.0; // profondità (world units) da cui inizia la dissolvenza
const NEAR_FADE_CLOSE = 2.0; // profondità da cui è completa

function applyNearFogFade(material: THREE.Material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPaperColor = { value: new THREE.Color(PAPER) };
    shader.uniforms.uNearFadeStart = { value: NEAR_FADE_START };
    shader.uniforms.uNearFadeClose = { value: NEAR_FADE_CLOSE };

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
      .replace('#include <common>', '#include <common>\nvarying float vNearFade;\nuniform vec3 uPaperColor;')
      .replace(
        '#include <fog_fragment>',
        '#include <fog_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uPaperColor, vNearFade );',
      );
  };
  material.needsUpdate = true;
}

function buildShapeMesh(category: FieldCategory): THREE.Object3D {
  const material = new THREE.MeshBasicMaterial({ color: INK, fog: true });
  applyNearFogFade(material);
  const r = MARKER_SIZE / 2;

  switch (category) {
    case 'research': // cerchio
      return new THREE.Mesh(new THREE.CircleGeometry(r, 32), material);
    case 'tools': // quadrato
      return new THREE.Mesh(new THREE.PlaneGeometry(MARKER_SIZE, MARKER_SIZE), material);
    case 'projects': {
      // triangolo
      const shape = new THREE.Shape();
      shape.moveTo(0, r);
      shape.lineTo(r * 0.9, -r * 0.7);
      shape.lineTo(-r * 0.9, -r * 0.7);
      shape.closePath();
      return new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
    }
    case 'teaching': {
      // X — due barre sottili incrociate, non un'area piena
      const group = new THREE.Group();
      const barLength = MARKER_SIZE * 1.3;
      const barThickness = MARKER_SIZE * 0.2;
      for (const angle of [Math.PI / 4, -Math.PI / 4]) {
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(barLength, barThickness), material);
        bar.rotation.z = angle;
        group.add(bar);
      }
      return group;
    }
  }
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
  timeline: FieldYear[];
  onHoverMarker: (marker: FieldMarker | null) => void;
  /** Click (desktop, su un marker in hover) o secondo tap sullo stesso
   *  marker (touch): avvia la transizione di apertura. `playZoom` esegue
   *  l'animazione 3D e risolve a zoom-to-fill completato — il chiamante
   *  la lancia in parallelo al fade-in dell'overlay ink. */
  onOpenMarker: (marker: FieldMarker, playZoom: () => Promise<void>) => void;
}): FieldsSpiralHandle {
  const { canvas, pinSection, timeline, onHoverMarker, onOpenMarker } = options;
  const turns = timeline.length;
  const totalLength = turns * PITCH;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAPER);
  scene.fog = new THREE.Fog(PAPER, PITCH * 1.5, totalLength * 0.85);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, CAMERA_Z);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const group = new THREE.Group();
  scene.add(group);

  // Filo dell'elica: linea continua, nessuna superficie/shading.
  const linePoints: THREE.Vector3[] = [];
  const totalSegments = turns * SEGMENTS_PER_TURN;
  for (let i = 0; i <= totalSegments; i++) {
    linePoints.push(helixPoint((i / totalSegments) * turns));
  }
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
  const lineMaterial = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.8 });
  applyNearFogFade(lineMaterial);
  const helixLine = new THREE.Line(lineGeometry, lineMaterial);
  group.add(helixLine);

  const hitPlaneGeometry = new THREE.PlaneGeometry(MARKER_SIZE * 1.4, MARKER_SIZE * 1.4);
  const hitPlaneMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const markerObjects: MarkerObject[] = [];

  timeline.forEach((yearData, yearIndex) => {
    const byCategory = new Map<FieldCategory, FieldMarker[]>();
    for (const marker of yearData.markers) {
      if (!byCategory.has(marker.category)) byCategory.set(marker.category, []);
      byCategory.get(marker.category)!.push(marker);
    }

    FIELD_CATEGORY_ORDER.forEach((category, catIndex) => {
      const markers = byCategory.get(category) ?? [];
      const sectorStart = catIndex / FIELD_CATEGORY_ORDER.length;
      const sectorSize = 1 / FIELD_CATEGORY_ORDER.length;

      markers.forEach((marker, i) => {
        const localTurn = sectorStart + ((i + 0.5) / Math.max(markers.length, 1)) * sectorSize;
        const t = yearIndex + localTurn;
        const position = helixPoint(t);

        const visual = buildShapeMesh(category);
        visual.position.copy(position);
        group.add(visual);

        const hitPlane = new THREE.Mesh(hitPlaneGeometry, hitPlaneMaterial);
        hitPlane.position.copy(position);
        group.add(hitPlane);

        markerObjects.push({ visual, hitPlane, marker, interactable: true });
      });
    });
  });

  function resize() {
    const width = pinSection.clientWidth;
    const height = pinSection.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Avvitamento: la spirale ruota e avanza lungo il proprio asse verso la camera fissa.
  function applyProgress(u: number) {
    group.position.z = u * totalLength;
    group.rotation.z = -u * turns * Math.PI * 2;
  }

  const introPlayed = sessionStorage.getItem('fields-intro-played') === '1';
  const startZ = -totalLength * 0.4;

  applyProgress(0);
  group.position.z += startZ;

  const scrollState = { u: 0 };
  let scrollTrigger: ScrollTrigger | undefined;
  let isOpening = false;

  function startScrollDriver() {
    scrollTrigger = ScrollTrigger.create({
      trigger: pinSection,
      pin: true,
      scrub: 1,
      start: 'top top',
      end: `+=${window.innerHeight * turns * 1.2}`,
      onUpdate: (self) => {
        if (isOpening) return;
        scrollState.u = self.progress;
        applyProgress(self.progress);
      },
    });
  }

  if (introPlayed) {
    applyProgress(0);
    startScrollDriver();
  } else {
    gsap.to(group.position, {
      z: 0,
      duration: 1.8,
      ease: 'power2.out',
      onComplete: () => {
        sessionStorage.setItem('fields-intro-played', '1');
        startScrollDriver();
      },
    });
  }

  // Hover/tap sui marker: raycasting per il pannello di preview e per
  // il trigger della transizione di apertura.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered: MarkerObject | null = null;
  let lastTappedMarkerId: string | null = null;

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

  function setHovered(hit: MarkerObject | null) {
    if (hit !== hovered) {
      hovered = hit;
      onHoverMarker(hit?.marker ?? null);
    }
  }

  /** Anima il marker cliccato fino a riempire lo schermo — vedi
   *  docs/brain/fields-spiral.md, "Transizione di apertura". Il filo
   *  dell'elica e gli altri marker restano fermi: solo la sagoma
   *  cliccata si ingrandisce e si avvicina alla camera.
   *
   *  La camera è ferma su (0,0,CAMERA_Z) e guarda l'origine: un marker
   *  che si limitasse ad avvicinarsi in z crescerebbe restando dov'era
   *  in x/y (se era decentrato sulla spira, resterebbe decentrato anche
   *  a piena scala). Per "colpire in faccia" lo spettatore deve invece
   *  convergere sull'asse ottico (x,y → 0) mentre si avvicina — il
   *  gruppo della spirale è fermo durante l'apertura (scroll bloccato,
   *  vedi isOpening), quindi la posizione LOCALE del marker coincide
   *  con quella nel mondo a meno della trasformazione rigida del
   *  gruppo, che non sposta l'asse z: portare x/y locali a 0 centra il
   *  marker sull'asse camera indipendentemente da dove si trovava sulla
   *  spira. */
  function playOpenZoom(hit: MarkerObject): Promise<void> {
    return new Promise((resolve) => {
      gsap.to(hit.visual.scale, {
        x: 60,
        y: 60,
        z: 60,
        duration: OPEN_ZOOM_DURATION_MS / 1000,
        ease: 'power2.in',
      });
      gsap.to(hit.visual.position, {
        x: 0,
        y: 0,
        z: CAMERA_Z - 0.2,
        duration: OPEN_ZOOM_DURATION_MS / 1000,
        ease: 'power2.in',
        onComplete: () => resolve(),
      });
    });
  }

  function tryOpen(hit: MarkerObject) {
    if (isOpening) return;
    isOpening = true;
    onHoverMarker(null);
    onOpenMarker(hit.marker, () => playOpenZoom(hit));
  }

  function onPointerMove(e: PointerEvent) {
    if (e.pointerType === 'touch' || isOpening) return;
    setHovered(hitTest(e.clientX, e.clientY));
  }
  function onPointerDown(e: PointerEvent) {
    if (e.pointerType !== 'touch' || isOpening) return;
    const hit = hitTest(e.clientX, e.clientY);
    if (hit && hit.marker.id === lastTappedMarkerId) {
      tryOpen(hit);
      return;
    }
    lastTappedMarkerId = hit?.marker.id ?? null;
    setHovered(hit);
  }
  function onClick(e: MouseEvent) {
    if (isOpening) return;
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) tryOpen(hit);
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('click', onClick);

  // Soglia di sfumatura oltre la quale un marker smette di essere
  // interagibile — vedi NEAR_FADE_* e docs/brain/fields-spiral.md.
  // Ricalcolata su CPU (solo per i marker, non per il filo) perché
  // l'hit-test non può leggere il fade calcolato nello shader.
  const HIT_TEST_DISABLE_FADE = 0.85;
  const viewSpacePosition = new THREE.Vector3();

  function smoothstep(edge0: number, edge1: number, x: number) {
    const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  let frame = 0;
  function animate() {
    // Billboard: ogni marker guarda sempre la camera (THREE.Sprite lo
    // faceva da solo, la geometria vettoriale no).
    for (const m of markerObjects) {
      m.visual.quaternion.copy(camera.quaternion);
      m.hitPlane.quaternion.copy(camera.quaternion);

      // Stessa metrica di profondità usata nello shader (-mvPosition.z):
      // vale su qualunque bordo, non solo quello inferiore.
      m.hitPlane.getWorldPosition(viewSpacePosition).applyMatrix4(camera.matrixWorldInverse);
      const depth = -viewSpacePosition.z;
      const fade = 1 - smoothstep(NEAR_FADE_CLOSE, NEAR_FADE_START, depth);
      m.interactable = fade < HIT_TEST_DISABLE_FADE;
    }
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }
  animate();

  return {
    destroy: () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('click', onClick);
      scrollTrigger?.kill();
      renderer.dispose();
    },
  };
}
