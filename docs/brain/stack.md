# Stack tecnico

← [index](index.md)

Vedi [constraints.md](constraints.md) per i vincoli che hanno guidato queste scelte.

## Core

- **Astro** — framework principale, output statico. Gestisce le pagine e gli articoli come contenuti tipizzati.
- **TypeScript**.
- **MDX** per i contenuti — serve perché nelle pagine devono poter comparire componenti veri (grafici, embed video, immagini ottimizzate), non solo sintassi Markdown.

## UI framework

- **React**, adottato senza vincoli ideologici: se in futuro conviene altro, si cambia senza problemi. Necessario comunque per i grafici (vedi Bklit UI sotto, basato su shadcn/ui = React + Radix + Tailwind).

## Styling

- **Tailwind CSS**. Già installato e configurato (integrazione `@astrojs/react` + `@tailwindcss/vite` + `@astrojs/mdx` aggiunte allo scaffold). Necessario anche come dipendenza di shadcn/ui/Bklit.

## Animazioni

- **GSAP**, **Lenis**, **Three.js** — usati "alla bisogna" a seconda della sezione. L'utente li ha già usati in passato con buoni risultati.

## Contenuti

- **Astro Content Collections** (nativo). Nessun CMS esterno per ora.

## Immagini/performance

- **`astro:assets`** (Astro Image). Altri strumenti da valutare solo quando servono realmente.

## Font

- Variable fonts **self-hosted** (niente Google Fonts esterni).

## Grafici

- **Bklit UI** — registry shadcn/ui specializzato in chart. Installazione via CLI: `npx shadcn@latest add @bklit/<nome-componente>`. Richiede React (vedi sopra).

## Deploy

- **GitHub Pages**, quando il sito sarà pronto. L'utente ha un dominio personale proprio, attualmente puntato al vecchio sito, da ricollegare in futuro. Per ora: solo sviluppo locale.

## Stato dello scaffolding

Progetto Astro inizializzato nella root del repo il 2026-08-18, con integrazioni React/Tailwind/MDX già aggiunte e build verificata. `package.json` name: `grazianoenzomarchesani-xyz`.
