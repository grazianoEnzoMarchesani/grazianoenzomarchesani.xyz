/**
 * Sfondi decorativi delle sezioni home: prima venivano ricalcolati nel
 * browser a ogni caricamento pagina (nesting a spirale con canvas,
 * fino a 6000 tentativi di piazzamento per sezione — il vero costo era
 * lì). Ora sono SVG statici pregenerati a build time (vedi
 * scripts/generate-patterns.mjs) e serviti da /patterns/generated/:
 * qui non si calcola più nulla, si sceglie solo quale file già pronto
 * caricare. Fetch invece di import.meta.glob eager di proposito — con
 * 5 bucket × 4 varianti in bundle ogni visitatore si scaricherebbe
 * ~1MB di sfondi anche per le sezioni che non vede mai; con fetch ne
 * scarica solo i pochi file che il suo viewport sceglie davvero, e il
 * browser li mette in cache.
 */

type ManifestEntry = { bucket: string; w: number; h: number; variant: number; file: string };
type Manifest = { variantsPerBucket: number; entries: ManifestEntry[] };

const MANIFEST_URL = '/patterns/generated/manifest.json';

let manifestPromise: Promise<Manifest | null> | null = null;
function loadManifest(): Promise<Manifest | null> {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then((res) => (res.ok ? (res.json() as Promise<Manifest>) : null))
      .catch(() => null);
  }
  return manifestPromise;
}

const svgTextCache = new Map<string, Promise<string>>();
function loadSvgText(file: string): Promise<string> {
  let cached = svgTextCache.get(file);
  if (!cached) {
    cached = fetch(`/patterns/generated/${file}`).then((res) => res.text());
    svgTextCache.set(file, cached);
  }
  return cached;
}

function parseSvg(raw: string): { viewBox: string; inner: string } {
  const viewBoxMatch = raw.match(/viewBox="([^"]+)"/);
  return {
    viewBox: viewBoxMatch?.[1] ?? '0 0 100 100',
    inner: raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''),
  };
}

// Bucket più vicino per aspect ratio: le sezioni home sono sempre a
// piena altezza viewport (h-dvh), quindi il rapporto larghezza/altezza
// è ciò che conta per capire quanto lo slice di preserveAspectRatio
// dovrà tagliare — non le dimensioni assolute.
function pickBucket(entries: ManifestEntry[], W: number, H: number): string {
  const targetLogAspect = Math.log(W / H);
  let best = entries[0].bucket;
  let bestDiff = Infinity;
  for (const bucket of new Set(entries.map((e) => e.bucket))) {
    const ref = entries.find((e) => e.bucket === bucket)!;
    const diff = Math.abs(Math.log(ref.w / ref.h) - targetLogAspect);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = bucket;
    }
  }
  return best;
}

export async function initSectionPatterns() {
  const targets = Array.from(document.querySelectorAll<SVGSVGElement>('[data-pattern-bg]'));
  if (!targets.length) return;

  const manifest = await loadManifest();
  if (!manifest || manifest.entries.length === 0) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Offset casuale per lo sfasamento variante: stabile per la durata
  // della pagina (sezioni vicine restano diverse tra loro), ma cambia
  // a ogni reload così lo sfondo non è sempre lo stesso.
  const variantOffset = Math.floor(Math.random() * manifest.variantsPerBucket);

  await Promise.all(
    targets.map(async (svg, index) => {
      const rect = svg.getBoundingClientRect();
      const W = Math.max(1, Math.round(rect.width || window.innerWidth));
      const H = Math.max(1, Math.round(rect.height || window.innerHeight));

      const bucket = pickBucket(manifest.entries, W, H);
      const variant = ((index + variantOffset) % manifest.variantsPerBucket) + 1;
      const entry =
        manifest.entries.find((e) => e.bucket === bucket && e.variant === variant) ??
        manifest.entries.find((e) => e.bucket === bucket)!;

      const { viewBox, inner } = parseSvg(await loadSvgText(entry.file));
      svg.setAttribute('viewBox', viewBox);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      svg.innerHTML = inner;

      if (prefersReducedMotion) {
        svg.style.opacity = '1';
      } else {
        svg.style.transition = 'opacity 300ms ease';
        requestAnimationFrame(() => requestAnimationFrame(() => { svg.style.opacity = '1'; }));
      }
    })
  );
}
