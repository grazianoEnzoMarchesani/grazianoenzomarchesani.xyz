# Vincoli fondamentali

← [index](index.md)

## Requisiti del sito (non negoziabili finché non ridiscussi qui)

- **Responsive completo**: desktop, smartphone, tablet.
- **Velocità estrema**: pochissimi caricamenti/reflow, performance prioritaria su tutto.
- **Estetica curata**: il sito deve essere visivamente accattivante, non anonimo. Ispirazione cercata attivamente online.
- **Nessuna limitazione tecnologica precostituita**: aperti a qualunque libreria (React incluso) purché coerente con Astro e con gli altri vincoli. Vedi [stack.md](stack.md).

## Regole operative

- **Claude non fa mai `git commit` né `git push`** su questo repo. Solo l'utente carica su GitHub, ad ogni milestone. Claude può modificare file, mostrare `git status`/`git diff`, ma si ferma prima dello staging/commit.
- **Deploy solo quando pronti**: per ora si lavora solo in locale con server di sviluppo. Il deploy su GitHub Pages avverrà quando il sito sarà pronto (vedi [stack.md](stack.md)).
