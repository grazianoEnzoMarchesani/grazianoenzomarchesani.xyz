import dati from '../content/skills/competenze.json';

export type Testo = { en: string; it?: string };

export function inLingua(testo: Testo, lingua: string = 'en'): string {
  if (lingua === 'it' && testo.it) return testo.it;
  return testo.en;
}

export const famiglie = [
  {
    id: 'calcolo',
    categorie: [1, 3, 4, 6],
    nome: {
      en: 'Computing & building tools',
      it: 'Calcolare e costruire strumenti',
    },
  },
  {
    id: 'ambiente',
    categorie: [2, 9],
    nome: {
      en: 'Measuring the environment',
      it: "Misurare l'ambiente",
    },
  },
  {
    id: 'racconto',
    categorie: [5, 7, 8, 10, 11],
    nome: {
      en: 'Representing & sharing',
      it: 'Rappresentare e condividere',
    },
  },
] as const;

export type Famiglia = (typeof famiglie)[number];

const assegnate = new Set(famiglie.flatMap((f) => [...f.categorie]));
for (const categoria of dati.categorie) {
  if (categoria.id !== 0 && !assegnate.has(categoria.id as never)) {
    throw new Error(
      `La categoria ${categoria.id} ("${categoria.nome.en}") non è assegnata ad alcuna famiglia. ` +
        `Aggiungila in src/lib/competenze.ts.`,
    );
  }
}

export function famigliaDi(categoria: number): Famiglia | undefined {
  return famiglie.find((f) => (f.categorie as readonly number[]).includes(categoria));
}

/** Nodo centrale 0 (Graziano Enzo Marchesani) */
export const sintesi = dati.competenze.find((c) => c.id === 0)!;

/**
 * 32 competenze (escluso nodo 0) con le relazioni di collegamento,
 * ordinate per categoria per mantenere adiacenti le famiglie nel mazzo.
 */
export function mazzoCompetenze(lingua: string = 'en') {
  const collegatiDi = new Map<number, Set<number>>();
  const aggiungi = (da: number, a: number) => {
    if (!collegatiDi.has(da)) collegatiDi.set(da, new Set());
    collegatiDi.get(da)!.add(a);
  };

  for (const l of dati.legami) {
    if (l.da === 0 || l.a === 0) continue;
    aggiungi(l.da, l.a);
    aggiungi(l.a, l.da);
  }

  return dati.competenze
    .filter((c) => c.id !== 0)
    .sort((a, b) => a.categoria - b.categoria || a.id - b.id)
    .map((c) => {
      const famiglia = famigliaDi(c.categoria);
      const categoria = dati.categorie.find((k) => k.id === c.categoria)!;
      return {
        id: c.id,
        nome: inLingua(c.nome, lingua),
        descrizione: inLingua(c.descrizione, lingua),
        categoria: inLingua(categoria.nome, lingua),
        idCategoria: c.categoria,
        famigliaId: famiglia?.id ?? 'calcolo',
        famigliaNome: famiglia ? inLingua(famiglia.nome, lingua) : '',
        collegati: [...(collegatiDi.get(c.id) ?? [])],
      };
    });
}

/**
 * Competenze raggruppate per famiglia e categoria per il glossario testuale esteso.
 */
export function perCategoria(lingua: string = 'en') {
  return famiglie.map((famiglia) => ({
    id: famiglia.id,
    nome: inLingua(famiglia.nome, lingua),
    categorie: famiglia.categorie.map((idCategoria) => {
      const categoria = dati.categorie.find((k) => k.id === idCategoria)!;
      return {
        id: idCategoria,
        nome: inLingua(categoria.nome, lingua),
        competenze: dati.competenze
          .filter((c) => c.categoria === idCategoria)
          .sort((a, b) => b.peso - a.peso)
          .map((c) => ({
            id: c.id,
            nome: inLingua(c.nome, lingua),
            descrizione: inLingua(c.descrizione, lingua),
            peso: c.peso,
          })),
      };
    }),
  }));
}

export const quante = {
  competenze: dati.competenze.length - 1,
  categorie: dati.categorie.length - 1,
  legami: dati.legami.length,
};
