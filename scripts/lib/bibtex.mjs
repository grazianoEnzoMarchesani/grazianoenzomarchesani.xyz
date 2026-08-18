/**
 * Un parser BibTeX minimo, scritto per il formato che IRIS esporta
 * davvero (vedi references.bib), non per la specifica BibTeX completa.
 * Gestisce: valori multilinea, graffe annidate, campi duplicati (isbn
 * compare due volte in alcune voci). Non gestisce comandi LaTeX o
 * l'accento \'{e}: IRIS esporta già in UTF-8.
 */

/** @returns {{tipo: string, key: string, campi: Record<string, string | string[]>}[]} */
export function analizzaBibtex(testo) {
  const voci = [];
  let i = 0;
  const n = testo.length;

  while (i < n) {
    const chiocciola = testo.indexOf("@", i);
    if (chiocciola === -1) break;

    let j = chiocciola + 1;
    const inizioTipo = j;
    while (j < n && /[A-Za-z]/.test(testo[j])) j++;
    const tipo = testo.slice(inizioTipo, j).toLowerCase();

    while (j < n && /\s/.test(testo[j])) j++;
    if (testo[j] !== "{") {
      i = j;
      continue;
    }
    j++;

    const inizioCorpo = j;
    let profondita = 1;
    let k = j;
    while (k < n && profondita > 0) {
      if (testo[k] === "{") profondita++;
      else if (testo[k] === "}") profondita--;
      k++;
    }
    const corpo = testo.slice(inizioCorpo, k - 1);
    i = k;

    if (!tipo) continue;
    voci.push(analizzaCorpoVoce(tipo, corpo));
  }

  return voci;
}

function analizzaCorpoVoce(tipo, corpo) {
  let profondita = 0;
  let idx = 0;
  for (; idx < corpo.length; idx++) {
    const c = corpo[idx];
    if (c === "{") profondita++;
    else if (c === "}") profondita--;
    else if (c === "," && profondita === 0) break;
  }
  const key = corpo.slice(0, idx).trim();
  const resto = corpo.slice(idx + 1);

  const campi = {};
  let pos = 0;
  while (pos < resto.length) {
    while (pos < resto.length && /[\s,]/.test(resto[pos])) pos++;
    if (pos >= resto.length) break;

    const inizioNome = pos;
    while (pos < resto.length && /[A-Za-z0-9_]/.test(resto[pos])) pos++;
    const nome = resto.slice(inizioNome, pos).toLowerCase();
    if (!nome) break;

    while (pos < resto.length && /\s/.test(resto[pos])) pos++;
    if (resto[pos] !== "=") break;
    pos++;
    while (pos < resto.length && /\s/.test(resto[pos])) pos++;
    if (resto[pos] !== "{") break;
    pos++;

    let d = 1;
    const inizioValore = pos;
    while (pos < resto.length && d > 0) {
      if (resto[pos] === "{") d++;
      else if (resto[pos] === "}") d--;
      pos++;
    }
    const valoreGrezzo = resto.slice(inizioValore, pos - 1);
    const valore = pulisciValore(valoreGrezzo);

    if (campi[nome] !== undefined) {
      campi[nome] = Array.isArray(campi[nome]) ? [...campi[nome], valore] : [campi[nome], valore];
    } else {
      campi[nome] = valore;
    }
  }

  return { tipo, key, campi };
}

function pulisciValore(v) {
  return v
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
