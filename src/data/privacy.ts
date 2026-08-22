/**
 * Testo dell'informativa privacy, bilingue.
 *
 * Sta qui e non in una collection perché è testo di servizio, non un contenuto
 * di Fields: non ha tag, non entra nella ricerca, non compare in RSS. I frammenti
 * HTML sono scritti a mano in questo file e resi con `set:html`: nessuno di essi
 * proviene da input esterni.
 *
 * ATTENZIONE: questo testo descrive comportamenti tecnici reali del sito. Se
 * cambia ciò che il sito fa — un servizio terzo in più, un dato in più, una
 * finalità diversa — va cambiato anche qui, nella stessa sessione di lavoro.
 * Vedi docs/legal/privacy-audit.md per la ricognizione che lo ha prodotto.
 */

import type { Lingua } from '../i18n/testi';

/** Mese dell'ultima revisione sostanziale. Va aggiornato quando cambia il testo. */
export const aggiornamento = '2026-08-01';

export interface Sezione {
  id: string;
  titolo: string;
  /** Frammenti HTML già formattati (paragrafi, liste, tabelle). */
  corpo: string[];
}

const en: Sezione[] = [
  {
    id: 'sintesi',
    titolo: 'In short',
    corpo: [
      '<p>This site sets no cookies, runs no analytics, carries no advertising and does not profile its visitors. Typefaces, charts and animations are served from this domain: while you read a page, no request goes out to Google, to advertising networks or to any third-party service.</p>',
      '<p>Only two features involve any further processing, and <strong>both stay switched off until you switch them on</strong>: semantic search and YouTube video playback. Declining leaves the site fully usable.</p>',
      '<p>What follows sets out the detail required by Articles 13 and 14 of Regulation (EU) 2016/679 (GDPR).</p>',
    ],
  },
  {
    id: 'titolare',
    titolo: '1. Data controller',
    corpo: [
      '<p>The data controller is <strong>Graziano Enzo Marchesani</strong>, acting as a natural person.</p>',
      '<p>This is a personal website. Although its content concerns research and teaching carried out at the University of Camerino, <strong>it is not an institutional site, and the University neither operates it nor determines the purposes of the processing described here</strong> — with the single clarification about the mailbox set out in § 3.3.</p>',
      '<p>No Data Protection Officer has been appointed, the conditions of Article 37 GDPR not being met.</p>',
    ],
  },
  {
    id: 'non-fa',
    titolo: '2. What this site does not do',
    corpo: [
      '<p>Stated plainly, and verifiable by inspecting the source code, which is public:</p>',
      `<ul>
        <li><strong>No cookies.</strong> None at all, neither technical nor third-party.</li>
        <li><strong>No analytics</strong> (Google Analytics or equivalent), no tracking pixels, no beacons, no heatmaps, no A/B testing.</li>
        <li><strong>No advertising</strong> and no membership of any ad network.</li>
        <li><strong>No profiling</strong> and no automated decision-making.</li>
        <li><strong>No geolocation</strong> and no device fingerprinting.</li>
        <li><strong>No contact, registration, comment or newsletter forms.</strong> Nothing you type is sent to this site.</li>
        <li><strong>Typefaces are hosted on this domain.</strong> No call is made to Google Fonts or to any other external font service.</li>
        <li><strong>Mathematics, charts and animations</strong> are generated locally, with no libraries loaded from external servers.</li>
        <li><strong>No photographs of identifiable third parties are published.</strong> This is an editorial rule of the site: its images show places, buildings, data and instruments, not recognisable faces. The only portrait published is the controller’s own.</li>
        <li><strong>Video thumbnails are downloaded at publication time</strong> and served from this domain: opening a page containing a video reaches neither Google nor YouTube.</li>
      </ul>`,
    ],
  },
  {
    id: 'senza-consenso',
    titolo: '3. Processing that does not require consent',
    corpo: [
      '<h3>3.1 Access logs kept by the hosting provider</h3>',
      '<p>The site is hosted on <strong>GitHub Pages</strong>, provided by GitHub, Inc. Like any web server, the infrastructure automatically records, for each request: IP address, browser and operating system (user agent), the address of the page requested, the date and time, and any referring page.</p>',
      '<p>These data are inherent to communication over the Internet: without an IP address no page could be delivered to you.</p>',
      `<ul>
        <li><strong>Purposes:</strong> delivering content, infrastructure security, fault diagnosis and abuse prevention.</li>
        <li><strong>Legal basis:</strong> the controller’s legitimate interest in operating the service securely, Article 6(1)(f) GDPR.</li>
        <li><strong>Recipient:</strong> GitHub, Inc. (Microsoft group), as processor under Article 28 GDPR.</li>
        <li><strong>Retention:</strong> determined by the provider. <strong>The controller has no access to these logs</strong> and puts them to no purpose of their own.</li>
      </ul>`,
      '<h3>3.2 Technical storage on your device</h3>',
      '<p>On the <em>Fields</em> page the site briefly stores, in the browser’s session memory, an identifier of the item you were viewing. Its only job is to restore the animation to the right position when you navigate back from an article.</p>',
      '<p>It holds no personal or identifying data, cannot be used to recognise you, is not readable by third parties, and <strong>is erased automatically when you close the browser tab</strong>.</p>',
      '<p>If you express a choice in the preferences banner, that choice is instead stored in the browser\u2019s local storage (<code>localStorage</code>, under <code>privacy:scelta</code>), together with the date you made it, for the sole purpose of not asking you the same question on every page and every visit. It records only whether you accepted or declined; it does not identify you and is not readable by third parties. It stays on your device for <strong>six months at most</strong>, after which it expires and everything reverts to the declined state; you can delete it at any time from your browser settings, or change your choice through the \u201cPrivacy preferences\u201d link.</p>',
      '<p><strong>Legal basis:</strong> storage strictly necessary to provide the service you requested, exempt from consent under Article 5(3) of Directive 2002/58/EC.</p>',
      '<h3>3.3 Contact by email</h3>',
      '<p>The site publishes an email address you may copy or use to open your mail client. <strong>No message passes through this site</strong>: the exchange happens entirely between your mail service and mine.</p>',
      '<p>If you write to me, I process what your message contains — name, email address and anything else you choose to include — solely in order to reply.</p>',
      '<p><strong>Legal basis:</strong> pre-contractual steps or response to your request, Article 6(1)(b) GDPR; alternatively legitimate interest in answering correspondence received, Article 6(1)(f). <strong>Retention:</strong> as long as handling the request and any follow-up requires.</p>',
      '<p>The address published here is the controller’s institutional mailbox. Your message is therefore received and stored on the mail infrastructure of the <strong>University of Camerino</strong>. The University operates that infrastructure as an independent controller, under its own privacy policies; it does not process your message on behalf of the controller of this site, and takes no part in the purposes described here.</p>',
      '<p>At the time of writing, mail for the <code>@unicam.it</code> domain is delivered through <strong>Google Workspace</strong>: messages sent to that address are handed to Google’s servers and stored there, with the transfers outside the European Union that this entails. That is the University’s arrangement, not this site’s, and it may change without this notice reflecting it immediately. For the processing that falls to the University, see its <a href="https://www.unicam.it/international-student/privacy-policy-and-legal-notes" target="_blank" rel="noopener noreferrer">privacy policy</a>. If this matters to you, consider whether email is the right channel for what you want to send.</p>',
      '<h3>3.4 Names of publication co-authors</h3>',
      '<p>The site lists the controller’s scientific publications, <strong>including the names of co-authors</strong>, imported from the University of Camerino’s IRIS institutional research archive and from the publishers’ own bibliographic records.</p>',
      '<p>The data are limited to <strong>surname and initials</strong>. No email addresses, affiliations, personal identifiers or other co-author data are collected or published.</p>',
      `<ul>
        <li><strong>Purpose:</strong> accurate and complete attribution of scientific authorship — an ethical obligation before it is a legal one.</li>
        <li><strong>Legal basis:</strong> legitimate interest in the truthfulness and integrity of the bibliographic record, Article 6(1)(f) GDPR. The data were already made public by the publishers and are reproduced in the same context and for the same purpose, within the reasonable expectations of the individuals concerned.</li>
        <li><strong>Article 14 notice:</strong> the data are not obtained from the individuals themselves. Informing each of them would involve disproportionate effort within the meaning of Article 14(5)(b) GDPR; this notice, being publicly available, discharges that duty.</li>
        <li><strong>Rights:</strong> any co-author may at any time request correction of the spelling of their name, or object to the processing, by writing to the address above. Requests are handled without delay.</li>
      </ul>`,
    ],
  },
  {
    id: 'con-consenso',
    titolo: '4. Processing that requires your consent',
    corpo: [
      '<h3>Default state: everything off</h3>',
      '<p>Neither feature described here switches itself on.</p>',
      '<p>The site’s initial state, for everyone and on every device, is <strong>refusal</strong>. Until you take a positive, explicit step to accept, nothing is downloaded from third parties, nothing beyond § 3.2 is stored on your device, and no request reaches the parties named below.</p>',
      '<p>The following all amount to refusal and produce exactly the same technical result: closing the banner with the “✕”, pressing “Decline”, ignoring the banner, or carrying on browsing without answering. No passive behaviour can be read as consent, in line with Article 4(11) and Recital 32 GDPR.</p>',
      '<p>The only difference between an express refusal and no answer at all concerns the banner itself: if you decline explicitly, the choice is recorded and you will not be asked again for six months; if you do not answer, the banner may reappear on a later visit.</p>',
      '<h3>4.1 Semantic search</h3>',
      '<p>Search works in two modes.</p>',
      '<p><strong>Text search</strong> is always available, requires no consent and involves no further processing: it matches what you type against a static index served from this domain.</p>',
      '<p><strong>Semantic search</strong> adds the ability to find conceptually related content even when it does not contain the words you typed. To do so, your browser downloads roughly 33 MB — a language model of about 22 MB plus the runtime that executes it — served from this same domain, and keeps them in the browser cache so they need not be downloaded again.</p>',
      '<p><strong>What you type never leaves your browser.</strong> Processing happens entirely on your device: there is no search log, on the server or anywhere else. Nobody — the controller included — can know what you searched for.</p>',
      '<p><strong>Legal basis:</strong> consent, Article 6(1)(a) GDPR, and Article 5(3) of Directive 2002/58/EC for the storage on your device.</p>',
      '<p><strong>If you do not consent:</strong> search continues to work in text mode. Nothing is downloaded and nothing is stored on your device.</p>',
      '<h3>4.2 YouTube videos</h3>',
      '<p>Some articles contain videos hosted on YouTube. The preview you see is a static image served from this domain: <strong>opening the page contacts no Google server</strong>.</p>',
      '<p>The video loads <strong>only if you expressly ask for it</strong>. At that moment your browser connects to Google’s servers, and the following are disclosed: your IP address; information about your browser and device; the address of the page you are watching from; and any data already held in your browser relating to your Google account, if you are signed in.</p>',
      '<p>The <em>privacy-enhanced</em> mode (<code>youtube-nocookie.com</code>) is used, which <strong>reduces but does not eliminate</strong> this processing: Google may still store information on your device and associate the view with your profile.</p>',
      '<p>From that point <strong>the processing is carried out by Google as an independent controller</strong>, on its own terms. The controller of this site has neither access to those data nor any control over them. See the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google privacy policy</a>.</p>',
      '<p><strong>Legal basis:</strong> consent, Article 6(1)(a) GDPR and Article 5(3) of Directive 2002/58/EC. <strong>Recipients:</strong> Google Ireland Limited and Google LLC.</p>',
      '<p><strong>If you do not consent:</strong> the preview stays visible along with the video title and a direct link to YouTube, which you may choose to open. No part of the article becomes inaccessible.</p>',
      '<h3>4.3 Withdrawing consent</h3>',
      '<p>You may <strong>change or withdraw your choice at any time</strong>, without giving a reason and without any consequence for your use of the site, from the <strong>“Privacy”</strong> link at the foot of every page.</p>',
      '<p>Withdrawal does not affect the lawfulness of processing carried out beforehand. As regards data already obtained by Google, withdrawal on this site prevents any further transmission but does not undo processing already performed by that company, against which rights must be exercised directly.</p>',
    ],
  },
  {
    id: 'link-esterni',
    titolo: '5. Links to external sites',
    corpo: [
      '<p>The site links to external resources: DOIs of scientific publications, institutional archives, code repositories, academic and social profiles, project sites.</p>',
      '<p>Following such a link takes you away from this site. The controller <strong>exercises no control over the destination sites</strong> and is not answerable for their content or for any processing of personal data they carry out, which is governed by their own privacy notices.</p>',
    ],
  },
  {
    id: 'trasferimenti',
    titolo: '6. Transfers to third countries',
    corpo: [
      '<p>Some of the parties named above are established, or operate infrastructure, outside the European Economic Area, in particular in the United States of America.</p>',
      `<div class="tabella-privacy"><table>
        <thead><tr><th>Party</th><th>Processing</th><th>Transfer safeguard</th></tr></thead>
        <tbody>
          <tr><td>GitHub, Inc. (Microsoft)</td><td>hosting and access logs</td><td><em>EU–US Data Privacy Framework</em> adequacy decision; standard contractual clauses</td></tr>
          <tr><td>Google Ireland Ltd. / Google LLC</td><td>video playback, <strong>only with consent</strong></td><td><em>EU–US Data Privacy Framework</em> adequacy decision; standard contractual clauses</td></tr>
        </tbody>
      </table></div>`,
      '<p>Transfers take place under Articles 44 et seq. GDPR. Further information about the safeguards in place is available on request at the address above.</p>',
    ],
  },
  {
    id: 'conservazione',
    titolo: '7. Retention periods',
    corpo: [
      `<ul>
        <li><strong>Hosting access logs:</strong> per the provider’s policy; not accessible to the controller.</li>
        <li><strong>Technical session storage:</strong> until you close the browser tab.</li>
        <li><strong>Consent preference:</strong> up to 6 months, or until you change it.</li>
        <li><strong>Semantic search model:</strong> in your browser cache, until you clear it or withdraw consent.</li>
        <li><strong>Email correspondence:</strong> as long as handling the request requires.</li>
        <li><strong>Bibliographic data:</strong> as long as the publication remains listed on the site.</li>
      </ul>`,
    ],
  },
  {
    id: 'diritti',
    titolo: '8. Your rights',
    corpo: [
      '<p>In relation to data concerning you, you may exercise the rights set out in Articles 15 to 22 GDPR:</p>',
      `<ul>
        <li><strong>access</strong> — to learn whether and what data are processed, and obtain a copy;</li>
        <li><strong>rectification</strong> — to correct inaccurate or incomplete data;</li>
        <li><strong>erasure</strong> — to have data deleted, in the cases provided for;</li>
        <li><strong>restriction</strong> — to have processing suspended;</li>
        <li><strong>portability</strong> — to receive the data in a structured format, where applicable;</li>
        <li><strong>objection</strong> — to object at any time, on grounds relating to your particular situation, to processing based on legitimate interest;</li>
        <li><strong>withdrawal of consent</strong> — at any time, as described in § 4.3.</li>
      </ul>`,
      '<p>Requests should be sent to the address given in § 1 and are answered within one month, extendable in the cases allowed by Article 12(3) GDPR.</p>',
      '<p>If you consider that the processing infringes the law, you have the right to lodge a complaint with the Italian data protection authority, the <strong>Garante per la protezione dei dati personali</strong> (Piazza Venezia 11, 00187 Rome — <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>), or with the supervisory authority of the country where you live, or to bring proceedings before a court.</p>',
    ],
  },
  {
    id: 'automatizzate',
    titolo: '9. Automated decision-making',
    corpo: [
      '<p>The controller carries out no profiling and takes no decisions based solely on automated processing within the meaning of Article 22 GDPR.</p>',
      '<p>Where you consent to video playback, Google may carry out profiling on its own terms, over which the controller has no control.</p>',
    ],
  },
  {
    id: 'minori',
    titolo: '10. Children',
    corpo: [
      '<p>The site is not directed at children under fourteen and does not knowingly collect their data. Its teaching material is intended for university students.</p>',
    ],
  },
  {
    id: 'conferimento',
    titolo: '11. Whether providing data is required',
    corpo: [
      '<p>No provision of data is mandatory. Declining the features described in § 4 simply switches them off, with no restriction whatsoever on access to the content of the site.</p>',
    ],
  },
  {
    id: 'modifiche',
    titolo: '12. Changes to this notice',
    corpo: [
      '<p>This notice may be updated to reflect changes to the site or to the law. The date at the top indicates the latest revision. Substantial changes affecting consent already given will prompt a fresh request for consent.</p>',
    ],
  },
];

const it: Sezione[] = [
  {
    id: 'sintesi',
    titolo: 'In breve',
    corpo: [
      '<p>Questo sito non usa cookie, non usa sistemi di statistiche o di analisi del traffico, non contiene pubblicità e non profila chi lo visita. I caratteri tipografici, i grafici e le animazioni sono serviti direttamente da questo dominio: nessuna richiesta parte verso Google, verso reti pubblicitarie o verso servizi di terze parti mentre leggi una pagina.</p>',
      '<p>Due sole funzioni possono comportare un trattamento ulteriore, ed <strong>entrambe restano spente finché non sei tu ad accenderle</strong>: la ricerca semantica e la riproduzione dei video YouTube. Se non dai il consenso, il sito resta pienamente utilizzabile.</p>',
      '<p>Quanto segue spiega tutto nel dettaglio, come richiesto dagli articoli 13 e 14 del Regolamento (UE) 2016/679 (GDPR).</p>',
    ],
  },
  {
    id: 'titolare',
    titolo: '1. Titolare del trattamento',
    corpo: [
      '<p>Il titolare del trattamento è <strong>Graziano Enzo Marchesani</strong>, in qualità di persona fisica.</p>',
      '<p>Questo è un sito personale. Sebbene i contenuti riguardino attività di ricerca e didattica svolte presso l’Università di Camerino, <strong>il sito non è gestito dall’Università, che non determina le finalità dei trattamenti qui descritti</strong> — con la sola precisazione sulla casella di posta di cui al § 3.3.</p>',
      '<p>Non è stato nominato un Responsabile della protezione dei dati (DPO), non ricorrendone i presupposti di cui all’art. 37 GDPR.</p>',
    ],
  },
  {
    id: 'non-fa',
    titolo: '2. Cosa questo sito non fa',
    corpo: [
      '<p>Per chiarezza, e perché è verificabile ispezionando il codice sorgente del sito, che è pubblico:</p>',
      `<ul>
        <li><strong>Non utilizza cookie.</strong> Nessuno, né tecnici né di terze parti.</li>
        <li><strong>Non utilizza sistemi di analisi del traffico</strong> (Google Analytics o equivalenti), né pixel di tracciamento, né beacon, né mappe di calore, né test A/B.</li>
        <li><strong>Non ospita pubblicità</strong> e non aderisce a reti pubblicitarie.</li>
        <li><strong>Non profila</strong> gli utenti e non adotta processi decisionali automatizzati.</li>
        <li><strong>Non rileva la posizione geografica</strong> e non impiega tecniche di identificazione del dispositivo (<em>fingerprinting</em>).</li>
        <li><strong>Non ospita moduli di contatto, registrazione, commenti o iscrizione a newsletter.</strong> Nessun dato viene inviato a questo sito compilando qualcosa.</li>
        <li><strong>I caratteri tipografici sono ospitati su questo dominio.</strong> Non viene effettuata alcuna chiamata a Google Fonts o ad altri servizi esterni di distribuzione dei font.</li>
        <li><strong>Le formule matematiche, i grafici e le animazioni</strong> sono generati localmente, senza librerie caricate da server esterni.</li>
        <li><strong>Non pubblica fotografie di persone identificabili.</strong> È una regola editoriale del sito: le immagini dei contenuti ritraggono luoghi, edifici, dati e strumenti, non volti riconoscibili di terzi. L'unico ritratto pubblicato è quello del titolare.</li>
        <li><strong>Le anteprime dei video sono scaricate in fase di pubblicazione</strong> e servite da questo dominio: aprendo una pagina che contiene un video, nessuna richiesta raggiunge Google o YouTube.</li>
      </ul>`,
    ],
  },
  {
    id: 'senza-consenso',
    titolo: '3. Dati trattati senza necessità di consenso',
    corpo: [
      '<h3>3.1 Dati di navigazione registrati dal servizio di hosting</h3>',
      '<p>Il sito è ospitato su <strong>GitHub Pages</strong>, servizio fornito da GitHub, Inc. Come ogni server web, l’infrastruttura registra automaticamente, per ogni richiesta ricevuta: indirizzo IP; tipo e versione del browser e del sistema operativo (<em>user agent</em>); indirizzo della pagina richiesta e data e ora della richiesta; eventuale pagina di provenienza (<em>referer</em>).</p>',
      '<p>Questi dati sono necessari al funzionamento stesso della comunicazione via Internet: senza indirizzo IP nessuna pagina potrebbe esserti recapitata.</p>',
      `<ul>
        <li><strong>Finalità:</strong> consegna dei contenuti, sicurezza dell’infrastruttura, diagnosi di malfunzionamenti e prevenzione degli abusi.</li>
        <li><strong>Base giuridica:</strong> legittimo interesse del titolare a erogare il servizio in modo sicuro e funzionante, art. 6(1)(f) GDPR.</li>
        <li><strong>Destinatario:</strong> GitHub, Inc. (gruppo Microsoft), in qualità di responsabile del trattamento ex art. 28 GDPR.</li>
        <li><strong>Conservazione:</strong> i tempi sono determinati dal fornitore. <strong>Il titolare non ha accesso a questi registri</strong> e non li utilizza per alcuna finalità propria.</li>
      </ul>`,
      '<h3>3.2 Archiviazione tecnica sul tuo dispositivo</h3>',
      '<p>Nella pagina <em>Fields</em> il sito salva temporaneamente, nella memoria di sessione del browser, un identificativo dell’elemento che stavi consultando. Serve unicamente a riposizionare correttamente l’animazione quando torni indietro da un articolo.</p>',
      '<p>Non contiene dati personali né identificativi, non permette di riconoscerti, non è leggibile da terzi e <strong>viene cancellato automaticamente alla chiusura della scheda del browser</strong>.</p>',
      '<p>Se esprimi una scelta sul banner delle preferenze, la scelta stessa viene invece salvata nella memoria locale del browser (<code>localStorage</code>, voce <code>privacy:scelta</code>), insieme alla data in cui l\u2019hai espressa: serve unicamente a non doverti chiedere di nuovo la medesima cosa a ogni pagina e a ogni visita. Registra soltanto se hai accettato o rifiutato, non ti identifica e non \u00e8 leggibile da terzi. Resta sul tuo dispositivo <strong>al massimo sei mesi</strong>, dopodich\u00e9 scade e tutto torna allo stato di rifiuto; puoi cancellarla in qualsiasi momento dalle impostazioni del browser o cambiando scelta dal collegamento \u00abPreferenze privacy\u00bb.</p>',
      '<p><strong>Base giuridica:</strong> archiviazione strettamente necessaria alla fornitura del servizio richiesto, esente da consenso ai sensi dell’art. 122, comma 1, del Codice Privacy (D.Lgs. 196/2003) e dell’art. 5(3) della Direttiva 2002/58/CE.</p>',
      '<h3>3.3 Contatti via email</h3>',
      '<p>Il sito pubblica un indirizzo email, che puoi copiare o usare per aprire il tuo programma di posta. <strong>Nessun messaggio transita da questo sito</strong>: la comunicazione avviene interamente tra il tuo servizio di posta e il mio.</p>',
      '<p>Se mi scrivi, tratterò i dati contenuti nel messaggio (nome, indirizzo email, e ogni informazione che deciderai di includere) al solo fine di risponderti.</p>',
      '<p><strong>Base giuridica:</strong> esecuzione di misure precontrattuali o riscontro a una tua richiesta, art. 6(1)(b) GDPR; in via residuale, legittimo interesse a dare seguito alle comunicazioni ricevute, art. 6(1)(f). <strong>Conservazione:</strong> per il tempo necessario a gestire la richiesta e i suoi eventuali sviluppi.</p>',
      '<p>L’indirizzo qui pubblicato è la casella di posta istituzionale del titolare. Il tuo messaggio viene quindi ricevuto e conservato sull’infrastruttura di posta dell’<strong>Università di Camerino</strong>. L’Università gestisce tale infrastruttura in qualità di titolare autonomo, secondo le proprie informative; non tratta il tuo messaggio per conto del titolare di questo sito e resta estranea alle finalità qui descritte.</p>',
      '<p>Allo stato attuale la posta del dominio <code>@unicam.it</code> è erogata tramite <strong>Google Workspace</strong>: i messaggi diretti a quell’indirizzo vengono consegnati ai server di Google e lì conservati, con i trasferimenti fuori dall’Unione Europea che ne conseguono. È un assetto scelto dall’Università, non da questo sito, e può cambiare senza che la presente informativa ne dia conto immediatamente. Per i trattamenti di competenza dell’Ateneo si rinvia alla sua <a href="https://www.unicam.it/ateneo/privacy/privacy-policy" target="_blank" rel="noopener noreferrer">informativa privacy</a>. Se la cosa ti riguarda, valuta se l’email sia il canale adatto a ciò che vuoi scrivere.</p>',
      '<h3>3.4 Nomi dei coautori delle pubblicazioni</h3>',
      '<p>Il sito pubblica l’elenco delle pubblicazioni scientifiche del titolare, comprensivo dei <strong>nomi dei coautori</strong>, importati dall’archivio istituzionale della ricerca IRIS dell’Università di Camerino e dai riferimenti bibliografici dei rispettivi editori.</p>',
      '<p>I dati sono limitati a <strong>cognome e iniziali del nome</strong>. Non vengono raccolti né pubblicati indirizzi email, affiliazioni, identificativi personali o altri dati dei coautori.</p>',
      `<ul>
        <li><strong>Finalità:</strong> corretta e completa attribuzione della paternità scientifica dei lavori, obbligo deontologico prima ancora che giuridico.</li>
        <li><strong>Base giuridica:</strong> legittimo interesse alla veridicità e all’integrità del riferimento bibliografico, art. 6(1)(f) GDPR. Si tratta di dati già resi pubblici dagli editori, riprodotti nel medesimo contesto e con le medesime finalità originarie, entro le ragionevoli aspettative degli interessati.</li>
        <li><strong>Informativa ex art. 14:</strong> i dati non sono raccolti presso gli interessati. Informarli individualmente comporterebbe uno sforzo sproporzionato ai sensi dell’art. 14(5)(b) GDPR; la presente informativa, resa pubblicamente accessibile, assolve a tale obbligo.</li>
        <li><strong>Diritti:</strong> ogni coautore può in qualsiasi momento richiedere la rettifica della grafia del proprio nome oppure opporsi al trattamento, scrivendo all’indirizzo indicato sopra. Le richieste sono gestite senza ritardo.</li>
      </ul>`,
    ],
  },
  {
    id: 'con-consenso',
    titolo: '4. Dati trattati solo con il tuo consenso',
    corpo: [
      '<h3>Stato predefinito: tutto disattivato</h3>',
      '<p>Nessuna delle due funzioni descritte in questo paragrafo si attiva automaticamente.</p>',
      '<p>Lo stato iniziale del sito, per chiunque e su qualunque dispositivo, è <strong>di rifiuto</strong>. Finché non compi un’azione positiva ed esplicita di accettazione, non viene scaricato alcun contenuto da terzi, non viene archiviato nulla sul tuo dispositivo oltre a quanto indicato al § 3.2, e nessuna richiesta raggiunge i soggetti indicati.</p>',
      '<p>Equivalgono a rifiuto, e producono esattamente lo stesso effetto tecnico: chiudere il banner con la «✕», premere «Rifiuta», ignorare il banner, proseguire la navigazione senza rispondere. Nessun comportamento passivo può essere interpretato come consenso, in conformità all’art. 4(11) e al considerando 32 del GDPR.</p>',
      '<p>L’unica differenza tra il rifiuto espresso e l’assenza di scelta riguarda il banner stesso: se rifiuti esplicitamente, la scelta viene registrata e non ti verrà richiesta di nuovo per sei mesi; se non rispondi, il banner potrà essere riproposto in una visita successiva.</p>',
      '<h3>4.1 Ricerca semantica</h3>',
      '<p>La ricerca del sito funziona in due modalità.</p>',
      '<p>La <strong>ricerca testuale</strong> è sempre attiva, non richiede consenso e non comporta alcun trattamento ulteriore: confronta ciò che digiti con un indice statico servito da questo dominio.</p>',
      '<p>La <strong>ricerca semantica</strong> aggiunge la capacità di trovare contenuti concettualmente affini anche quando non contengono le parole che hai digitato. Per farlo, il browser deve scaricare circa 33 MB — un modello linguistico di circa 22 MB più il runtime che lo esegue — serviti da questo stesso dominio, e conservarli nella memoria cache del browser per non doverli riscaricare a ogni visita.</p>',
      '<p><strong>Ciò che digiti non lascia mai il tuo browser.</strong> L’elaborazione avviene interamente sul tuo dispositivo: non esiste alcun registro delle ricerche, né lato server né altrove. Nessuno — nemmeno il titolare — può sapere cosa hai cercato.</p>',
      '<p><strong>Base giuridica:</strong> consenso, art. 6(1)(a) GDPR e art. 122 Codice Privacy per l’archiviazione sul dispositivo.</p>',
      '<p><strong>Se non presti il consenso:</strong> la ricerca continua a funzionare in modalità testuale. Non viene scaricato nulla e non viene archiviato nulla sul tuo dispositivo.</p>',
      '<h3>4.2 Video YouTube</h3>',
      '<p>Alcuni articoli contengono video ospitati su YouTube. L’anteprima che vedi nella pagina è un’immagine statica servita da questo dominio: <strong>aprendo la pagina non viene contattato alcun server di Google</strong>.</p>',
      '<p>Il video viene caricato <strong>solo se lo richiedi espressamente</strong>. In quel momento il browser stabilisce una connessione con i server di Google e vengono comunicati: il tuo indirizzo IP; informazioni sul browser e sul dispositivo; l’indirizzo della pagina da cui stai guardando il video; eventuali dati già presenti nel tuo browser relativi al tuo account Google, se hai effettuato l’accesso.</p>',
      '<p>Viene utilizzata la modalità <em>privacy avanzata</em> (dominio <code>youtube-nocookie.com</code>), che <strong>riduce ma non elimina</strong> questi trattamenti: Google può comunque archiviare informazioni sul tuo dispositivo e associare la visione al tuo profilo.</p>',
      '<p>Da quel momento <strong>il trattamento è effettuato da Google in qualità di titolare autonomo</strong>, secondo le proprie condizioni. Il titolare di questo sito non ha accesso a tali dati né alcun controllo su di essi. Per saperne di più: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">informativa privacy di Google</a>.</p>',
      '<p><strong>Base giuridica:</strong> consenso, art. 6(1)(a) GDPR e art. 122 Codice Privacy. <strong>Destinatari:</strong> Google Ireland Limited e Google LLC.</p>',
      '<p><strong>Se non presti il consenso:</strong> l’anteprima resta visibile insieme al titolo del video e a un collegamento diretto a YouTube, che puoi scegliere di aprire. Nessuna parte dell’articolo diventa inaccessibile.</p>',
      '<h3>4.3 Revoca del consenso</h3>',
      '<p>Puoi <strong>modificare o revocare la tua scelta in qualsiasi momento</strong>, senza doverne indicare il motivo e senza alcuna conseguenza sulla fruibilità del sito, dal collegamento <strong>«Privacy»</strong> presente in fondo a ogni pagina.</p>',
      '<p>La revoca non pregiudica la liceità del trattamento effettuato prima della revoca stessa. Con riferimento ai dati eventualmente già acquisiti da Google, la revoca sul presente sito impedisce ulteriori trasmissioni ma non incide sui trattamenti già effettuati da tale soggetto, verso il quale i diritti vanno esercitati direttamente.</p>',
    ],
  },
  {
    id: 'link-esterni',
    titolo: '5. Collegamenti verso siti esterni',
    corpo: [
      '<p>Il sito contiene collegamenti a risorse esterne: DOI di pubblicazioni scientifiche, archivi istituzionali, repository di codice, profili accademici e social, siti di progetti.</p>',
      '<p>Seguendo tali collegamenti lasci questo sito. Il titolare <strong>non esercita alcun controllo sui siti di destinazione</strong> e non risponde dei loro contenuti né dei trattamenti di dati personali da essi effettuati, disciplinati dalle rispettive informative.</p>',
    ],
  },
  {
    id: 'trasferimenti',
    titolo: '6. Trasferimenti verso Paesi terzi',
    corpo: [
      '<p>Alcuni dei soggetti indicati hanno sede o infrastrutture al di fuori dello Spazio Economico Europeo, in particolare negli Stati Uniti d’America.</p>',
      `<div class="tabella-privacy"><table>
        <thead><tr><th>Soggetto</th><th>Trattamento</th><th>Garanzia per il trasferimento</th></tr></thead>
        <tbody>
          <tr><td>GitHub, Inc. (Microsoft)</td><td>hosting e registri di accesso</td><td>Decisione di adeguatezza <em>EU–US Data Privacy Framework</em>; clausole contrattuali tipo</td></tr>
          <tr><td>Google Ireland Ltd. / Google LLC</td><td>riproduzione dei video, <strong>solo previo consenso</strong></td><td>Decisione di adeguatezza <em>EU–US Data Privacy Framework</em>; clausole contrattuali tipo</td></tr>
        </tbody>
      </table></div>`,
      '<p>I trasferimenti avvengono ai sensi degli articoli 44 e seguenti del GDPR. Puoi ottenere maggiori informazioni sulle garanzie adottate scrivendo all’indirizzo indicato sopra.</p>',
    ],
  },
  {
    id: 'conservazione',
    titolo: '7. Periodi di conservazione',
    corpo: [
      `<ul>
        <li><strong>Registri di accesso dell’hosting:</strong> secondo le politiche del fornitore; non accessibili al titolare.</li>
        <li><strong>Archiviazione tecnica di sessione:</strong> fino alla chiusura della scheda del browser.</li>
        <li><strong>Preferenze sul consenso:</strong> fino a 6 mesi, o fino a quando non le modifichi.</li>
        <li><strong>Modello della ricerca semantica:</strong> nella cache del tuo browser, finché non la svuoti o non revochi il consenso.</li>
        <li><strong>Corrispondenza email:</strong> per il tempo necessario a gestire la richiesta.</li>
        <li><strong>Dati bibliografici:</strong> finché la pubblicazione resta presente sul sito.</li>
      </ul>`,
    ],
  },
  {
    id: 'diritti',
    titolo: '8. I tuoi diritti',
    corpo: [
      '<p>In relazione ai dati che ti riguardano puoi esercitare, ai sensi degli articoli 15-22 del GDPR, i diritti di:</p>',
      `<ul>
        <li><strong>accesso</strong> — sapere se e quali dati sono trattati e ottenerne copia;</li>
        <li><strong>rettifica</strong> — correggere dati inesatti o incompleti;</li>
        <li><strong>cancellazione</strong> — ottenere l’eliminazione dei dati, nei casi previsti;</li>
        <li><strong>limitazione</strong> — chiedere la sospensione del trattamento;</li>
        <li><strong>portabilità</strong> — ricevere i dati in formato strutturato, ove applicabile;</li>
        <li><strong>opposizione</strong> — opporti in qualsiasi momento ai trattamenti fondati sul legittimo interesse, per motivi connessi alla tua situazione particolare;</li>
        <li><strong>revoca del consenso</strong> — in qualsiasi momento, con le modalità del § 4.3.</li>
      </ul>`,
      '<p>Le richieste vanno inviate all’indirizzo indicato al § 1 e ricevono riscontro entro un mese, prorogabile nei casi previsti dall’art. 12(3) GDPR.</p>',
      '<p>Se ritieni che il trattamento violi la normativa, hai diritto di proporre <strong>reclamo al Garante per la protezione dei dati personali</strong> (Piazza Venezia 11, 00187 Roma — <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>) o all’autorità di controllo dello Stato in cui risiedi, oppure di ricorrere all’autorità giudiziaria.</p>',
    ],
  },
  {
    id: 'automatizzate',
    titolo: '9. Processi decisionali automatizzati',
    corpo: [
      '<p>Il titolare non effettua profilazione né adotta decisioni basate unicamente su trattamenti automatizzati ai sensi dell’art. 22 GDPR.</p>',
      '<p>Resta inteso che Google, ove tu presti il consenso alla riproduzione dei video, può effettuare attività di profilazione secondo le proprie condizioni, sulle quali il titolare non ha controllo.</p>',
    ],
  },
  {
    id: 'minori',
    titolo: '10. Minori',
    corpo: [
      '<p>Il sito non è rivolto a minori di anni quattordici e non raccoglie consapevolmente i loro dati. I contenuti didattici sono destinati a studenti universitari.</p>',
    ],
  },
  {
    id: 'conferimento',
    titolo: '11. Natura del conferimento',
    corpo: [
      '<p>Nessun conferimento di dati è obbligatorio. Il mancato consenso alle funzioni descritte al § 4 comporta unicamente la loro disattivazione, senza alcuna limitazione all’accesso ai contenuti del sito.</p>',
    ],
  },
  {
    id: 'modifiche',
    titolo: '12. Modifiche',
    corpo: [
      '<p>La presente informativa può essere aggiornata per adeguarla a modifiche del sito o della normativa. La data in testa al documento indica l’ultima revisione. Le modifiche sostanziali che incidono sui consensi già raccolti comportano una nuova richiesta di consenso.</p>',
    ],
  },
];

export const getInformativa = (lingua: Lingua): Sezione[] => (lingua === 'it' ? it : en);
