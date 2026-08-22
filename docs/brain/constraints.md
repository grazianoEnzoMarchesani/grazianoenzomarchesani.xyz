# Vincoli fondamentali

← [index](index.md)

## Requisiti del sito (non negoziabili finché non ridiscussi qui)

- **Responsive completo**: desktop, smartphone, tablet.
- **Velocità estrema**: pochissimi caricamenti/reflow, performance prioritaria su tutto.
- **Estetica curata**: il sito deve essere visivamente accattivante, non anonimo. Ispirazione cercata attivamente online.
- **Nessuna limitazione tecnologica precostituita**: aperti a qualunque libreria (React incluso) purché coerente con Astro e con gli altri vincoli. Vedi [stack.md](stack.md).

## Deroghe decise consapevolmente

- **Grafici idratati** (2026-08-21): i grafici degli articoli di Fields sono isole React vere, non SVG generati al build. Costa ~130 kB gzip di JS sulle pagine che ne contengono uno, e questo confligge con "velocità estrema". Scelto comunque dall'utente, davanti al numero, per avere animazioni e tooltip veri. Mitigazioni obbligatorie: chunk dinamici per tipo di grafico, montaggio dietro `IntersectionObserver`, zero JS sugli articoli senza grafici. Vedi [blocchi-articoli.md](blocchi-articoli.md).
- **Nessuna dark mode**, confermato il 2026-08-21. I componenti di terze parti che la presuppongono (il tooltip di Bklit nasce scuro) vanno ribaltati sui token `ink`/`paper`, non accettati com'è.

## Regole operative

- **Claude non fa mai `git commit` né `git push`** su questo repo. Solo l'utente carica su GitHub, ad ogni milestone. Claude può modificare file, mostrare `git status`/`git diff`, ma si ferma prima dello staging/commit.
- **Deploy solo quando pronti**: per ora si lavora solo in locale con server di sviluppo. Il deploy su GitHub Pages avverrà quando il sito sarà pronto (vedi [stack.md](stack.md)).
- **Test su device reali = origin insicura**: raggiungere il dev server da telefono o da un altro computer significa usare `http://<IP-di-LAN>:<porta>`, che **non è un secure context**. Cache API, service worker, WebGPU e `crypto.subtle` sono lì indisponibili mentre su `localhost` funzionano. Ogni feature che li usa va scritta con una guardia a runtime (`typeof X !== 'undefined'`) e degradata, altrimenti si rompe solo fuori dalla macchina di sviluppo. Vedi il caso della ricerca semantica in [stack.md](stack.md).
- **Verificare in dev E in build, non solo in uno dei due.** Nella sessione del 2026-08-21 due bug esistevano solo in dev (preambolo React Fast Refresh assente, cache del content layer non invalidata) e uno solo navigando via ClientRouter invece che ricaricando: una verifica su `dist` li dichiarava tutti risolti mentre l'utente li vedeva. Riprodurre nello stesso modo in cui l'utente usa il sito.
- **Un bug riprodotto vale più di un bug ipotizzato**: `puppeteer` è già una devDependency; usarlo per pilotare il dev server e misurare (stato della UI, richieste di rete, numero di risultati) prima di toccare il codice, invece di ragionare sui sintomi riferiti.
- **L'informativa privacy descrive comportamenti reali, non intenzioni** (2026-08-22). Se cambia ciò che il sito fa verso terzi — un servizio in più, un dato in più, una finalità diversa — `src/data/privacy.ts` va aggiornato **nella stessa sessione**, non dopo. Un'informativa che dice il falso è peggio di un'informativa assente, ed è l'unico file del progetto che può diventare falso senza che nulla si rompa. Vedi [privacy.md](privacy.md).
- **I fatti su terzi si verificano alla fonte tecnica, non su una pagina web** (2026-08-22). L'utente ha indicato l'informativa privacy di UNICAM come fonte del fatto che la posta di ateneo giri su Google: quella pagina non menziona né la posta né Google Workspace. Il dato è stato confermato dai record MX del dominio (`dig +short MX unicam.it`), che sono pubblici, inequivocabili e riverificabili in tre secondi. Vale in generale: DNS, header di risposta e richieste di rete registrate dicono cosa succede davvero, una pagina istituzionale dice cosa qualcuno ha scritto una volta. Quando l'informativa dipende dal fatto, citare la fonte che regge.
- **Niente terze parti nel browser del visitatore senza consenso preventivo** (2026-08-22). Prima di aggiungere una libreria che carica qualcosa a runtime, verificare cosa contatta e quando: `lite-youtube-embed` sembrava innocuo e apriva connessioni verso DoubleClick al passaggio del mouse. Il dubbio si scioglie con Puppeteer che registra le richieste di rete, non leggendo il README.
- **Un'ottimizzazione senza numero prima/dopo non è un'ottimizzazione** (2026-08-21). Prima di dichiarare un guadagno di performance: misurare la baseline mettendo da parte le modifiche con `git stash`, misurare di nuovo, riportare la differenza. Le condizioni vanno rese realistiche o il collo di bottiglia non si vede — cache vuota e throttling di rete via CDP (`Network.clearBrowserCache` + `Network.emulateNetworkConditions`), mediana su più run. Utile anche ispezionare `dist/_astro/` dopo il build: gli `import` in cima ai chunk dicono quale codice sta aspettando quale, e il grafo reale ha smentito un'ipotesi in questa stessa sessione.
- **Ottimizzare senza toccare la resa** (2026-08-21). Quando l'utente dice che la qualità visiva va bene com'è, l'intervento è ammesso solo su rete, ordine di esecuzione e dimensione dei bundle. Durate di animazione, timing di comparsa, geometrie e colori restano invariati byte per byte, anche quando accorciarli sembrerebbe il modo più rapido di far sparire il sintomo: quasi sempre il tempo sta altrove (vedi il caso degli sfondi della home in [design.md](design.md), dove i 300ms di dissolvenza erano la coda di ~2.5s di rete).
