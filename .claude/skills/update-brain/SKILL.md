---
name: update-brain
description: Manutenzione del second brain di progetto in docs/brain/ — riconcilia le decisioni della sessione con lo stato salvato e aggiorna il log. Usa quando si chiude una sessione di lavoro sostanziale su questo progetto, o quando l'utente chiede di aggiornare/salvare il second brain.
---

Mantieni `docs/brain/` come unica fonte di verità sulle decisioni di progetto. Procedi in ordine.

## 1. Rileggi lo stato attuale

Leggi `docs/brain/index.md` e tutti i file "Decisione" che linka (`constraints.md`, `stack.md`, `content-plan.md`, `design.md`). Non serve rileggere `session-log.md` per intero: guarda solo se manca la voce di oggi.

## 2. Individua cosa è cambiato in questa sessione

Ripercorri la conversazione e isola le decisioni prese o cambiate: nuovi vincoli, scelte tecniche, scelte di contenuto/design, nuove regole operative.

## 3. Riconcilia i file di decisione

Per ogni cambiamento:
- Se è **coerente/aggiuntivo** rispetto a quanto già scritto, aggiungilo nel file pertinente.
- Se **contraddice** una voce esistente, **sostituiscila**: rimuovi il testo vecchio, scrivi solo quello nuovo. Non lasciare mai la vecchia decisione accanto alla nuova, nemmeno "barrata" o commentata — il file deve riflettere solo lo stato attuale. La cronologia del cambiamento vive nel log (punto 4), non nei file di decisione.
- Se un cambiamento non rientra in nessun file esistente, valuta se serve un nuovo file: se sì, crealo e aggiungilo a `index.md` con una riga di descrizione.

Mantieni ogni file breve e mirato al proprio argomento (vedi la descrizione in `index.md`): se un file cresce troppo o comincia a coprire più argomenti, valuta di scorporarlo.

## 4. Aggiungi la voce di log

Aggiungi in fondo a `docs/brain/session-log.md`, sotto la data odierna (nuova sezione `## YYYY-MM-DD` se non esiste già una voce per oggi), 2-4 righe puntate su cosa è successo/cambiato in questa sessione. Non riscrivere mai voci di log passate: è append-only.

## 5. Riepiloga

Alla fine, elenca brevemente all'utente quali file hai toccato e cosa hai cambiato/sostituito in ciascuno. Non fare commit né push: questi file restano modifiche locali non tracciate/staged, li carica l'utente.
