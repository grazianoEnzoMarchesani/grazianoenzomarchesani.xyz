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
const CAMERA_Z = 4.2;
const CAMERA_FOV = 76; // Prospettiva grandangolare esasperata per effetto tunnel immersivo

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
const MARKER_SIZE = .27;

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
  /** Posizione angolare/di spira lungo l'elica (t in giri). */
  t: number;
  /** Elemento DOM del titolo dinamico fluttuante (se labelsContainer è presente). */
  labelEl?: HTMLButtonElement;
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
  const turns = timeline.length;
  const totalLength = turns * PITCH;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAPER);
  scene.fog = new THREE.Fog(PAPER, PITCH * 1.8, totalLength * 0.85);

  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
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

        markerObjects.push({ visual, hitPlane, marker, interactable: true, t, labelEl });
      });
    });
  });

  let width = pinSection.clientWidth;
  let height = pinSection.clientHeight;

  function resize() {
    width = pinSection.clientWidth;
    height = pinSection.clientHeight;
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

  const savedMarkerId = sessionStorage.getItem('fields-target-marker');
  sessionStorage.removeItem('fields-target-marker');

  // Calcola eventuale progress target u [0, 1] per allineare la spirale al marker
  let initialProgress = 0;
  if (savedMarkerId) {
    const targetObj = markerObjects.find((m) => m.marker.id === savedMarkerId);
    if (targetObj) {
      // Inverti applyProgress per posizionare il marker a una distanza visibile naturale (es. Z ~ 0 rispetto all'origine del gruppo)
      // t * PITCH è la distanza locale z del marker. group.position.z = u * totalLength.
      // Posizione Z nel mondo prima di rotazione/traslazione asse = -localZ + group.position.z
      // Per portare il marker vicino all'imboccatura/camera: u = -targetObj.visual.position.z / totalLength
      const targetU = THREE.MathUtils.clamp(-targetObj.visual.position.z / totalLength, 0, 1);
      initialProgress = targetU;
    }
  }

  const introPlayed = (sessionStorage.getItem('fields-intro-played') === '1') || !!savedMarkerId;
  const startZ = -totalLength * 0.4;

  applyProgress(initialProgress);
  if (!introPlayed) {
    group.position.z += startZ;
  }

  const scrollState = { u: initialProgress };
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

    if (initialProgress > 0 && scrollTrigger) {
      const scrollPos = scrollTrigger.start + initialProgress * (scrollTrigger.end - scrollTrigger.start);
      window.scrollTo(0, scrollPos);
    }
  }

  if (introPlayed) {
    applyProgress(initialProgress);
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

  let currentFocusedMarker: MarkerObject | null = null;
  let focusTween: gsap.core.Tween | null = null;

  function stopAutoScroll() {
    if (focusTween) {
      focusTween.kill();
      focusTween = null;
    }
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
    if (isOpening) return;
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
    stopAutoScroll();
    isOpening = true;
    onHoverMarker?.(null);
    onOpenMarker(hit.marker, () => playOpenZoom(hit));
  }

  function focusMarker(hit: MarkerObject) {
    if (!scrollTrigger || isOpening) return;
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
    if (isOpening) return;
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
        if (!isOpening) tryOpen(m);
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
  function animate() {
    const currentProgress = scrollState.u;
    const currentTurnFocus = currentProgress * turns;

    let minMarker: MarkerObject | null = null;
    let minAbsDt = Infinity;

    // Billboard & Near Fog Depth check
    for (const m of markerObjects) {
      m.visual.quaternion.copy(camera.quaternion);
      m.hitPlane.quaternion.copy(camera.quaternion);

      // Stessa metrica di profondità usata nello shader (-mvPosition.z):
      // vale su qualunque bordo, non solo quello inferiore.
      m.hitPlane.getWorldPosition(worldSpacePosition);
      viewSpacePosition.copy(worldSpacePosition).applyMatrix4(camera.matrixWorldInverse);
      const depth = -viewSpacePosition.z;
      const fade = 1 - smoothstep(NEAR_FADE_CLOSE, NEAR_FADE_START, depth);
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
    if (!isOpening) {
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
      for (const m of markerObjects) {
        if (!m.labelEl) continue;

        if (isOpening) {
          m.labelEl.style.opacity = '0';
          m.labelEl.style.pointerEvents = 'none';
          continue;
        }

        m.hitPlane.getWorldPosition(worldSpacePosition);
        viewSpacePosition.copy(worldSpacePosition).applyMatrix4(camera.matrixWorldInverse);
        const depth = -viewSpacePosition.z;

        const nearFade = 1 - smoothstep(NEAR_FADE_CLOSE, NEAR_FADE_START, depth);
        if (depth <= 0.5 || nearFade >= HIT_TEST_DISABLE_FADE) {
          m.labelEl.style.opacity = '0';
          m.labelEl.style.pointerEvents = 'none';
          continue;
        }

        const absDt = Math.abs(currentTurnFocus - m.t);

        let opacity = 0;
        if (absDt < 0.15) {
          if (m === minMarker && absDt < 0.08) {
            // Marker attivo al punto focale (ore 3): opacità 100%
            const activeFactor = 1 - smoothstep(0.0, 0.08, absDt);
            opacity = 0.5 + 0.5 * activeFactor;
          } else {
            // Marker vicini precedenti e successivi: opacità ridotta subordinata (~30-35%)
            const adjFactor = 1 - smoothstep(0.01, 0.14, absDt);
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

        const offsetX = 52;
        const labelX = screenX + offsetX;
        const labelY = screenY;
        const availableWidth = Math.max(100, width - labelX - 28);

        m.labelEl.style.maxWidth = `${Math.min(220, availableWidth)}px`;
        m.labelEl.style.transform = `translate3d(${labelX.toFixed(1)}px, ${labelY.toFixed(1)}px, 0) translateY(-50%)`;
        m.labelEl.style.opacity = opacity.toFixed(2);
        m.labelEl.style.pointerEvents = opacity > 0.2 ? 'auto' : 'none';
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
      window.removeEventListener('resize', resize);
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
