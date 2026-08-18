# Session log

← [index](index.md)

Log cronologico, append-only: una voce breve per sessione. Per lo stato attuale delle decisioni vedi [constraints.md](constraints.md), [stack.md](stack.md), [content-plan.md](content-plan.md), [design.md](design.md).

## 2026-08-18

- Avviato il progetto da zero. Definiti i vincoli fondamentali (responsive, velocità, estetica, nessuna limitazione tecnologica precostituita).
- Discusse le opzioni tecnologiche; chiariti MDX vs MD e la dipendenza di Bklit UI da React/shadcn.
- Decisioni stack fissate: Astro + TypeScript + MDX, React, Tailwind, GSAP/Lenis/Three.js, Content Collections, astro:assets, font self-hosted, deploy futuro su GitHub Pages.
- Fissata la regola: Claude non fa mai commit/push, solo l'utente.
- Installata la skill `grill-me`/`grilling` (pacchetto `mattpocock/skills`, 35 skill installate in `.agents/skills/` e `.claude/skills/`), testata con successo.
- Scaffolding Astro completato nella root del repo, con integrazioni React/Tailwind/MDX aggiunte e build verificata. `package.json` rinominato in `grazianoenzomarchesani-xyz`.
- Progettata (via sessione di grilling) e creata la struttura del second brain in `docs/brain/`, più la skill di manutenzione `update-brain` agganciata da `AGENTS.md`.
