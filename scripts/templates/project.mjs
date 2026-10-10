import { escapeHtml as e } from '../lib/util.mjs';
import { icons, picture, sourceLabel, cropMarks } from './partials.mjs';

export function projectPage(ctx, p, next) {
  const { base, categories, config } = ctx;
  const cat = categories.find((c) => c.id === p.category);
  const catIndex = config.categories.findIndex((c) => c.id === p.category) + 1;
  const year = new Date(p.publishedAt).getFullYear();
  const [hero, ...gallery] = p.images;
  const s = p.seo;

  const meta = [
    ['Anno', String(year)],
    ['Categoria', cat?.label],
    s.services?.length && ['Servizi', s.services.join(', ')],
    s.client && ['Cliente', s.client],
  ].filter(Boolean);

  const nextCover = next.images[0];

  return `<article class="project" data-project>
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${base}">Home</a><span aria-hidden="true">/</span><a href="${base}#lavori">Lavori</a><span aria-hidden="true">/</span><span aria-current="page">${e(s.title)}</span></nav>
  <header class="project__head">
    ${cropMarks}
    <p class="project__cat"><span class="sec-num" aria-hidden="true">${String(catIndex).padStart(2, '0')}.</span> ${e(cat?.label || '')}</p>
    <h1 data-split-words>${e(s.title)}</h1>
    <dl class="project__meta" data-reveal>
      ${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${e(v)}</dd></div>`).join('')}
      ${p.sourceUrl ? `<div><dt>Pubblicato su</dt><dd><a href="${e(p.sourceUrl)}" target="_blank" rel="noopener">${icons[p.source] || ''} ${sourceLabel[p.source]} ↗</a></dd></div>` : ''}
    </dl>
  </header>
  <figure class="project__hero" data-zoom>
    ${picture(ctx, hero, { eager: true, sizes: '(min-width: 1400px) 1300px, 100vw', vt: `p-${p.id}` })}
  </figure>
  <div class="project__body">
    <p class="lead" data-reveal>${e(s.intro)}</p>
    ${(s.sections || []).map((sec) => `<section data-reveal>${sec.heading ? `<h2>${e(sec.heading)}</h2>` : ''}<p>${e(sec.text)}</p></section>`).join('\n    ')}
    ${s.keywords?.length ? `<ul class="tags" aria-label="Parole chiave">${s.keywords.map((k) => `<li>#${e(k)}</li>`).join('')}</ul>` : ''}
  </div>
  ${gallery.length ? `<div class="project__gallery">${gallery.map((img, i) => {
    // Ritmo: una immagine larga, poi due affiancate. Un'immagine rimasta sola diventa larga.
    const wide = i % 3 === 0 || (i === gallery.length - 1 && i % 3 === 1);
    return `<figure data-reveal data-zoom class="${wide ? 'wide' : ''}">${picture(ctx, img, { sizes: wide ? '100vw' : '(min-width: 900px) 50vw, 100vw' })}</figure>`;
  }).join('')}</div>` : ''}
  <aside class="cta-band" data-reveal>
    <p>Hai in mente qualcosa di simile?</p>
    <a class="btn btn--primary" href="${base}#contatti" data-magnetic>Parliamone <span aria-hidden="true">→</span></a>
  </aside>
  <a class="next" href="${base}progetti/${next.slug}/" data-cursor="Avanti">
    <span class="next__label">Prossimo progetto</span>
    <span class="next__title">${e(next.seo.title)}</span>
    <span class="next__img">${picture(ctx, nextCover, { sizes: '40vw' })}</span>
  </a>
</article>
<dialog class="lightbox" data-lightbox aria-label="Immagine ingrandita">
  <button class="lightbox__close" type="button" data-close aria-label="Chiudi">✕</button>
  <button class="lightbox__nav lightbox__nav--prev" type="button" data-prev aria-label="Immagine precedente">←</button>
  <img alt="">
  <button class="lightbox__nav lightbox__nav--next" type="button" data-next aria-label="Immagine successiva">→</button>
</dialog>`;
}

export function privacyPage(ctx) {
  const { config } = ctx;
  return `<article class="page">
  ${cropMarks}
  <h1>Informativa privacy</h1>
  <p class="lead">Questo sito è un portfolio personale. Raccoglie solo i dati che decidi di inviarmi tramite il modulo contatti.</p>
  <h2>Titolare del trattamento</h2>
  <p>${e(config.site.name)} – ${e(config.contact.email)}</p>
  <h2>Quali dati e perché</h2>
  <p>Nome, email, eventuale azienda, budget indicativo e messaggio che inserisci nel modulo contatti. Li uso esclusivamente per risponderti e, se lo desideri, per preparare una proposta. Base giuridica: misure precontrattuali su tua richiesta (art. 6.1.b GDPR).</p>
  <h2>Come vengono inviati</h2>
  <p>Il modulo inoltra il messaggio alla mia casella email tramite un servizio di invio moduli (${e(config.contact.form.provider || 'email')}). I dati non vengono pubblicati né ceduti a terzi per finalità commerciali.</p>
  <h2>Cookie e tracciamento</h2>
  <p>Questo sito non usa cookie di profilazione né strumenti di analisi. I font sono ospitati direttamente sul sito, senza richieste a servizi esterni. Le preferenze di navigazione (ad esempio l'animazione iniziale già vista) restano solo nel tuo browser.</p>
  <h2>Conservazione e diritti</h2>
  <p>Conservo i messaggi per il tempo necessario a gestire la richiesta. Puoi chiedere accesso, rettifica o cancellazione dei tuoi dati scrivendo a <a href="mailto:${e(config.contact.email)}">${e(config.contact.email)}</a>, e hai diritto di proporre reclamo al Garante per la protezione dei dati personali.</p>
</article>`;
}

export function notFoundPage(ctx) {
  return `<section class="page page--404">
  ${cropMarks}
  <p class="big404" aria-hidden="true">4<span>0</span>4</p>
  <h1>Questa pagina ha preso un'altra forma.</h1>
  <p class="lead">Il link potrebbe essere cambiato. Torna ai lavori e trova quello che cercavi.</p>
  <a class="btn btn--primary" href="${ctx.base}#lavori">Vai ai lavori</a>
</section>`;
}
