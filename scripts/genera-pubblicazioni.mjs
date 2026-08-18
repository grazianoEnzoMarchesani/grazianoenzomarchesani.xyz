/**
 * src/content/publications/references.bib → src/data/pubblicazioni.json
 * =======================================================================
 *
 * Ogni volta che references.bib cambia (nuovo export da IRIS), questo
 * script RICOSTRUISCE pubblicazioni.json da zero: non c'è una versione
 * "già pubblicata" che sopravvive fra un giro e l'altro. È una scelta
 * deliberata (DEC-76) — la alternativa, sommare solo le voci nuove,
 * rendeva impossibile correggere un errore già pubblicato senza mettere
 * le mani nel JSON generato.
 *
 * Quindi: pubblicazioni.json non si modifica mai a mano. Per correggere
 * qualcosa si scrive in src/content/publications/pubblicazioni.regole.json:
 *   - "escludi"  → questo record IRIS non deve comparire (tesi, tool
 *                  software che vivono già in /tools)
 *   - "tipo"     → come classificare un @misc, categoria ambigua per
 *                  definizione (default: "attivita")
 *   - "riviste"  → la forma corretta di un nome di rivista (IRIS esporta
 *                  tutto maiuscolo, e non tutte le riviste sono acronimi)
 *   - "campi"    → override puntuale di un campo per una voce (titolo,
 *                  autori, sede, anno): vince sempre sul calcolo automatico
 *
 * Ciò che NON viene dal .bib — la nota del dataset, il mio nome esatto,
 * i profili esterni — sta in src/content/publications/pubblicazioni.manuale.json.
 *
 * Gli autori sono normalizzati tramite src/content/publications/pubblicazioni.autori.json:
 * un cognome già visto vince sempre sulla grafia che arriva dal .bib
 * (così "Marchesani, GRAZIANO ENZO" diventa sempre "Marchesani G. E."),
 * le persone mai viste prima vengono imparate al volo — e quindi
 * corrette una volta sola, non ad ogni occorrenza.
 *
 * L'id di ogni voce è fissato per sempre in pubblicazioni.id.json (chiave
 * bibtex → id): senza, ricostruire da zero genererebbe uno slug nuovo e
 * più brutto ad ogni giro invece di riusare quello già scelto.
 *
 * NIENTE rete di sicurezza contro un .bib parziale (c'era, tolta in
 * DEC-77 su richiesta esplicita): se il file che scarichi da IRIS ha
 * meno voci, il sito ne ha meno subito dopo. È una scelta voluta, non
 * una svista — vedi DEC-77 in cervello/decisioni.md.
 *
 * Uso: `node scripts/genera-pubblicazioni.mjs` (anche via `npm run
 * pubblicazioni`). Si aggancia da sola a `astro dev` e `astro build`
 * tramite scripts/integrazione-pubblicazioni.mjs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analizzaBibtex } from "./lib/bibtex.mjs";

const qui = path.dirname(fileURLToPath(import.meta.url));
const radice = path.join(qui, "..");

export const percorsoBib = path.join(radice, "src/content/publications/references.bib");
const percorsoDati = path.join(radice, "src/data/pubblicazioni.json");
const percorsoManuale = path.join(radice, "src/content/publications/pubblicazioni.manuale.json");
const percorsoAutori = path.join(radice, "src/content/publications/pubblicazioni.autori.json");
const percorsoRegole = path.join(radice, "src/content/publications/pubblicazioni.regole.json");
const percorsoId = path.join(qui, "pubblicazioni.id.json");

const TIPO_DEFAULT = {
  article: "articolo",
  inbook: "capitolo",
  incollection: "capitolo",
  conference: "atti",
  inproceedings: "atti",
  book: "monografia",
};

const SEZIONI_VOCI = new Set(["articolo", "capitolo", "atti", "monografia"]);
const RANGO_TIPO = { monografia: 0, articolo: 0, capitolo: 1, atti: 2 };

function leggiJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/** Scrive con rename atomico: un lettore concorrente (il dev server che
 * si riavvia da solo su un cambio di file, un altro run dello script)
 * vede il file vecchio intero o quello nuovo intero, mai uno stato a
 * metà. Senza, una scrittura interrotta o sovrapposta lascia JSON
 * corrotto — è già successo una volta a pubblicazioni.id.json. */
function scriviJsonSeCambia(p, dati) {
  const nuovo = JSON.stringify(dati, null, 2) + "\n";
  const attuale = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
  if (nuovo === attuale) return false;
  const temp = `${p}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, nuovo);
  fs.renameSync(temp, p);
  return true;
}

function primo(v) {
  return Array.isArray(v) ? v[0] : v;
}

function chiaveCognome(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

function titleCasePersona(s) {
  return s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
}

function generaIniziali(nome) {
  const parole = nome.trim().split(/\s+/).filter(Boolean);
  if (!parole.length) return "";
  return parole
    .map((p) => {
      const lettera = p.replace(/[^\p{L}]/gu, "").charAt(0);
      return lettera ? lettera.toUpperCase() + "." : "";
    })
    .filter(Boolean)
    .join(" ");
}

function normalizzaAutore(persona, registro, nuovi) {
  const virgola = persona.indexOf(",");
  if (virgola === -1) return null;

  const parteA = persona.slice(0, virgola).trim();
  const parteB = persona.slice(virgola + 1).trim();

  const chiaveA = chiaveCognome(parteA);
  if (chiaveA && registro[chiaveA]) return registro[chiaveA];

  // IRIS a volte esporta "Nome, Cognome" invece di "Cognome, Nome" (capita
  // su singoli record, non su tutto il file): se leggere dritto non trova
  // nessuno ma leggere al contrario sì, vince chi è già in registro.
  const chiaveB = chiaveCognome(parteB);
  if (chiaveB && registro[chiaveB]) return registro[chiaveB];

  if (!chiaveA) return null;

  const cognome = titleCasePersona(parteA);
  const iniziali = generaIniziali(parteB);
  const forma = iniziali ? `${cognome} ${iniziali}` : cognome;
  registro[chiaveA] = forma;
  nuovi.push(forma);
  return forma;
}

function normalizzaAutori(campoAutori, registro, nuovi) {
  return campoAutori
    .split(/\s+and\s+/i)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => normalizzaAutore(p, registro, nuovi))
    .filter(Boolean)
    .join(", ");
}

function formattaPagine(raw) {
  if (!raw) return "";
  const pulito = primo(raw).replace(/-{2,}/g, "–").trim();
  if (!/\d/.test(pulito)) return "";
  if (/^0+–0+$/.test(pulito)) return "";
  return pulito;
}

function numeroDa(raw) {
  if (!raw) return "";
  const testo = primo(raw);
  const m = testo.match(/\d+/);
  return m ? m[0] : testo.trim();
}

function titleCaseRivista(s) {
  const minuscole = new Set(["e", "di", "la", "lo", "il", "and", "of", "in", "the", "for", "a", "an"]);
  return s
    .toLowerCase()
    .split(" ")
    .map((parola, i) => (i > 0 && minuscole.has(parola) ? parola : parola.charAt(0).toUpperCase() + parola.slice(1)))
    .join(" ");
}

/** I componenti grezzi di un articolo — usati sia per comporre `sede`
 * (il testo mostrato in pagina) sia per `fonte` (i campi separati che
 * servono a formattare la citazione in stili diversi). Un solo calcolo,
 * due usi, così non possono andare fuori sincrono fra loro. */
function partiArticolo(campi, riviste) {
  const rivistaGrezza = (primo(campi.journal) || "").trim();
  const rivista = riviste[rivistaGrezza.toUpperCase()] || titleCaseRivista(rivistaGrezza);
  const volume = numeroDa(campi.volume);
  const numero = numeroDa(campi.number);
  const pagine = formattaPagine(campi.pages);
  return { rivista, volume, numero, pagine };
}

function sedeArticolo({ rivista, volume, numero, pagine }) {
  const parti = [];
  if (volume) parti.push(numero ? `${volume}(${numero})` : volume);
  else if (numero) parti.push(`n. ${numero}`);

  let sede = parti.length ? `${rivista} ${parti.join(" ")}` : rivista;
  if (pagine) sede += `, ${pagine}`;
  return sede;
}

function partiCapitoloAtti(campi) {
  const raccolta = (primo(campi.booktitle) || "").trim();
  const editore = (primo(campi.publisher) || "").trim();
  const luogo = (primo(campi.address) || "").trim();
  const pagine = formattaPagine(campi.pages);
  return { raccolta, editore, luogo, pagine };
}

function sedeConBooktitle({ raccolta, editore, luogo, pagine }) {
  const editoreLuogo = [editore, luogo].filter(Boolean).join(", ");
  let sede = raccolta;
  if (editoreLuogo) sede += (sede ? ". " : "") + editoreLuogo;
  if (pagine) sede += `, ${pagine}`;
  return sede;
}

function partiMonografia(campi) {
  const editore = (primo(campi.publisher) || "").trim();
  const luogo = (primo(campi.address) || "").trim();
  return { editore, luogo };
}

/** Il DOI, quando non è nel campo `doi` ma solo dentro un `url` tipo
 * doi.org (capita spesso nei dataset, che IRIS esporta senza campo doi
 * dedicato). */
function doiDaUrl(raw) {
  if (!raw) return undefined;
  const m = primo(raw).match(/doi\.org\/(.+)$/i);
  return m ? m[1].trim() : undefined;
}

/** Toglie le stringhe vuote da un oggetto di parti, così `fonte` non
 * porta in giro chiavi vuote (es. capitoli senza `number`). */
function senzaVuoti(obj) {
  const pulito = {};
  for (const [k, v] of Object.entries(obj)) if (v) pulito[k] = v;
  return Object.keys(pulito).length ? pulito : undefined;
}

function slug(s) {
  const base = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base.length <= 60) return base;
  return base.slice(0, 60).replace(/-[^-]*$/, "");
}

function idUnivoco(base, idEsistenti) {
  let candidato = base || "voce";
  let n = 2;
  while (idEsistenti.has(candidato)) {
    candidato = `${base}-${n}`;
    n++;
  }
  idEsistenti.add(candidato);
  return candidato;
}

/** Calcola i campi di una voce a partire dal record .bib, prima di
 * applicare eventuali override. Pura (a parte l'apprendimento nel
 * registro autori): non legge né scrive file. Se `saltaAutori` è vero non
 * tocca il registro — serve quando un override sostituirà comunque il
 * campo autori, altrimenti la lettura sbagliata di un .bib disordinato
 * verrebbe imparata anche se poi scartata. */
export function calcolaVoce(categoria, campi, registro, riviste, nuoviAutori = [], saltaAutori = false) {
  const titolo = (primo(campi.title) || "").trim();
  const anno = parseInt(primo(campi.year), 10);
  const autori = saltaAutori ? undefined : normalizzaAutori(primo(campi.author) || "", registro, nuoviAutori);

  let sede;
  let fonte;
  if (categoria === "articolo") {
    const parti = partiArticolo(campi, riviste);
    sede = sedeArticolo(parti);
    fonte = senzaVuoti(parti);
  } else if (categoria === "capitolo" || categoria === "atti") {
    const parti = partiCapitoloAtti(campi);
    sede = sedeConBooktitle(parti);
    fonte = senzaVuoti(parti);
  } else if (categoria === "monografia") {
    const parti = partiMonografia(campi);
    sede = [parti.editore, parti.luogo].filter(Boolean).join(", ");
    fonte = senzaVuoti(parti);
  }

  const doi = (campi.doi ? primo(campi.doi) : undefined) || doiDaUrl(campi.url);

  return { titolo, anno, autori, sede, fonte, doi };
}

export function generaPubblicazioni({ log = true } = {}) {
  const testoBib = fs.readFileSync(percorsoBib, "utf8");
  const vociBib = analizzaBibtex(testoBib);

  const manuale = leggiJson(percorsoManuale, null);
  if (!manuale) throw new Error(`Manca ${percorsoManuale}`);

  const registro = leggiJson(percorsoAutori, {});
  registro.marchesani = manuale.io;

  const regole = leggiJson(percorsoRegole, { escludi: {}, tipo: {}, riviste: {}, campi: {} });
  const idFissati = leggiJson(percorsoId, {});
  const precedente = leggiJson(percorsoDati, null);

  const idEsistenti = new Set();
  const nuoviAutori = [];
  const scartate = [];
  const risultato = { voci: [], dataset: [], attivita: [] };

  for (const voceBib of vociBib) {
    const { tipo, key, campi } = voceBib;
    if (!key) continue;
    if (regole.escludi[key]) continue;

    let categoria = regole.tipo[key];
    if (!categoria) categoria = tipo === "misc" ? "attivita" : TIPO_DEFAULT[tipo];
    if (!categoria) {
      scartate.push(`${key} (@${tipo}): tipo non gestito — aggiungilo a "escludi" o "tipo" in pubblicazioni.regole.json`);
      continue;
    }

    const sezione = SEZIONI_VOCI.has(categoria) ? "voci" : categoria;
    const override = (regole.campi || {})[key] || {};

    const base = calcolaVoce(categoria, campi, registro, regole.riviste || {}, nuoviAutori, "autori" in override);
    const titolo = override.titolo ?? base.titolo;
    const anno = override.anno ?? base.anno;
    const autori = override.autori ?? base.autori;
    const sede = override.sede ?? base.sede;
    const doi = override.doi ?? base.doi;

    let id = idFissati[key]?.id;
    if (!id || idEsistenti.has(id)) id = idUnivoco(slug(titolo), idEsistenti);
    else idEsistenti.add(id);
    idFissati[key] = { sezione, id };

    const voce = { id };
    if (sezione === "voci") voce.tipo = categoria;
    voce.anno = anno;
    voce.titolo = titolo;
    voce.autori = autori;
    if (sede) voce.sede = sede;
    // `fonte` (i campi separati per le citazioni) vince solo se `sede`
    // non è stata sovrascritta a mano in pubblicazioni.regole.json: un
    // override tocca il testo composto, non i campi grezzi, e usare
    // comunque `fonte` produrrebbe una citazione diversa dalla sede
    // mostrata in pagina. In quel caso la citazione ricade sulla sede
    // intera, testo unico — vedi src/lib/citazioni.ts.
    if (base.fonte && !("sede" in override)) voce.fonte = base.fonte;
    if (doi) voce.doi = doi;

    risultato[sezione].push(voce);
  }

  risultato.voci.sort((a, b) => RANGO_TIPO[a.tipo] - RANGO_TIPO[b.tipo] || b.anno - a.anno);
  risultato.dataset.sort((a, b) => b.anno - a.anno);
  risultato.attivita.sort((a, b) => b.anno - a.anno);

  function costruisci(dataAggiornamento) {
    return {
      _nota: manuale._nota,
      aggiornato: dataAggiornamento,
      io: manuale.io,
      profili: manuale.profili,
      voci: risultato.voci,
      _notaDataset: manuale._notaDataset,
      dataset: risultato.dataset,
      _notaAttivita: manuale._notaAttivita,
      attivita: risultato.attivita,
    };
  }

  let finale = costruisci(precedente?.aggiornato ?? new Date().toISOString().slice(0, 10));
  if (precedente && JSON.stringify(finale) !== JSON.stringify(precedente)) {
    finale = costruisci(new Date().toISOString().slice(0, 10));
  }

  const datiCambiati = scriviJsonSeCambia(percorsoDati, finale);
  const idCambiati = scriviJsonSeCambia(percorsoId, idFissati);
  const registroCambiato = scriviJsonSeCambia(percorsoAutori, registro);

  if (log) {
    if (datiCambiati) {
      console.log(`[pubblicazioni] ricostruito: ${finale.voci.length} voci, ${finale.dataset.length} dataset, ${finale.attivita.length} attività.`);
    } else {
      console.log("[pubblicazioni] nessuna novità in references.bib.");
    }
    if (nuoviAutori.length) {
      console.log(`[pubblicazioni] nuovi autori imparati: ${[...new Set(nuoviAutori)].join(", ")}`);
    }
    if (scartate.length) {
      console.log("[pubblicazioni] voci ignorate:");
      for (const s of scartate) console.log(`  ? ${s}`);
    }
  }

  return { scartate, cambiato: datiCambiati || idCambiati || registroCambiato };
}

const invocatoDirettamente =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invocatoDirettamente) {
  try {
    generaPubblicazioni();
  } catch (errore) {
    console.error(`[pubblicazioni] ${errore.message}`);
    process.exit(1);
  }
}
