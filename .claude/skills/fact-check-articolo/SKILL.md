---
name: fact-check-articolo
description: Verifica e fact-checking di un articolo di Fields (src/content/research|tools|teaching|projects/<slug>/<slug>.mdx) contro il PDF sorgente in fieldsSketch/. Da usare quando l'utente dà il nome di un articolo e il PDF collegato e chiede di "verificare", "fare il fact checking", "controllare che sia tutto giusto", "rivedere per filo e per segno" un articolo prima di pubblicarlo. Controlla la versione italiana (la più completa): ogni numero, ogni percentuale, il dominio delle affermazioni, il frontmatter (data = data di pubblicazione del PDF, tag, titolo, sommario, fonte, fonteUrl), tutti i link, tutte le figure e tutti i blocchi ```grafico. Solo quando l'italiano è verificato per intero, produce la traduzione inglese (la metà sopra il separatore $$$). Use to fact-check a Fields article against its source PDF and only then fill in the English half.
---

# Fact-checking di un articolo di Fields contro il PDF sorgente

Gli articoli di Fields nascono da un PDF (in `fieldsSketch/`) tramite la skill
`paper-divulgativo-2`. Questa skill fa il passo dopo: **verifica l'articolo già
scritto riga per riga contro il PDF**, sistema quello che non torna, controlla
link e grafici, e **solo alla fine** riempie la metà inglese.

Non è una riscrittura. Se l'articolo è buono, quasi nulla cambia nel corpo
italiano: si correggono errori puntuali (un numero sbagliato, un link morto, una
figura citata dopo che è comparsa) e si segnala tutto all'utente.

**Le osservazioni sul paper vanno all'utente in chat, non nell'articolo.**
Incoerenze bibliografiche del paper, formulazioni originali ambigue, refusi degli
autori, classificazioni climatiche imprecise, "il paper non riporta gli scarti
numerici": tutto questo si scrive **nel rapporto in chat**, mai come nota nel
`.mdx`. Le note `[^n]` dell'articolo sono **solo per il lettore** — spiegano un
termine, aggiungono un dato di contorno utile a capire — non sono l'apparato
critico del revisore. Se una nota esistente è meta-commento, **rimuovila** (e
riporta il contenuto in chat); se un fatto della nota è davvero utile al lettore,
portalo nel corpo come prosa.

L'utente dà due cose: **lo slug dell'articolo** e **il nome del PDF**. Se manca
uno dei due, chiedilo.

Regole del progetto che valgono sempre: nessun commit e nessun push (li fa solo
l'utente). Leggi `docs/brain/blocchi-articoli.md` prima di toccare figure o
grafici — è la specifica della sintassi.

## Flusso

1. Localizzare articolo e PDF
2. Estrarre il materiale dal PDF
3. Leggere il paper davvero, figure comprese
4. Fact-check del corpo italiano, riga per riga
5. Verifica del frontmatter (data, tag, titolo, sommario, fonte, fonteUrl)
6. Verifica di tutti i link
7. Verifica di tutte le figure e di tutti i blocco ```grafico
8. Correggere e fare rapporto all'utente — **STOP, aspetta l'ok**
9. Solo dopo l'ok: tradurre in inglese

---

## 1. Localizzare articolo e PDF

L'articolo può stare in una qualsini delle quattro collection di Fields:

```
src/content/{research,tools,teaching,projects}/<slug>/<slug>.mdx
```

Cerca lo slug in tutte e quattro. Il PDF sta in `fieldsSketch/` (nome spesso
lungo, con un numero in testa: match sul frammento che l'utente dà).

Conferma all'utente il file `.mdx` e il PDF che hai trovato prima di procedere.

## 2. Estrarre il materiale dal PDF

Riusa lo script della skill sorella:

```bash
python ~/.claude/skills/paper-divulgativo-2/scripts/estrai_paper.py \
  "fieldsSketch/<paper>.pdf" -o /private/tmp/claude-501/.../scratchpad/factcheck-<slug>/estratti/
```

Produce `estratti/testo.txt`, `estratti/figure/p<pag>_<n>.png`,
`estratti/manifest.json`. Se non trova raster, le figure sono vettoriali:
`--rendi-pagine <n,n,n> --dpi 200`.

## 3. Leggere il paper

Leggi `testo.txt` per intero. **Guarda le figure come immagini**, non solo le
didascalie — servono per §7. Tieni una lista di:

- i 3–4 risultati numerici chiave (con unità, condizioni, orientamento, ora)
- il meccanismo causale e le **anomalie** (l'effetto col segno "sbagliato")
- le **incoerenze interne del paper** (segno invertito tra tabella e testo, un
  totale che non somma) — se l'articolo ne eredita una si corregge il corpo e si
  segnala **all'utente in chat**, non si aggiunge una nota nell'articolo
- **la data di pubblicazione del PDF** (anno del convegno / della rivista /
  copyright) e la **citazione bibliografica completa con DOI**
- setup e motori delle simulazioni, e la validazione sperimentale

## 4. Fact-check del corpo italiano

Metti il corpo italiano (sotto il `$$$`) accanto a `testo.txt` e controlla, una
affermazione alla volta:

- **ogni numero** corrisponde al paper — cifre, unità, ore, orientamenti,
  intervalli. La virgola decimale italiana (`4,7 °C`) non deve aver cambiato il
  valore.
- **ogni percentuale** è calcolata sulla stessa base del paper (Δ su quale
  riferimento?).
- **nessuna affermazione eccede il dominio testato**: un clima, un rapporto
  geometrico, una stagione, un'ora del giorno. Le generalizzazioni ("a ogni
  latitudine", "sempre") devono avere un aggancio nel paper.
- **il meccanismo causale** raccontato è quello del paper, non una
  semplificazione che ne cambia il senso.
- **le anomalie** che il paper riporta ci sono anche nell'articolo (spariscono
  facilmente in divulgazione).
- **le note a margine `[^n]`**: ogni numero di contorno o precisazione tecnica
  nella nota è verificato come il corpo. Ma la nota deve **servire al lettore**
  (spiegare un termine, dare un dato utile). Se è meta-commento sul paper
  (refusi, doppioni in bibliografia, "formulazione ambigua nell'originale",
  cavilli sulla classificazione di Köppen) **va rimossa** e il suo contenuto
  riportato nel rapporto in chat. Nel dubbio: meno note, più prosa nel corpo.
- **il blocco simulazioni** c'è, è completo (motori, cosa fa ciascuno,
  accoppiamento) e la validazione è raccontata — non tagliarlo mai.
- **glossario** (5–6 voci): ogni definizione è corretta e coerente con l'uso nel
  paper.

Annota ogni scostamento in una lista con: riga dell'`.mdx`, cosa dice
l'articolo, cosa dice il paper, pagina del paper.

## 5. Verifica del frontmatter

Controlla ogni campo contro il PDF:

- **`data`** — deve essere la **data di pubblicazione del PDF** (anno del
  convegno / fascicolo di rivista / copyright), non la data di stesura
  dell'articolo divulgativo. Se il PDF dà solo l'anno, usa `AAAA-01-01` e
  segnalalo. *(Nota: la skill `paper-divulgativo-2` usava qui la data di
  pubblicazione dell'articolo divulgativo — questa skill segue l'istruzione
  dell'utente: è la data del PDF. Segnala il cambiamento nel rapporto.)*
- **`tag`** (3–5) — ogni tag deve essere davvero un tema centrale dell'articolo,
  non incidentale. Riusa il vocabolario già in uso negli altri articoli della
  stessa collection (`grep -rh "^tag:" src/content/research/*/*.mdx` per
  l'elenco). I tag sono in inglese anche nella versione italiana. Segnala tag
  mancanti (un tema forte non taggato) e tag di troppo.
- **`titolo`** — le due lingue (`"EN" $$$ "IT"`) devono dire la stessa cosa e
  non promettere più di quanto l'articolo mantiene.
- **`sommario`** — ogni affermazione fattuale nel sommario (numeri compresi) è
  verificata come il corpo, in entrambe le lingue.
- **`fonte`** — titolo, sede/rivista, volume, anno, pagine corrispondono alla
  citazione del paper.
- **`fonteUrl`** — è il DOI o l'URL editoriale corretto (verifica in §6).

## 6. Verifica di tutti i link

Estrai **ogni** URL dall'`.mdx`: `fonteUrl` nel frontmatter, i link nel corpo
`[testo](url)`, i link nelle note `[^n]`, gli URL in "Riferimento bibliografico"
e "Disponibilità di dati e codice".

Per ognuno:

- **link esterni** — `WebFetch` (o `curl -sI`) e verifica: risponde 200 (non
  404, non un redirect a una home generica), e la pagina è davvero quella che il
  testo dice (il DOI porta *a quel* paper, non a un altro).
- **link interni** (`/it/fields/...`, `#ancora`) — il percorso deve esistere
  come route o come `<h2 id>` nello stesso file.
- **DOI** — forma `https://doi.org/10.xxxx/...`; risolve alla pagina editoriale
  giusta.

Elenca nel rapporto ogni link controllato con l'esito (ok / rotto / porta
altrove).

## 7. Figure e blocco ```grafico

Per **ogni** `![alt](images/figNN-....png "…")`:

- il file esiste in `<slug>/images/`
- la figura è **citata nel testo prima** di comparire ("…in **Figura N**")
- la didascalia è **autosufficiente** e **non inizia** con "Figura N" / "Fig. N"
  (l'etichetta la mette il CSS)
- la didascalia descrive davvero *quella* figura del paper (confronta con
  l'immagine estratta in `estratti/figure/`), incluse le condizioni (ora,
  scenario, stagione)
- l'`alt` è descrittivo (serve a screen reader e miniatura)
- la numerazione è progressiva nell'ordine del documento (non serve scriverla:
  verifica solo che i richiami nel testo siano coerenti tra loro)
- il taglio (`@wide`/`@side`/`@inset`/`@full` o automatico) è sensato per le
  proporzioni dell'immagine

Per **ogni** blocco ```grafico:

- il YAML è valido (lo valida `remark-articolo.ts` al build — vedi sotto)
- i dati corrispondono alla figura/tabella del paper da cui vengono: **stessi
  valori ai punti chiave, stesso andamento, stessa posizione di picchi e
  minimi, stessi ordini di grandezza**
- testo del grafico (`titoloX`, `titoloY`, `etichetta`, categorie X) in inglese;
  `titoloY` con l'unità di misura
- la `didascalia` è in italiano e dichiara che i valori sono letti dal grafico
  del paper
- monocromo, serie distinte per forma (pieno / `tratteggio: "5,4"` / toni
  `--chart-*`), mai per colore

Verifica visiva obbligatoria dei grafici:

```bash
npx astro build          # deve passare: valida lo YAML di ogni blocco
npx astro preview --port 4400 &
node .claude/skills/grafico-da-immagine/scripts/verifica-grafico.mjs \
  http://localhost:4400/it/fields/<collection>/<slug>/ /tmp/verifica-<slug>
npx astro preview stop
```

Confronta ogni screenshot in `/tmp/verifica-<slug>/` con l'immagine originale
della figura in `estratti/figure/`. Se un grafico nativo **non combacia
fedelmente** con l'originale: sostituiscilo con l'immagine
`![...](images/figNN.png "…")` (estrai il ritaglio dal PDF) e segnalalo.

## 8. Correggere e fare rapporto — poi STOP

Applica le correzioni **puntuali** al corpo italiano e al frontmatter. Non
riscrivere paragrafi che sono corretti.

Se il **paper è internamente incoerente** e l'articolo ne ha ereditato una
versione: riformula la grandezza in modo non ambiguo **nel corpo** e spiega
all'utente in chat cosa dice l'originale e perché hai scelto quella lettura.
Niente footnote di rimando alla formulazione originale — è materia da rapporto,
non da articolo.

**Rimuovi dall'articolo ogni nota `[^n]` che è meta-commento** (osservazioni sul
paper, non sul tema) e travasa il contenuto nel rapporto. Se un dato della nota
serve al lettore, portalo nel corpo come frase breve.

Poi **fermati** e scrivi all'utente un rapporto:

- **Numeri / affermazioni corretti**: lista con riga, prima → dopo, pagina del
  paper.
- **Frontmatter**: cosa è cambiato in `data`, `tag`, `titolo`, `sommario`,
  `fonte`, `fonteUrl` e perché.
- **Link**: tabella url → esito. Evidenzia i rotti e quelli sistemati.
- **Figure**: quali avevano problemi (citazione dopo la comparsa, didascalia che
  descrive un'altra figura, file mancante) e come sono stati risolti.
- **Grafici**: esito del confronto di ogni blocco ```grafico con l'originale;
  quali eventualmente riportati a immagine.
- **Incoerenze del paper** trovate e come gestite.
- **Dubbi** che restano e su cui vuoi conferma.

Chiudi con: *"L'italiano è verificato. Confermi che procedo con la traduzione
inglese?"* — e **aspetta l'ok. Non tradurre prima.**

---

## 9. Traduzione inglese

Solo dopo l'ok esplicito dell'utente.

La struttura del file è: metà **inglese sopra** il separatore `$$$`, metà
**italiana sotto**. Oggi sopra c'è solo un moncone (un `## H2` col titolo di
sezione in inglese, un `---`, il titolo). Va sostituito con **l'articolo inglese
completo**, che rispecchia esattamente la struttura di quello italiano.

- **Stessi `## H2`**, tradotti: diventano l'indice inglese nella colonna
  sinistra. Titoli brevi e densi, niente `###`.
- **Stesse figure, stessi percorsi** `images/figNN-....png`. `alt` e didascalia
  tradotti in inglese, autosufficienti, stesse condizioni descritte.
- **Stessi blocco ```grafico**, duplicati identici: il testo del grafico è già
  in inglese, si traduce **solo la `didascalia`**.
- **Stesse footnote** `[^n]` con lo stesso testo tradotto (la numerazione
  riparte per lingua, si possono riusare le stesse etichette).
- In coda: **Bibliographic reference** (citazione completa + DOI, identica),
  **Data and code availability**, **Short glossary** (stesse 5–6 voci tradotte).
- ⚠️ Non iniziare mai una riga con `$$$` (collisione col separatore e con la
  matematica display `$$`).
- `titolo` e `sommario` nel frontmatter hanno già la parte inglese
  (`"EN" $$$ "IT"`): verifica solo che l'inglese sia allineato al testo finale.

La traduzione **non aggiunge e non toglie fatti**: cambia la lingua, non il
contenuto. Ogni numero verificato nell'italiano deve comparire identico
nell'inglese.

Dopo la traduzione:

```bash
npx astro build
```

deve passare. Poi rapporto breve all'utente: file toccato, che l'inglese
rispecchia l'italiano verificato, ed eventuali punti di traduzione su cui vuoi
conferma (resa di un termine tecnico, di un titolo di sezione). Nessun commit,
nessun push.
