/**
 * Fonte unica per i due colori del sito (vedi --color-ink/--color-paper
 * in src/styles/global.css, che restano la fonte "di progetto" — questo
 * file esiste perché il CSS non è importabile da build script Node né
 * dal bundle browser, quindi i valori vanno tenuti allineati a mano tra
 * i due). Import diretto sia da generate-patterns.mjs (Node) sia da
 * src/scripts/section-morph.ts (bundle browser via Vite): evita che gli
 * hex finiscano ridigitati in più punti e divergano nel tempo.
 */

export const INK = '#1a1a19';
export const PAPER = '#ebf3ee';

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(rgb) {
  return '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
}

/**
 * Colore solido equivalente a "fg" disegnato con opacità `alpha` sopra
 * "bg" opaco — stesso risultato visivo della trasparenza attuale, ma
 * senza compositing: niente più somma quando due forme si sovrappongono.
 */
export function blendOver(alpha, fg = INK, bg = PAPER) {
  const [fr, fgc, fb] = hexToRgb(fg);
  const [br, bgc, bb] = hexToRgb(bg);
  return rgbToHex([alpha * fr + (1 - alpha) * br, alpha * fgc + (1 - alpha) * bgc, alpha * fb + (1 - alpha) * bb]);
}
