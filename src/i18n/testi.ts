/**
 * LE STRINGHE DI INTERFACCIA BILINGUE (EN / IT)
 * =============================================
 *
 * Tutte le etichette dell'interfaccia (menu, bottoni, filtri, sezioni)
 * sono centralizzate qui per garantire coerenza e zero dipendenze esterne.
 */

export const lingue = ['en', 'it'] as const;
export type Lingua = (typeof lingue)[number];
export const linguaDefault: Lingua = 'en';

export const etichetteLingua: Record<Lingua, string> = {
  en: 'EN',
  it: 'IT',
};

const en = {
  // Nav
  'nav.home': 'Home',
  'nav.fields': 'Fields',
  'nav.publications': 'Publications',
  'nav.skills': 'Skills',
  'nav.about': 'About',
  'nav.selettoreLingua': 'Change language',
  'nav.contatto': 'Get in touch',

  // Home
  'home.nome': 'Graziano Enzo Marchesani',
  'home.ruolo': 'Architect · PhD · Microclimate & Environmental Design',
  'home.affiliazione': 'University of Camerino',
  'home.vaiA': 'Go to',

  // Fields
  'fields.titolo': 'Fields',
  'fields.sottotitolo': 'Research, tools, teaching, and projects in urban microclimate & environmental design.',
  'fields.tutte': 'All',
  'fields.research': 'Research',
  'fields.tools': 'Tools',
  'fields.teaching': 'Teaching',
  'fields.projects': 'Projects',
  'fields.indietro': 'Back to Fields',
  'fields.successivo': 'Next',
  'fields.precedente': 'Previous',
  'fields.fonte': 'Source',
  'fields.lingua': 'Language',
  'fields.istituzione': 'Institution',
  'fields.luogo': 'Location',
  'fields.anni': 'Years',
  'fields.ruolo': 'Role',
  'fields.tipo': 'Type',
  'fields.esito': 'Outcome',
  'fields.sito': 'Website',
  'fields.repo': 'Repository',
  'fields.doi': 'DOI',
  'fields.licenza': 'License',
  'fields.ambiente': 'Environment',
  'fields.linguaggio': 'Language',
  'fields.nonTradotto': 'This article is currently available only in English.',

  // Publications
  'publications.titolo': 'Publications',
  'publications.sottotitolo': 'Peer-reviewed papers, conference proceedings, software releases, datasets, and research contributions.',
  'publications.filtro.tutti': 'All',
  'publications.copiaCitazione': 'Cite',
  'publications.copiato': 'Copied!',
  'publications.software': 'Software',
  'publications.datasets': 'Datasets & Reports',
  'publications.outreach': 'Dissemination & Outreach',
  'publications.peerReview': 'Peer Review',
  'publications.cerca': 'Search publications...',

  // About
  'about.titolo': 'About',
  'about.bio': 'Bio',
  'about.posizioni': 'Positions',
  'about.formazione': 'Education',
  'about.riconoscimenti': 'Awards & Competitions',
  'about.inCorso': 'Current',
  'about.scaricaCv': 'Download CV',

  // Skills
  'skills.titolo': 'Skills',
  'skills.sottotitolo': 'Interactive map of technical proficiencies, computational tools, and domain expertise.',
  'skills.vistaStack': 'Stack',
  'skills.vistaVentaglio': 'Fan',
  'skills.glossario': 'Glossary',

  // Search & Command Palette
  'search.apri': 'Search',
  'search.placeholder': 'Search research, tools, projects, publications...',
  'search.scorciatoia': '⌘K',
  'search.nessunRisultato': 'No matching results found.',
  'search.semanticaAttiva': 'Semantic vector search active',
  'search.caricamentoModello': 'Loading neural engine...',
  'search.chiudi': 'Close',
  'search.similarita': 'match',

  // Footer
  'footer.diritti': 'All rights reserved.',
  'footer.rss': 'RSS Feed',
} as const;

const it: Record<keyof typeof en, string> = {
  // Nav
  'nav.home': 'Home',
  'nav.fields': 'Ambiti',
  'nav.publications': 'Pubblicazioni',
  'nav.skills': 'Competenze',
  'nav.about': 'Chi sono',
  'nav.selettoreLingua': 'Cambia lingua',
  'nav.contatto': 'Contattami',

  // Home
  'home.nome': 'Graziano Enzo Marchesani',
  'home.ruolo': 'Architetto · Dottore di Ricerca · Microclima e Progettazione Ambientale',
  'home.affiliazione': 'Università di Camerino',
  'home.vaiA': 'Vai a',

  // Fields
  'fields.titolo': 'Ambiti',
  'fields.sottotitolo': 'Ricerca, strumenti, didattica e progetti in microclimatologia urbana e progettazione ambientale.',
  'fields.tutte': 'Tutti',
  'fields.research': 'Ricerca',
  'fields.tools': 'Strumenti',
  'fields.teaching': 'Didattica',
  'fields.projects': 'Progetti',
  'fields.indietro': 'Torna agli Ambiti',
  'fields.successivo': 'Successivo',
  'fields.precedente': 'Precedente',
  'fields.fonte': 'Fonte',
  'fields.lingua': 'Lingua',
  'fields.istituzione': 'Istituzione',
  'fields.luogo': 'Luogo',
  'fields.anni': 'Anni',
  'fields.ruolo': 'Ruolo',
  'fields.tipo': 'Tipo',
  'fields.esito': 'Esito',
  'fields.sito': 'Sito web',
  'fields.repo': 'Repository',
  'fields.doi': 'DOI',
  'fields.licenza': 'Licenza',
  'fields.ambiente': 'Ambiente',
  'fields.linguaggio': 'Linguaggio',
  'fields.nonTradotto': 'Questo articolo è attualmente disponibile solo in inglese.',

  // Publications
  'publications.titolo': 'Pubblicazioni',
  'publications.sottotitolo': 'Articoli peer-reviewed, atti di convegno, software, dataset e contributi di ricerca.',
  'publications.filtro.tutti': 'Tutte',
  'publications.copiaCitazione': 'Cita',
  'publications.copiato': 'Copiato!',
  'publications.software': 'Software',
  'publications.datasets': 'Dataset e Report',
  'publications.outreach': 'Divulgazione e Outreach',
  'publications.peerReview': 'Peer Review',
  'publications.cerca': 'Cerca nelle pubblicazioni...',

  // About
  'about.titolo': 'Chi sono',
  'about.bio': 'Bio',
  'about.posizioni': 'Posizioni',
  'about.formazione': 'Formazione',
  'about.riconoscimenti': 'Riconoscimenti e Concorsi',
  'about.inCorso': 'In corso',
  'about.scaricaCv': 'Scarica CV',

  // Skills
  'skills.titolo': 'Competenze',
  'skills.sottotitolo': 'Mappa interattiva di competenze tecniche, strumenti computazionali ed esperienza di dominio.',
  'skills.vistaStack': 'Pila',
  'skills.vistaVentaglio': 'Ventaglio',
  'skills.glossario': 'Glossario',

  // Search & Command Palette
  'search.apri': 'Cerca',
  'search.placeholder': 'Cerca tra ricerche, strumenti, progetti, pubblicazioni...',
  'search.scorciatoia': '⌘K',
  'search.nessunRisultato': 'Nessun risultato trovato.',
  'search.semanticaAttiva': 'Ricerca vettoriale semantica attiva',
  'search.caricamentoModello': 'Inizializzazione motore neurale...',
  'search.chiudi': 'Chiudi',
  'search.similarita': 'affinità',

  // Footer
  'footer.diritti': 'Tutti i diritti riservati.',
  'footer.rss': 'Feed RSS',
};

export type ChiaveTesto = keyof typeof en;

export function t(chiave: ChiaveTesto, lingua: Lingua | string = linguaDefault): string {
  const dizionario = lingua === 'it' ? it : en;
  return dizionario[chiave] ?? en[chiave] ?? chiave;
}

/**
 * Calcola l'URL corrispondente per il cambio lingua mantenendo il percorso.
 */
export function urlPerLingua(pathname: string, targetLingua: Lingua): string {
  // Normalizza path rimuovendo eventuale trailing slash salvo root
  const pulito = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  
  if (targetLingua === 'it') {
    if (pulito === '' || pulito === '/') return '/it';
    if (pulito.startsWith('/it')) return pulito;
    return `/it${pulito}`;
  } else {
    // targetLingua === 'en'
    if (pulito === '/it') return '/';
    if (pulito.startsWith('/it/')) return pulito.slice(3);
    return pulito || '/';
  }
}
