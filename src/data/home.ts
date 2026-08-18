export const identita = {
  nome: "GRAZIANO ENZO MARCHESANI",
  ruolo: "Architect · Researcher · PhD in Sustainable Urban Planning",
  affiliazione: "UNICAM SAAD — Ascoli Piceno",
};

export type SezioneHome = {
  titolo: string;
  href: string;
};

export const sezioni: SezioneHome[] = [
  { titolo: "FIELDS", href: "/fields" },
  { titolo: "PUBLICATIONS", href: "/publications" },
  { titolo: "SKILLS", href: "/skills" },
  { titolo: "ABOUT", href: "/about" },
];
