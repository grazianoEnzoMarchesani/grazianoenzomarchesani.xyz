import percorso from '../content/about/percorso.json';
import { profili } from './pubblicazioni';
import { inLingua } from './competenze';
import { type Lingua, linguaDefault } from '../i18n/testi';

export const identita = percorso.identita;

const bioEn = [
  'I am an architect and researcher at the School of Architecture and Design “Eduardo Vittoria”, University of Camerino, based in Ascoli Piceno. I work on urban microclimate, climate adaptation and the tools that make both measurable and usable.',
  'I measure real streets with thermal cameras, sensors and remote sensing, simulate design choices in ENVI-met and CFD, and write the software that turns those simulations into something a municipality or a design studio can actually use.',
  'Most of what I publish returns to the same question: what scale a city needs to be understood at before you can actually change it. The urban heat island of Ascoli Piceno, the Local Climate Zone maps of historic centres and the minimum urban units all come out of that question.',
  'My stable position is at the University of Camerino, in Ascoli Piceno, where I currently teach Materials and Technologies for industrial Design. I have also had the pleasure of teaching ENVI-met, Grasshopper and Ladybug Tools at other universities in Italy and abroad. The software I build is released open source.',
  'Before the research there was, and still is, video mapping: ten years of projections on abbeys, town halls and museums with the School of Architecture and Design.',
] as const;

const bioIt = [
  'Sono architetto e ricercatore alla Scuola di Ateneo di Architettura e Design “Eduardo Vittoria”, Università di Camerino, con sede ad Ascoli Piceno. Mi occupo di microclima urbano, adattamento climatico e degli strumenti che rendono entrambi misurabili e utilizzabili.',
  'Misuro le strade reali con termocamere, sensori e telerilevamento, simulo le scelte progettuali in ENVI-met e CFD, e scrivo il software che trasforma quelle simulazioni in qualcosa che un Comune o uno studio di progettazione può davvero usare.',
  'Gran parte di quello che pubblico torna alla stessa domanda: a che scala va capita una città prima di poterla davvero cambiare. L’isola di calore urbana di Ascoli Piceno, le mappe delle Local Climate Zone dei centri storici e le unità urbane minime nascono tutte da quella domanda.',
  'La mia sede stabile è l’Università di Camerino, ad Ascoli Piceno, dove insegno attualmente Materiali e Tecnologie per il Design Industriale. Ho avuto anche il piacere di insegnare ENVI-met, Grasshopper e Ladybug Tools in altre università italiane e internazionali. Il software che scrivo è rilasciato open source.',
  'Prima della ricerca c’era, e c’è ancora, il video mapping: dieci anni di proiezioni su abbazie, municipi e musei con la Scuola di Architettura e Design.',
] as const;

export function getBio(lingua: Lingua | string = linguaDefault): readonly string[] {
  return lingua === 'it' ? bioIt : bioEn;
}

export const bio = bioEn;

export const profiliRicerca = [
  { id: 'orcid', etichetta: 'ORCID', url: profili.orcid },
  { id: 'iris', etichetta: 'IRIS UNICAM', url: profili.iris },
  { id: 'github', etichetta: 'GitHub', url: profili.github },
] as const;

export const profiliSocial = [
  { id: 'linkedin', etichetta: 'LinkedIn', url: 'https://www.linkedin.com/in/grazianoenzomarchesani' },
  { id: 'instagram', etichetta: 'Instagram', url: 'https://www.instagram.com/vi.think/' },
] as const;

export const cv = {
  disponibile: false,
  url: '/cv-graziano-enzo-marchesani.pdf',
};

export function getPosizioni(lingua: Lingua | string = linguaDefault) {
  return percorso.posizioni.map((p) => ({
    ...p,
    titolo: inLingua(p.titolo, lingua),
    ente: inLingua(p.ente, lingua),
  }));
}

export function getFormazione(lingua: Lingua | string = linguaDefault) {
  return percorso.formazione.map((f) => ({
    ...f,
    titolo: inLingua(f.titolo, lingua),
    ente: inLingua(f.ente, lingua),
    esito: f.esito ? inLingua(f.esito, lingua) : undefined,
    tesi: f.tesi ? inLingua(f.tesi, lingua) : undefined,
  }));
}

export function getRiconoscimenti(lingua: Lingua | string = linguaDefault) {
  return percorso.riconoscimenti.map((r: any) => ({
    ...r,
    titolo: inLingua(r.titolo, lingua),
    ente: r.ente ? inLingua(r.ente, lingua) : undefined,
    progetto: r.progetto ? inLingua(r.progetto, lingua) : undefined,
    esito: r.esito ? inLingua(r.esito, lingua) : undefined,
  }));
}

export const posizioni = percorso.posizioni;
export const formazione = percorso.formazione;
export const riconoscimenti = percorso.riconoscimenti;
export const programmi = percorso.programmi;
