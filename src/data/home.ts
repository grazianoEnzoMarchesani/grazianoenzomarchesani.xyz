import { type Lingua, linguaDefault } from "../i18n/testi";

export type SezioneHome = {
  titolo: string;
  href: string;
};

export function getIdentita(lingua: Lingua | string = linguaDefault) {
  return {
    nome: "GRAZIANO ENZO MARCHESANI",
    ruolo:
      lingua === "it"
        ? "Architetto · Ricercatore · Dottore di Ricerca in Pianificazione Urbana Sostenibile"
        : "Architect · Researcher · PhD in Sustainable Urban Planning",
    affiliazione: "UNICAM SAAD — Ascoli Piceno",
  };
}

export function getSezioni(lingua: Lingua | string = linguaDefault): SezioneHome[] {
  const isIt = lingua === "it";
  return [
    { titolo: isIt ? "AMBITI" : "FIELDS", href: isIt ? "/it/fields" : "/fields" },
    { titolo: isIt ? "PUBBLICAZIONI" : "PUBLICATIONS", href: isIt ? "/it/publications" : "/publications" },
    { titolo: isIt ? "COMPETENZE" : "SKILLS", href: isIt ? "/it/skills" : "/skills" },
    { titolo: isIt ? "CHI SONO" : "ABOUT", href: isIt ? "/it/about" : "/about" },
  ];
}

// Compatibilità all'indietro per import diretti
export const identita = getIdentita('en');
export const sezioni = getSezioni('en');
