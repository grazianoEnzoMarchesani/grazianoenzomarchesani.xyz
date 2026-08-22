/**
 * Video YouTube — attivazione condizionata al consenso.
 *
 * L'HTML statico prodotto da remark-articolo.ts non parla con Google: è solo
 * testo dentro un normale collegamento a youtube.com. Questo modulo ci mette la
 * copertina vera e ne fa un player incorporato SOLTANTO se il consenso è stato
 * dato, e riporta tutto indietro se viene revocato.
 *
 * Nessuna libreria: `lite-youtube-embed` faceva la stessa cosa, ma al passaggio
 * del mouse apriva connessioni verso google.com e doubleclick.net — cioè
 * spediva l'IP del visitatore a una rete pubblicitaria prima di qualunque click.
 */

import { alCambio, consensoDato } from './consenso';

/** `youtube-nocookie` riduce il tracciamento, non lo elimina: serve comunque il consenso. */
const ORIGINE = 'https://www.youtube-nocookie.com';

/** In ordine di preferenza: `maxresdefault` esiste solo per i video caricati in HD. */
const COPERTINE = ['maxresdefault', 'mqdefault'] as const;

/** Il markup di partenza, per poterlo rimettere identico quando il consenso viene revocato. */
const originali = new WeakMap<HTMLElement, string>();

function apriPlayer(figura: HTMLElement, facciata: HTMLAnchorElement, evento: MouseEvent) {
  // Il click con modificatori resta una normale apertura del collegamento.
  if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.button !== 0) return;
  evento.preventDefault();

  const id = figura.dataset.videoid;
  if (!id) return;

  const iframe = document.createElement('iframe');
  iframe.src = `${ORIGINE}/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
  iframe.title = figura.dataset.titolo || 'YouTube';
  iframe.className = 'video-yt-player';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  facciata.replaceWith(iframe);
}

/**
 * Chiede a i.ytimg.com la copertina vera. Si fa SOLO col consenso dato: è una
 * richiesta a Google, che è esattamente ciò che l'utente ha accettato.
 */
function mostraCopertina(figura: HTMLElement, facciata: HTMLElement) {
  const id = figura.dataset.videoid;
  if (!id) return;

  const prova = (indice: number) => {
    const qualita = COPERTINE[indice];
    if (!qualita) return; // nessuna copertina disponibile: resta la facciata testuale

    const immagine = new Image();
    // Quando la qualità chiesta non esiste, ytimg può rispondere 404 oppure servire
    // un segnaposto grigio 120x90: vanno trattati allo stesso modo.
    immagine.onload = () => {
      if (immagine.naturalWidth <= 120) return prova(indice + 1);
      facciata.style.backgroundImage = `url('${immagine.src}')`;
      facciata.classList.add('video-yt-conCopertina');
    };
    immagine.onerror = () => prova(indice + 1);
    immagine.src = `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${qualita}.jpg`;
  };

  prova(0);
}

function abilita(figura: HTMLElement) {
  if (figura.dataset.consenso === 'si') return; // già abilitata: non raddoppiare i listener
  figura.dataset.consenso = 'si';

  const facciata = figura.querySelector<HTMLAnchorElement>('a.video-yt-facciata');
  if (!facciata) return;

  // "Clicca per riprodurre su YouTube" descriveva un collegamento che porta fuori:
  // col consenso il click apre il player qui, quindi al suo posto va la copertina.
  // Il titolo resta come nome accessibile del collegamento, nascosto a schermo.
  const nome = document.createElement('span');
  nome.className = 'video-yt-etichetta';
  nome.textContent = figura.dataset.titolo || 'Video';
  const play = document.createElement('span');
  play.className = 'video-yt-play';
  play.setAttribute('aria-hidden', 'true');
  facciata.replaceChildren(play, nome);
  mostraCopertina(figura, facciata);

  // Resta un <a>: se qualcosa va storto il collegamento a YouTube funziona comunque.
  facciata.addEventListener('click', (evento) => apriPlayer(figura, facciata, evento));
}

/** Rimette la facciata testuale: toglie l'iframe se presente e ripristina il markup di partenza. */
function disabilita(figura: HTMLElement) {
  if (figura.dataset.consenso === 'no' && !figura.querySelector('iframe')) return;
  const html = originali.get(figura);
  if (html !== undefined) figura.innerHTML = html;
  figura.dataset.consenso = 'no';
}

function aggiorna(accettato: boolean) {
  for (const figura of document.querySelectorAll<HTMLElement>('.video-yt')) {
    if (!originali.has(figura)) originali.set(figura, figura.innerHTML);
    if (accettato) abilita(figura);
    else disabilita(figura);
  }
}

// Il consenso può cambiare mentre la pagina è aperta: la revoca deve smontare
// i player già caricati, non limitarsi a valere dalla pagina successiva.
alCambio(aggiorna);
document.addEventListener('astro:page-load', () => aggiorna(consensoDato()));
