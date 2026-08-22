/**
 * Consenso privacy — sorgente unica di verita' per le funzioni facoltative
 * (ricerca semantica e video YouTube).
 *
 * DEFAULT-DENY: finche' non esiste un «accettato» esplicito e non scaduto, tutto
 * resta spento. Silenzio, chiusura del banner, inattivita' e prima visita
 * producono lo stesso identico stato tecnico del rifiuto — art. 4(11) GDPR e
 * considerando 32: il consenso richiede un'azione positiva inequivocabile.
 *
 * L'unica differenza tra rifiuto espresso e assenza di scelta riguarda il banner:
 * il primo viene registrato e sospende la richiesta per sei mesi, la seconda no.
 */

export type Scelta = 'accettato' | 'rifiutato';

const CHIAVE = 'privacy:scelta';
/** Il Garante (provv. 231/2021) vieta di riproporre la richiesta prima di sei mesi. */
const VALIDITA_MESI = 6;

interface Registrazione {
  scelta: Scelta;
  data: string;
}

/**
 * Copia in memoria: in navigazione privata `localStorage` puo' lanciare, e senza
 * questa la scelta appena espressa dall'utente non varrebbe nemmeno per la
 * pagina che ha davanti.
 */
let memoria: Registrazione | null = null;

function leggi(): Registrazione | null {
  let registrazione = memoria;

  if (!registrazione) {
    try {
      const grezzo = localStorage.getItem(CHIAVE);
      if (grezzo) registrazione = JSON.parse(grezzo) as Registrazione;
    } catch {
      return null; // storage negato: si resta sul rifiuto, che e' lo stato sicuro
    }
  }

  if (!registrazione) return null;
  if (registrazione.scelta !== 'accettato' && registrazione.scelta !== 'rifiutato') return null;

  const scadenza = new Date(registrazione.data);
  if (Number.isNaN(scadenza.getTime())) return null;
  scadenza.setMonth(scadenza.getMonth() + VALIDITA_MESI);
  if (scadenza < new Date()) return null;

  return registrazione;
}

/** La scelta registrata, o `null` se assente o scaduta. */
export const sceltaRegistrata = (): Scelta | null => leggi()?.scelta ?? null;

/** L'unica domanda che il resto del codice deve porsi prima di attivare qualcosa. */
export const consensoDato = (): boolean => sceltaRegistrata() === 'accettato';

/** Il banner va mostrato solo a chi non ha ancora scelto. */
export const serveChiedere = (): boolean => sceltaRegistrata() === null;

export function registra(scelta: Scelta): void {
  const registrazione: Registrazione = { scelta, data: new Date().toISOString() };
  memoria = registrazione;
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(registrazione));
  } catch {
    // Senza storage la scelta vale per la sessione corrente: meglio che ignorarla.
  }
  document.dispatchEvent(new CustomEvent('privacy:cambiato', { detail: { scelta } }));
}

/**
 * Cancella il modello della ricerca dalla cache del browser.
 * Revocare il consenso all'archiviazione lasciando ~33 MB sul dispositivo
 * svuoterebbe di senso la revoca stessa.
 */
export async function dimenticaModello(): Promise<void> {
  try {
    if (typeof caches === 'undefined') return;
    await caches.delete('transformers-cache');
  } catch {
    // Cache API non disponibile (origine insicura): niente da cancellare.
  }
}

/** Si iscrive ai cambi di consenso e viene chiamata subito con lo stato corrente. */
export function alCambio(fn: (accettato: boolean) => void): () => void {
  const gestore = () => fn(consensoDato());
  document.addEventListener('privacy:cambiato', gestore);
  gestore();
  return () => document.removeEventListener('privacy:cambiato', gestore);
}
