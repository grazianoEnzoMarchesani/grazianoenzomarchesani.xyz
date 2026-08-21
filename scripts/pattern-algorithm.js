/**
 * Algoritmo di nesting a spirale per gli sfondi decorativi delle sezioni
 * home — stessa identica logica che viveva in src/scripts/section-patterns.ts,
 * ma pensata per girare dentro una pagina headless (Puppeteer) invece che
 * nel browser del visitatore: vedi scripts/generate-patterns.mjs, che la
 * inietta con page.addScriptTag() ed espone window.__generatePattern come
 * unico punto di ingresso. Nessun import/export (script "piatto" iniettato
 * via <script>), e il PRNG è seedabile — a differenza di Math.random() —
 * così ogni bucket/variante è riproducibile a comando invece di cambiare
 * a ogni rigenerazione.
 */
(function () {
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const ROTATIONS_DEG = [0, 45, 90, 135, 180, 225, 270, 315];
  const PRECISION = { thetaStep: 0.15, rStep: 1.4 };

  function parseViewBox(raw) {
    const m = raw.match(/viewBox="([^"]+)"/);
    const nums = (m ? m[1] : '0 0 100 100').trim().split(/\s+/).map(Number);
    return [nums[2] || 100, nums[3] || 100];
  }

  function innerMarkup(raw) {
    return raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  }

  // Le 4 icone sorgenti hanno un colore baked-in su un path interno
  // (style="fill:rgb(...)"), che sovrascrive il fill ereditato dal
  // <use> ancestor — invisibile finché il colore veniva comunque
  // "spento" da fill-opacity, ma ora che le forme sono a colore pieno
  // vincerebbe il nero originale invece del colore calcolato per il
  // piazzamento. fill:none (bounding box del clip-path) va preservato.
  function stripBakedFill(markup) {
    return markup.replace(/fill:(?!none)[^;"]+;?/gi, '').replace(/\sfill="(?!none)[^"]*"/gi, '');
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('impossibile caricare la forma'));
      img.src = src;
    });
  }

  function placementGeometry(vw, vh, s, thetaRad) {
    const cos = Math.cos(thetaRad), sin = Math.sin(thetaRad);
    const Cx = (vw * s) / 2, Cy = (vh * s) / 2;
    const corners = [[0, 0], [vw * s, 0], [vw * s, vh * s], [0, vh * s]];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    corners.forEach(([x, y]) => {
      const dx = x - Cx, dy = y - Cy;
      const rx = Cx + dx * cos - dy * sin;
      const ry = Cy + dx * sin + dy * cos;
      if (rx < minX) minX = rx; if (rx > maxX) maxX = rx;
      if (ry < minY) minY = ry; if (ry > maxY) maxY = ry;
    });
    return { minX, minY, maxX, maxY, Cx, Cy, cos, sin };
  }

  const workCanvas = document.createElement('canvas');
  const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });

  function rasterizeMask(shape, s, thetaRad, geo) {
    const bboxW = Math.max(1, Math.ceil(geo.maxX - geo.minX));
    const bboxH = Math.max(1, Math.ceil(geo.maxY - geo.minY));
    workCanvas.width = bboxW;
    workCanvas.height = bboxH;
    workCtx.setTransform(1, 0, 0, 1, 0, 0);
    workCtx.clearRect(0, 0, bboxW, bboxH);
    workCtx.save();
    workCtx.translate(-geo.minX, -geo.minY);
    workCtx.translate(geo.Cx, geo.Cy);
    workCtx.rotate(thetaRad);
    workCtx.translate(-geo.Cx, -geo.Cy);
    workCtx.drawImage(shape.img, 0, 0, shape.vb[0] * s, shape.vb[1] * s);
    workCtx.restore();

    const points = [];
    const data = workCtx.getImageData(0, 0, bboxW, bboxH).data;
    for (let i = 0, p = 0; i < bboxW * bboxH; i++, p += 4) {
      if (data[p + 3] > 30) points.push(i);
    }
    return { bboxW, bboxH, points };
  }

  function fits(occupancy, W, H, ax, ay, bboxW, bboxH, points) {
    if (ax < 0 || ay < 0 || ax + bboxW > W || ay + bboxH > H) return false;
    for (let k = 0; k < points.length; k++) {
      const i = points[k];
      const lx = i % bboxW, ly = (i / bboxW) | 0;
      if (occupancy[(ay + ly) * W + (ax + lx)]) return false;
    }
    return true;
  }

  function stamp(occupancy, W, ax, ay, bboxW, points) {
    for (let k = 0; k < points.length; k++) {
      const i = points[k];
      const lx = i % bboxW, ly = (i / bboxW) | 0;
      occupancy[(ay + ly) * W + (ax + lx)] = 1;
    }
  }

  function trySpiralPlacement(maskCache, cacheKey, shape, s, thetaRad, occupancy, W, H, cx, cy) {
    const geo = placementGeometry(shape.vb[0], shape.vb[1], s, thetaRad);
    const bboxW = Math.max(1, Math.ceil(geo.maxX - geo.minX));
    const bboxH = Math.max(1, Math.ceil(geo.maxY - geo.minY));
    if (bboxW > W || bboxH > H) return null;

    let cached = maskCache.get(cacheKey);
    if (!cached) {
      cached = rasterizeMask(shape, s, thetaRad, geo);
      maskCache.set(cacheKey, cached);
    }
    const { points } = cached;
    const maxR = Math.hypot(W, H);
    let theta = 0;

    while (true) {
      const r = PRECISION.rStep * theta;
      if (r > maxR) return null;
      const px = cx + r * Math.cos(theta);
      const py = cy + r * Math.sin(theta);
      const ax = Math.round(px - bboxW / 2);
      const ay = Math.round(py - bboxH / 2);

      if (fits(occupancy, W, H, ax, ay, bboxW, bboxH, points)) {
        stamp(occupancy, W, ax, ay, bboxW, points);
        const D = {
          x: geo.Cx - (geo.Cx * geo.cos - geo.Cy * geo.sin),
          y: geo.Cy - (geo.Cx * geo.sin + geo.Cy * geo.cos),
        };
        const tx = D.x + (ax - geo.minX);
        const ty = D.y + (ay - geo.minY);
        return { tx, ty, thetaDeg: (thetaRad * 180) / Math.PI, s };
      }
      theta += PRECISION.thetaStep;
    }
  }

  function runPass(rng, maskCache, occupancy, W, H, shapes, sizeMin, sizeMax, color, maxAttempts, maxConsecutiveFails, placed) {
    let fails = 0;
    for (let attempt = 0; attempt < maxAttempts && fails < maxConsecutiveFails; attempt++) {
      const shapeIndex = Math.floor(rng() * shapes.length);
      const shape = shapes[shapeIndex];
      const targetLong = Math.round((sizeMin + rng() * (sizeMax - sizeMin)) / 3) * 3;
      const s = targetLong / Math.max(shape.vb[0], shape.vb[1]);
      const angleDeg = ROTATIONS_DEG[Math.floor(rng() * ROTATIONS_DEG.length)];
      const thetaRad = (angleDeg * Math.PI) / 180;
      const cx = rng() * W, cy = rng() * H;
      const cacheKey = shapeIndex + '|' + targetLong + '|' + angleDeg;

      const result = trySpiralPlacement(maskCache, cacheKey, shape, s, thetaRad, occupancy, W, H, cx, cy);
      if (result) {
        placed.push(Object.assign({ shapeIndex, color }, result));
        fails = 0;
      } else {
        fails++;
      }
    }
  }

  async function generatePattern(opts) {
    const W = opts.W, H = opts.H, iconsRaw = opts.iconsRaw, seed = opts.seed;
    const bigColor = opts.bigColor, smallColor = opts.smallColor, patternInkColor = opts.patternInkColor;

    const shapes = await Promise.all(
      iconsRaw.map(async (raw) => ({
        vb: parseViewBox(raw),
        inner: stripBakedFill(innerMarkup(raw)),
        img: await loadImage('data:image/svg+xml;utf8,' + encodeURIComponent(raw)),
      }))
    );

    const rng = mulberry32(hashSeed(seed));
    const occupancy = new Uint8Array(W * H);
    const maskCache = new Map();
    const shortSide = Math.min(W, H);
    const isMobile = shortSide < 500;
    const bigAttempts = isMobile ? 250 : 600;
    const bigMaxFails = isMobile ? 35 : 80;
    const smallAttempts = isMobile ? 1200 : 6000;
    const smallMaxFails = isMobile ? 40 : 150;
    const placed = [];

    runPass(rng, maskCache, occupancy, W, H, shapes, shortSide * 0.22, shortSide * 0.34, 'big', bigAttempts, bigMaxFails, placed);
    runPass(rng, maskCache, occupancy, W, H, shapes, shortSide * 0.045, shortSide * 0.09, smallColor, smallAttempts, smallMaxFails, placed);

    // Pattern geometrici delicati per le forme grandi (passata big):
    // rimangono persistenti sia a riposo nelle sezioni sia durante il morphing.
    const patterns = `
      <pattern id="pat-0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="${bigColor}"/>
        <circle cx="10" cy="10" r="2" fill="${patternInkColor}"/>
      </pattern>
      <pattern id="pat-1" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="${bigColor}"/>
        <circle cx="6" cy="6" r="1.8" fill="${patternInkColor}"/>
        <circle cx="18" cy="18" r="1.8" fill="${patternInkColor}"/>
      </pattern>
      <pattern id="pat-2" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="${bigColor}"/>
        <line x1="0" y1="16" x2="16" y2="0" stroke="${patternInkColor}" stroke-width="1.5" stroke-linecap="square"/>
        <line x1="-4" y1="4" x2="4" y2="-4" stroke="${patternInkColor}" stroke-width="1.5" stroke-linecap="square"/>
        <line x1="12" y1="20" x2="20" y2="12" stroke="${patternInkColor}" stroke-width="1.5" stroke-linecap="square"/>
      </pattern>
      <pattern id="pat-3" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="${bigColor}"/>
        <line x1="0" y1="0" x2="16" y2="16" stroke="${patternInkColor}" stroke-width="1.5" stroke-linecap="square"/>
        <line x1="12" y1="-4" x2="20" y2="4" stroke="${patternInkColor}" stroke-width="1.5" stroke-linecap="square"/>
        <line x1="-4" y1="12" x2="4" y2="20" stroke="${patternInkColor}" stroke-width="1.5" stroke-linecap="square"/>
      </pattern>
    `;

    // Ogni forma è definita UNA volta in <defs> e richiamata con <use>
    // per ogni piazzamento: la seconda passata arriva a piazzare
    // migliaia di copie piccole, e duplicare il markup del path a ogni
    // copia gonfiava il file di ordini di grandezza (500KB+ a bucket)
    // per niente, dato che le 4 forme sono sempre le stesse 4.
    const defs = patterns + shapes.map((shape, i) => '<g id="s' + i + '">' + shape.inner + '</g>').join('');
    // Coordinate arrotondate prima di finire nel markup. Due motivi,
    // entrambi concreti: a piena precisione ogni <use> porta ~80
    // caratteri di cifre che non spostano niente (le unità sono viewBox,
    // 4 decimali sono ben sotto il subpixel a qualunque scala), e
    // l'accumulo di errore in virgola mobile produceva ogni tanto
    // notazione scientifica — `translate(1.4210854715202004e-14, 827.9)`
    // invece di `translate(0, 827.9)` — che chi rilegge questi transform
    // deve poi sapere interpretare (vedi NUM in src/scripts/section-morph.ts).
    // toFixed la elimina alla fonte.
    const n = (v) => +v.toFixed(4);
    const uses = placed
      .map(
        (p) => {
          const fill = p.color === 'big' ? 'url(#pat-' + p.shapeIndex + ')' : p.color;
          return '<use href="#s' + p.shapeIndex + '" transform="translate(' + n(p.tx) + ',' + n(p.ty) + ') rotate(' + n(p.thetaDeg) + ') scale(' + n(p.s) + ')" fill="' + fill + '"/>';
        }
      )
      .join('');

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '"><defs>' + defs + '</defs>' + uses + '</svg>';
  }

  window.__generatePattern = generatePattern;
})();
