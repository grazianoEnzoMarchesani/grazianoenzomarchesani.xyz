import percorso from '../content/about/percorso.json';
import { profili } from './pubblicazioni';

export const identita = percorso.identita;

export const bio = [
  'I am an architect and researcher at the School of Architecture and Design “Eduardo Vittoria”, University of Camerino, based in Ascoli Piceno. I work on urban microclimate, climate adaptation and the tools that make both measurable and usable.',
  'I measure real streets with thermal cameras, sensors and remote sensing, simulate design choices in ENVI-met and CFD, and write the software that turns those simulations into something a municipality or a design studio can actually use.',
  'Most of what I publish returns to the same question: what scale a city needs to be understood at before you can actually change it. The urban heat island of Ascoli Piceno, the Local Climate Zone maps of historic centres and the minimum urban units all come out of that question.',
  'My stable position is at the University of Camerino, in Ascoli Piceno, where I currently teach Materials and Technologies for industrial Design. I have also had the pleasure of teaching ENVI-met, Grasshopper and Ladybug Tools at other universities in Italy and abroad. The software I build is released open source.',
  'Before the research there was, and still is, video mapping: ten years of projections on abbeys, town halls and museums with the School of Architecture and Design.',
] as const;

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

export const posizioni = percorso.posizioni;
export const formazione = percorso.formazione;
export const riconoscimenti = percorso.riconoscimenti;
export const programmi = percorso.programmi;
