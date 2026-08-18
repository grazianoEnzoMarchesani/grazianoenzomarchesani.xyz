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

function drawShapeTexture(category: FieldCategory): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.strokeStyle = '#1a1a19';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const c = size / 2;
  const r = size * 0.32;

  ctx.beginPath();
  switch (category) {
    case 'research': // cerchio
      ctx.arc(c, c, r, 0, Math.PI * 2);
      break;
    case 'tools': // quadrato
      ctx.rect(c - r, c - r, r * 2, r * 2);
      break;
    case 'teaching': // X
      ctx.moveTo(c - r, c - r);
      ctx.lineTo(c + r, c + r);
      ctx.moveTo(c + r, c - r);
      ctx.lineTo(c - r, c + r);
      break;
    case 'projects': // triangolo
      ctx.moveTo(c, c - r);
      ctx.lineTo(c + r, c + r * 0.7);
      ctx.lineTo(c - r, c + r * 0.7);
      ctx.closePath();
      break;
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

type MarkerObject = {
  sprite: THREE.Sprite;
  marker: FieldMarker;
};

export type FieldsSpiralHandle = {
  destroy: () => void;
};

export function initFieldsSpiral(options: {
  canvas: HTMLCanvasElement;
  pinSection: HTMLElement;
  timeline: FieldYear[];
  onHoverMarker: (marker: FieldMarker | null) => void;
}): FieldsSpiralHandle {
  const { canvas, pinSection, timeline, onHoverMarker } = options;
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
  const helixLine = new THREE.Line(lineGeometry, lineMaterial);
  group.add(helixLine);

  const shapeTextures = new Map(FIELD_CATEGORY_ORDER.map((c) => [c, drawShapeTexture(c)]));
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

        const material = new THREE.SpriteMaterial({
          map: shapeTextures.get(category),
          transparent: true,
          fog: true,
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.setScalar(0.22);
        group.add(sprite);

        markerObjects.push({ sprite, marker });
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
    group.rotation.z = u * turns * Math.PI * 2;
  }

  const introPlayed = sessionStorage.getItem('fields-intro-played') === '1';
  const startZ = -totalLength * 0.4;

  applyProgress(0);
  group.position.z += startZ;

  const scrollState = { u: 0 };

  function startScrollDriver() {
    ScrollTrigger.create({
      trigger: pinSection,
      pin: true,
      scrub: 1,
      start: 'top top',
      end: `+=${window.innerHeight * turns * 1.2}`,
      onUpdate: (self) => {
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

  // Hover/tap sui marker: raycasting per il pannello di preview.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered: MarkerObject | null = null;

  function pickAt(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(markerObjects.map((m) => m.sprite));
    if (hits.length === 0) {
      if (hovered) {
        hovered = null;
        onHoverMarker(null);
      }
      return;
    }
    const hit = markerObjects.find((m) => m.sprite === hits[0].object) ?? null;
    if (hit !== hovered) {
      hovered = hit;
      onHoverMarker(hit?.marker ?? null);
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (e.pointerType === 'touch') return;
    pickAt(e.clientX, e.clientY);
  }
  function onPointerDown(e: PointerEvent) {
    if (e.pointerType !== 'touch') return;
    pickAt(e.clientX, e.clientY);
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);

  let frame = 0;
  function animate() {
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
      renderer.dispose();
    },
  };
}
