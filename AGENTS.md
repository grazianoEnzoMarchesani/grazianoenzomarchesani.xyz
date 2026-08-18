## Second brain

Prima di lavorare su questo progetto, leggi `docs/brain/index.md` e i file che linka: è la memoria persistente del progetto (vincoli, stack tecnico, piano contenuti, design, cronologia sessioni). Le decisioni lì dentro sono lo stato attuale — se una richiesta dell'utente le contraddice, segnalalo prima di procedere.

Alla fine di una sessione di lavoro sostanziale su questo progetto, usa la skill `update-brain` per riconciliare le decisioni prese con `docs/brain/` e aggiornare il log.

Nessun commit o push va mai eseguito su questo repo senza che sia l'utente stesso a farlo (vedi `docs/brain/constraints.md`).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
