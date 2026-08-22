/**
 * GENERATORE DI INDICE E EMBEDDING PER LA RICERCA SEMANTICA
 * =========================================================
 *
 * Estrae tutti i contenuti del sito (Research, Tools, Teaching, Projects,
 * Pubblicazioni, Competenze) in italiano e inglese, genera i metadati
 * e calcola i vettori di embedding (384 float normalizzati) usando
 * Xenova/all-MiniLM-L6-v2 a build-time.
 *
 * Salva il risultato in public/search-index.json per la ricerca client-side.
 */

import { existsSync, promises as fs } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import * as yaml from 'js-yaml';
import { pipeline } from '@xenova/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const contentDir = resolve(rootDir, 'src/content');
const dataDir = resolve(rootDir, 'src/data');
const publicDir = resolve(rootDir, 'public');
const targetFile = resolve(publicDir, 'search-index.json');
const manifestFile = resolve(rootDir, '.astro/search-index-manifest.json');

const SEPARATORE_CAMPO = /\s\$\$\$\s/;
const SEPARATORE_CORPO = /\r?\n[ \t]*\$\$\$[ \t]*\r?\n/;
const RIGA_CAMPO = /^([A-Za-z0-9_-]+):[ \t](.*)$/;
const RIGA_ARRAY = /^([ \t]*-[ \t]+)(.*)$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function spaccaFrontmatter(testo) {
  const righeEn = [];
  const righeIt = [];
  for (const riga of testo.split(/\r?\n/)) {
    const trovatoCampo = riga.match(RIGA_CAMPO);
    if (trovatoCampo) {
      const [, chiave, resto] = trovatoCampo;
      const parti = resto.split(SEPARATORE_CAMPO);
      righeEn.push(`${chiave}: ${parti[0]}`);
      righeIt.push(`${chiave}: ${parti.length === 2 ? parti[1] : parti[0]}`);
      continue;
    }

    const trovatoArray = riga.match(RIGA_ARRAY);
    if (trovatoArray) {
      const [, prefisso, resto] = trovatoArray;
      const parti = resto.split(SEPARATORE_CAMPO);
      righeEn.push(`${prefisso}${parti[0]}`);
      righeIt.push(`${prefisso}${parti.length === 2 ? parti[1] : parti[0]}`);
      continue;
    }

    righeEn.push(riga);
    righeIt.push(riga);
  }
  return { en: righeEn.join('\n'), it: righeIt.join('\n') };
}

function spaccaCorpo(testo) {
  const parti = testo.split(SEPARATORE_CORPO);
  return { en: parti[0].trim(), it: (parti[1] ?? parti[0]).trim() };
}

function pulisciMarkdown(md) {
  return md
    .replace(/<[^>]+>/g, '') // Rimuovi tag HTML/JSX
    .replace(/!\[.*?\]\(.*?\)/g, '') // Rimuovi immagini
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Rimuovi link mantenendo testo
    .replace(/#{1,6}\s+/g, '') // Rimuovi header
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Rimuovi grassetto
    .replace(/(\*|_)(.*?)\1/g, '$2') // Rimuovi corsivo
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Rimuovi code block
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Il DOI e' l'unica stringa del sito che identifica un contenuto in modo
 * univoco: chi lo incolla nella ricerca sa gia' cosa vuole. Va indicizzato
 * come campo a se', perche' un modello semantico su "10.1016/j.buildenv..."
 * non ha nulla da dire.
 */
function estraiDoi(valore) {
  if (typeof valore !== 'string') return '';
  const trovato = valore.match(/10\.\d{4,9}\/\S+/);
  return trovato ? trovato[0].replace(/[.,;)]+$/, '') : '';
}

async function calcolaHashCartella() {
  const hash = crypto.createHash('sha256');
  async function visita(dir) {
    if (!existsSync(dir)) return;
    const voci = await fs.readdir(dir, { withFileTypes: true });
    for (const v of voci) {
      const p = join(dir, v.name);
      if (v.isDirectory()) {
        await visita(p);
      } else if (v.isFile() && (v.name.endsWith('.mdx') || v.name.endsWith('.md') || v.name.endsWith('.json') || v.name.endsWith('.bib'))) {
        const buff = await fs.readFile(p);
        hash.update(p);
        hash.update(buff);
      }
    }
  }
  await visita(contentDir);
  await visita(dataDir);
  return hash.digest('hex');
}

export async function generaSearchIndex({ forza = false } = {}) {
  const hashAttuale = await calcolaHashCartella();

  if (!forza && existsSync(targetFile) && existsSync(manifestFile)) {
    try {
      const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf-8'));
      if (manifest.hash === hashAttuale) {
        return; // Indice già aggiornato, nessun lavoro da fare
      }
    } catch {
      // Ignora e rigenera
    }
  }

  console.log('[search] Generazione indice e calcolo embedding semantici in corso...');

  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  });

  const documenti = [];

  // 1. Collezione Fields: Research, Tools, Teaching, Projects
  const collezioniFields = [
    { nome: 'research', prefissoUrl: 'research', label: { en: 'Research', it: 'Ricerca' } },
    { nome: 'tools', prefissoUrl: 'tools', label: { en: 'Tools', it: 'Strumenti' } },
    { nome: 'teaching', prefissoUrl: 'teaching', label: { en: 'Teaching', it: 'Didattica' }, ignore: ['teaching-assistance', 'thesis-co-supervision'] },
    { nome: 'projects', prefissoUrl: 'projects', label: { en: 'Projects', it: 'Progetti' } },
  ];

  for (const col of collezioniFields) {
    const dir = join(contentDir, col.nome);
    if (!existsSync(dir)) continue;

    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (col.ignore && col.ignore.includes(e.name)) continue;
      let filepath = null;
      let slug = null;

      if (e.isDirectory()) {
        const mdxPath = join(dir, e.name, `${e.name}.mdx`);
        const mdPath = join(dir, e.name, `${e.name}.md`);
        if (existsSync(mdxPath)) {
          filepath = mdxPath;
          slug = e.name;
        } else if (existsSync(mdPath)) {
          filepath = mdPath;
          slug = e.name;
        }
      } else if (e.isFile() && (e.name.endsWith('.mdx') || e.name.endsWith('.md'))) {
        if (e.name === 'prova-articolo-completo.md') continue;
        filepath = join(dir, e.name);
        slug = e.name.replace(/\.(mdx|md)$/, '');
      }

      if (!filepath || !slug) continue;

      const testoGrezzo = await fs.readFile(filepath, 'utf-8');
      const corrispondenza = testoGrezzo.match(FRONTMATTER);
      if (!corrispondenza) continue;

      const [, fmGrezzo, corpoGrezzo] = corrispondenza;
      const frontmatter = spaccaFrontmatter(fmGrezzo);
      const corpo = spaccaCorpo(corpoGrezzo);

      for (const lingua of ['en', 'it']) {
        let meta = {};
        try {
          meta = yaml.load(frontmatter[lingua]) || {};
        } catch {
          continue;
        }

        const titolo = meta.titolo || meta.nome || slug;
        const sommario = meta.sommario || '';
        const tag = Array.isArray(meta.tag) ? meta.tag : Array.isArray(meta.ambiente) ? meta.ambiente : [];
        const corpoPulito = pulisciMarkdown(corpo[lingua]).slice(0, 500);

        const url = lingua === 'it' ? `/it/fields/${col.prefissoUrl}/${slug}` : `/fields/${col.prefissoUrl}/${slug}`;
        const testoPerEmbedding = `${titolo}. ${col.label[lingua]}. ${tag.join(', ')}. ${sommario}. ${corpoPulito}`;

        documenti.push({
          id: `${col.nome}/${slug}/${lingua}`,
          collezione: col.nome,
          categoria: col.label[lingua],
          slug,
          lingua,
          titolo,
          sommario,
          tag,
          autori: '',
          doi: estraiDoi(meta.fonteUrl) || estraiDoi(meta.fonte),
          url,
          testoPerEmbedding,
        });
      }
    }
  }

  // 2. Pubblicazioni (Voci, Software, Dataset, Attività)
  const filePubblicazioni = join(dataDir, 'pubblicazioni.json');
  if (existsSync(filePubblicazioni)) {
    try {
      const datiPub = JSON.parse(await fs.readFile(filePubblicazioni, 'utf-8'));
      const sezioniPub = [
        { lista: datiPub.voci || [], catEn: 'Publications', catIt: 'Pubblicazioni' },
        { lista: datiPub.software || [], catEn: 'Software', catIt: 'Software' },
        { lista: datiPub.dataset || [], catEn: 'Datasets & Reports', catIt: 'Dataset e Report' },
        { lista: datiPub.attivita || [], catEn: 'Dissemination', catIt: 'Divulgazione' },
      ];

      for (const sez of sezioniPub) {
        for (const pub of sez.lista) {
          if (!pub.id) continue;
          for (const lingua of ['en', 'it']) {
            const titolo = pub.titolo || '';
            const anno = pub.anno ? String(pub.anno) : '';
            const sede = pub.sede || pub.fonte?.rivista || pub.fonte?.libro || '';
            const autori = typeof pub.autori === 'string' ? pub.autori : Array.isArray(pub.autori) ? pub.autori.join(', ') : '';

            const url = lingua === 'it' ? `/it/publications#${pub.id}` : `/publications#${pub.id}`;
            const catNome = lingua === 'it' ? sez.catIt : sez.catEn;
            const testoPerEmbedding = `${titolo}. ${catNome} ${anno}. ${sede}. ${autori}.`;

            documenti.push({
              id: `pubblicazioni/${pub.id}/${lingua}`,
              collezione: 'publications',
              categoria: catNome,
              slug: pub.id,
              lingua,
              titolo,
              sommario: `${sede ? sede + ' ' : ''}(${anno}) — ${autori}`,
              tag: pub.tipo ? [pub.tipo] : [catNome],
              autori,
              doi: estraiDoi(pub.doi),
              url,
              testoPerEmbedding,
            });
          }
        }
      }
    } catch (e) {
      console.warn('[search] Errore lettura pubblicazioni:', e.message);
    }
  }

  // 3. Competenze / Skills
  const fileCompetenze = join(contentDir, 'skills/competenze.json');
  if (existsSync(fileCompetenze)) {
    try {
      const datiSkills = JSON.parse(await fs.readFile(fileCompetenze, 'utf-8'));
      for (const skill of (datiSkills.competenze || [])) {
        if (skill.id === 0) continue;
        const catObj = datiSkills.categorie?.find(c => c.id === skill.categoria);

        for (const lingua of ['en', 'it']) {
          const nome = skill.nome?.[lingua] || skill.nome?.en || '';
          const descr = skill.descrizione?.[lingua] || skill.descrizione?.en || '';
          const catNome = catObj?.nome?.[lingua] || catObj?.nome?.en || 'Skills';

          const url = lingua === 'it' ? `/it/skills#skill-${skill.id}` : `/skills#skill-${skill.id}`;
          const testoPerEmbedding = `${nome}. ${catNome}. ${descr}`;

          documenti.push({
            id: `skills/${skill.id}/${lingua}`,
            collezione: 'skills',
            categoria: lingua === 'it' ? 'Competenze' : 'Skills',
            slug: String(skill.id),
            lingua,
            titolo: nome,
            sommario: descr,
            tag: [catNome],
            autori: '',
            doi: '',
            url,
            testoPerEmbedding,
          });
        }
      }
    } catch (e) {
      console.warn('[search] Errore lettura competenze:', e.message);
    }
  }

  console.log(`[search] Calcolo vettori per ${documenti.length} documenti...`);

  // Calcola embedding per ciascun documento
  const index = [];
  for (const doc of documenti) {
    const output = await extractor(doc.testoPerEmbedding, { pooling: 'mean', normalize: true });
    // Arrotonda float a 4 cifre decimali per alleggerire il payload JSON
    const vettore = Array.from(output.data).map(v => Math.round(v * 10000) / 10000);

    index.push({
      id: doc.id,
      collezione: doc.collezione,
      categoria: doc.categoria,
      slug: doc.slug,
      lingua: doc.lingua,
      titolo: doc.titolo,
      sommario: doc.sommario,
      tag: doc.tag,
      // Omessi quando vuoti: moltiplicati per 300 documenti, due campi nulli
      // pesano piu' di quanto sembri su un indice che il visitatore scarica.
      ...(doc.autori ? { autori: doc.autori } : {}),
      ...(doc.doi ? { doi: doc.doi } : {}),
      url: doc.url,
      vettore,
    });
  }

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(targetFile, JSON.stringify(index), 'utf-8');

  await fs.mkdir(dirname(manifestFile), { recursive: true });
  await fs.writeFile(manifestFile, JSON.stringify({ hash: hashAttuale, count: index.length, timestamp: Date.now() }), 'utf-8');

  console.log(`[search] Indice generato con successo: ${index.length} voci salvate in public/search-index.json`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generaSearchIndex({ forza: process.argv.includes('--force') }).catch(console.error);
}
